from queue import Empty
import re
import stat
import subprocess
import sys
import platform
import time
import requests

from boot.utils.misc import ENV_FILE, IS_WINDOWS, TOOLS_DIR, vprint
from boot.utils.threads import drain_output


def save_cloudflared_path(file_path):
    kv = f"TUNNEL_BIN_PATH={file_path}\n"
    with ENV_FILE.open("a") as f:
        f.write(kv)


def _get_cloudflared_name():
    system = sys.platform
    machine = platform.machine().lower()

    #platform/arch to release name, may require updating
    if system.startswith("win"):
        asset_name = "cloudflared-windows-amd64.exe"
    elif system == "darwin":
        # Apple silicon vs intel
        if machine in ("arm64", "aarch64"):
            asset_name = "cloudflared-darwin-arm64"
        else:
            asset_name = "cloudflared-darwin-amd64"
    elif system.startswith("linux"):
        if machine in ("aarch64", "arm64"):
            asset_name = "cloudflared-linux-arm64"
        else:
            asset_name = "cloudflared-linux-amd64"
    else:
        raise RuntimeError(f"Unsupported platform: {system}/{machine}")

    #https://github.com/cloudflare/cloudflared/releases/download/2025.9.1/cloudflared-windows-amd64.exe
    #https://github.com/cloudflare/cloudflared/releases/download/2025.9.1/cloudflared-linux-amd64
    #gets the download link for the latest release version
    r = requests.get("https://api.github.com/repos/cloudflare/cloudflared/releases/latest")
    release_data = r.json()

    for asset in release_data.get("assets", []):
        if asset["name"] == asset_name:
            url = asset["browser_download_url"]
    
    return {
        "asset_name": asset_name,
        "url": url
    }


def download_cloudflared(target_path=None, verbose=False):
    """
    Download cloudflared binary for this platform into target_path (Path).
    This uses Cloudflare's GitHub releases pattern
    https://github.com/cloudflare/cloudflared/releases
    """
    cf_metadata = _get_cloudflared_name()
    asset_name = cf_metadata["asset_name"]
    url = cf_metadata["url"]

    #download
    vprint(f"Downloading cloudflared from {url} ...", verbose)

    #prepare directory and download in chunks to a temp file before swapping
    if target_path is None:
        TOOLS_DIR.mkdir(parents=True, exist_ok=True)
        target_path = TOOLS_DIR / asset_name

    temp_path = target_path.with_suffix(target_path.suffix + ".part") if target_path.suffix else target_path.with_suffix(".part")
    try:
        with requests.get(url, stream=True, timeout=60) as r:
            r.raise_for_status() #status code raises error on 4xx/5xx codes

            #ensure directory exists
            temp_path.parent.mkdir(parents=True, exist_ok=True)
            with open(temp_path, "wb") as f:
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)

        #atomic replace (works on same filesystem)
        temp_path.replace(target_path)

        #set execute bit for unix-like systems
        if not IS_WINDOWS:
            mode = target_path.stat().st_mode
            target_path.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH) #adds execute ability for all groups

        vprint(f"Saved cloudflared to {target_path}", verbose)

        #save to .env file
        save_cloudflared_path(target_path)

        return target_path

    except Exception:
        #cleanup partial file if anything went wrong
        try:
            if temp_path.exists():
                temp_path.unlink()
        except Exception:
            pass
        raise




def start_cloudflared(bin_path, url="http://localhost:8000"):
    """
    Start cloudflared as a subprocess.
    
    Args:
        bin_path (str, optional): path to cloudflared binary; if None, find_cloudflared() is used
        url (str, optional): --url value forwarded to origin. Defaults to "http://localhost:8000"
    
    Returns:
        subprocess.Popen object(stdout is a PIPE combined with stderr)
    """
    if not bin_path:
        raise FileNotFoundError("Cloudflared binary not found supplied")
    
    cmd = [
        bin_path,
        "tunnel",
        "--url", url
    ]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    #start background reader thread to drain output
    stdout_queue = drain_output(proc)
    
    #return proc and queue so caller can read lines
    return proc, stdout_queue



_url_re = re.compile(r"https?://[a-z0-9-]+\.trycloudflare\.com/?", re.IGNORECASE)

def _extract_cloudflared_url(line: str):
    """Returns the most likely http(s) URL in a line or None."""
    if not line:
        return None
    
    m = _url_re.search(line)

    if not m:
        return None
    
    return m.group(0).strip()


def get_cloudflared_url(stdout_queue, timeout=60, verbose=False):
    """
    Read queued lines from stdout until we get a public tunnel URL or timeout
    
    Args:
        stdout_queue (Queue): Queue returned by start_cloudflared()
        timeout (float): seconds to wait before giving up. Defaults to 60s.
        verbose (bool): Logs. Defaults to False.
    """
    last_url = None
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            line = stdout_queue.get(timeout=0.5)
        except Empty: #empty queue
            continue
        
        #log
        vprint(f"[cloudflared] {line}", verbose)

        url = _extract_cloudflared_url(line)
        if url:
            if url.startswith("https://"):

                #log
                vprint(f"[cloudflared] extracted url successfully at {url}", verbose)
                return url
            
            #keeps looking if not a secure link
            last_url = url
    
    #timed out
    vprint(f"[cloudflared] Timed out, last url found is {last_url}", verbose=True)
    return last_url



if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    download_cloudflared(verbose=True)