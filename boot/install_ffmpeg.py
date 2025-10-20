import os
import sys
import shutil
import tempfile
import zipfile
import urllib.request
from pathlib import Path
import subprocess
from boot.utils.misc import IS_WINDOWS, VENV_DIR, vprint

# FFMPEG_URLS = {
#     ("Windows", "AMD64"): "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
#     ("Linux", "x86_64"): "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
#     ("Darwin", "arm64"): "https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip",
# }



def has_ffmpeg() -> bool:
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.SubprocessError):
        return False



#fw the emojis HEAVY here actually
def install_ffmpeg_windows(verbose=False):
    url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

    path_dir = VENV_DIR / "Scripts"
    
    with tempfile.TemporaryDirectory() as tmp:
        archive_path = Path(tmp) / "ffmpeg.zip"
        vprint(f"⬇️  Downloading ffmpeg from {url} ...", verbose)

        with urllib.request.urlopen(url) as response, open(archive_path, 'wb') as out_file: 
            shutil.copyfileobj(response, out_file)

        #extract zip
        vprint("📦 Extracting archive ...", verbose)
        extract_dir = Path(tmp) / "extracted"
        with zipfile.ZipFile(archive_path, "r") as zf:
            zf.extractall(extract_dir)

        #find ffmpeg and ffprobe and move it into venv
        for root, _, files in os.walk(extract_dir):
            for name in files:
                if name.lower() in ("ffmpeg.exe", "ffprobe.exe"):
                    src = Path(root) / name
                    dest = path_dir / name
                    shutil.copy2(src, dest)

                    vprint(f"✅ Installed {dest.name} to {path_dir}", verbose)

    vprint("🎉 ffmpeg and ffprobe installed successfully!", verbose)


def install_ffmpeg(verbose=False):
    if not has_ffmpeg():
        if IS_WINDOWS:
            install_ffmpeg_windows(verbose=verbose)
        else:
            pass
    else:
        pass




if __name__ == "__main__":
    print("running")
    if not has_ffmpeg():
        print("not has")
        install_ffmpeg_windows()
    else:
        print("has")
