import stat
import sys
import platform
import urllib.request
import json
import io
import os
import zipfile

from boot.utils.misc import IS_WINDOWS, TOOLS_DIR, vprint, update_env


def _get_deno_name():
    system = sys.platform
    machine = platform.machine().lower()

    #platform/arch to release name, may require updating
    if machine in ("arm64", "aarch64"):
        arch = "aarch64"
    else:
        arch = "x86_64"

    #os
    if system.startswith("win"):
        os_part = "pc-windows-msvc"
    elif system == "darwin":
        os_part = "apple-darwin"
    elif system.startswith("linux"):
        os_part = "unknown-linux-gnu"
    else:
        raise RuntimeError(f"Unsupported platform: {system}/{machine}")
    
    asset_name = f"deno-{arch}-{os_part}.zip"

    #gets the download link for the latest release version
    #url = "https://api.github.com/repos/cloudflare/cloudflared/releases/latest"
    url = "https://api.github.com/repos/denoland/deno/releases/latest"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            release_data = json.load(response)
    except Exception as e:
        raise RuntimeError(f"Failed to fetch deno release info: {e}") from e

    download_url = None
    for asset in release_data.get("assets", []):
        if asset.get("name") == asset_name:
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        raise RuntimeError(f"Could not find cloudflared asset for {asset_name}")
        
    return {
        "asset_name": asset_name,
        "url": download_url
    }


def download_deno(target_path=None, verbose=False):
    """
    Download deno binary for this platform into target_path (Path). Defaults to scuttle/tools/
    This uses Deno's GitHub releases pattern
    https://github.com/cloudflare/cloudflared/releases
    """
    cf_metadata = _get_deno_name()
    asset_name = cf_metadata["asset_name"]
    url = cf_metadata["url"]
    binary_name = "deno.exe" if IS_WINDOWS else "deno" #hard-coded executable here hopefully it stays this way

    #download
    vprint(f"Downloading deno from {url} ...", verbose)

    #prepare directory and download in chunks to a temp file before swapping
    if target_path is None:
        TOOLS_DIR.mkdir(parents=True, exist_ok=True)
        target_path = TOOLS_DIR / binary_name

    #do an in-memory download and extraction because deno packages in zip files
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            zip_content = response.read()

        vprint(f"Extracting {binary_name}...", verbose)

        with zipfile.ZipFile(io.BytesIO(zip_content)) as z:
            if binary_name in z.namelist():
                with z.open(binary_name) as source, open(target_path, "wb") as target:
                    target.write(source.read())
            
            else:
                # Fallback in case they change the zip structure
                found = False
                for file in z.namelist():
                    if file.endswith(binary_name):
                        with z.open(file) as source, open(target_path, "wb") as target:
                            target.write(source.read())
                        found = True
                        break
                if not found:
                    raise FileNotFoundError(f"Could not find {binary_name} inside the zip")

        #set execute bit for unix-like systems
        if not IS_WINDOWS:
            mode = target_path.stat().st_mode
            target_path.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH) #adds execute ability for all groups

        vprint(f"Saved deno binary to {target_path}", verbose)

        #save to .env file
        update_env("JS_RUNTIME_BIN_PATH", target_path.as_posix())

        return target_path

    except Exception as e:
        raise RuntimeError(f"Failed to download or extract deno: {e}") from e



################################################
'''
if __name__ == "__main__":

    x = _get_deno_name()
    print(x)

    download_deno(verbose=True)
'''