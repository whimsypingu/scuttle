import os
import shutil
import stat
import subprocess

from queue import Queue, Empty
from threading import Thread

import re
import time

from boot.utils import terminate_process
from boot.utils.threads import drain_output


################################################################

def _ensure_executable(file_path):
    """ensure a file is executable, if it isn't it attempts to set Owner permissions to all."""
    #we're on windows, so don't have to set any bits
    if os.name == "nt":
        return

    #on unix style systems try to set the executable bit best effort
    try:
        st = os.stat(file_path) 
        
        #retrieve metadata (st_mode permissions)
        #st.st_mode -> execute bit set for user, group, or others
        #S_IXUSR -> executable by owner, etc
        if not (st.st_mode & (stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)):
            os.chmod(file_path, 0o755)
    
    except Exception:
        pass

    return

def find_cloudflared():
    """
    Find cloudflared binary.
    
    Lookup order:
        1. local file named 'cloudflared' or 'cloudflared.exe'
        2. binary on PATH via shutil.which('cloudflared')
    
    Returns:
        Absolute path to binary or None if found.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = ["cloudflared", "cloudflared.exe"]
    for name in candidates:
        file_path = os.path.join(here, name)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            _ensure_executable(file_path)
            return os.path.abspath(file_path)

    #fallback to PATH
    path = shutil.which("cloudflared")
    return path


################################################################

def get_cloudflared_version(file_path=None, timeout=5):
    """
    Run 'cloudflared --version' and return stdout or None on error.
    Local version query only.
    """
    file_path = file_path or find_cloudflared()
    if not file_path:
        return None
    
    try:
        proc = subprocess.run(
            [file_path, "--version"], 
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=timeout
        )
        return proc.stdout.strip()
    
    except Exception:
        return None
    

################################################################

def start_cloudflared(file_path=None, url="http://localhost:8000"):
    """
    Start cloudflared as a subprocess.
    
    Args:
        file_path (str, optional): path to cloudflared binary; if None, find_cloudflared() is used
        url (str, optional): --url value forwarded to origin. Defaults to "http://localhost:8000"
    
    Returns:
        subprocess.Popen object(stdout is a PIPE combined with stderr)
    """
    bin_path = file_path or find_cloudflared()
    if not bin_path:
        raise FileNotFoundError("cloudflared binary not found.")
    
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


################################################################

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
        except Empty:
            continue
        
        #log
        if verbose:
            print("[cloudflared]", line)

        url = _extract_cloudflared_url(line)
        if url:
            if url.startswith("https://"):

                #log
                if verbose:
                    print(f"[cloudflared] extracted url successfully at {url}")
                return url
            
            #keeps looking if not a secure link
            last_url = url
    
    #timed out
    print(f"[cloudflared] Timed out, last url found is {last_url}")
    return last_url



# Optional CLI interface for standalone usage thank you yapgpt
if __name__ == "__main__":
    bin_path = find_cloudflared()
    print("\ncloudflared binary:", bin_path)
    print("version:", get_cloudflared_version(bin_path))
    print("\nStarting tunnel for manual test (ctrl+c to stop)...\n")

    proc, stdout_queue = start_cloudflared(bin_path)

    try:
        url = get_cloudflared_url(stdout_queue=stdout_queue, timeout=60)
        if url:
            print(f"\n✅ Tunnel URL found: {url}\n")
        else:
            print("\n❌ Timed out waiting for tunnel URL.\n")

        #keep tunnel process alive
        while proc.poll() is None:
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\nKeyboardInterrupt received, stopping cloudflared...")
        
        terminate_process(proc)