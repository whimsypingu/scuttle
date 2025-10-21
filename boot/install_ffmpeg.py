import os
import sys
import shutil
import tempfile
import zipfile
import urllib.request
from pathlib import Path
import subprocess
from boot.utils.misc import IS_WINDOWS, IS_MAC, IS_LINUX, VENV_DIR, vprint

# FFMPEG_URLS = {
#     ("Windows", "AMD64"): "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
#     ("Linux", "x86_64"): "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
#     ("Darwin", "arm64"): "https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip",
# }



def has_ffmpeg() -> bool:
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        return False

    try:
        result = subprocess.run(
            [ffmpeg_path, "-version"],
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



def install_ffmpeg_macos(verbose=False):
    url = "https://evermeet.cx/ffmpeg/getrelease/zip"

    venv_bin = VENV_DIR / "bin"  # macOS/Linux use "bin", not "Scripts"

    with tempfile.TemporaryDirectory() as tmp:
        archive_path = Path(tmp) / "ffmpeg.zip"
        vprint(f"⬇️  Downloading ffmpeg static build from {url} ...", verbose)

        with urllib.request.urlopen(url) as response, open(archive_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)

        vprint("📦 Extracting archive ...", verbose)
        extract_dir = Path(tmp) / "extracted"
        shutil.unpack_archive(archive_path, extract_dir)

        # Move ffmpeg + ffprobe to venv/bin
        for name in ("ffmpeg", "ffprobe"):
            src = next(extract_dir.rglob(name), None)
            if src and src.is_file():
                dest = venv_bin / name
                shutil.copy2(src, dest)
                os.chmod(dest, 0o755)
                vprint(f"✅ Installed {dest.name} to {venv_bin}", verbose)

    vprint("🎉 ffmpeg and ffprobe installed successfully!", verbose)



def install_ffmpeg_linux(verbose=False):
    url = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
    venv_bin = VENV_DIR / "bin"

    with tempfile.TemporaryDirectory() as tmp:
        archive_path = Path(tmp) / "ffmpeg.tar.xz"
        vprint(f"⬇️  Downloading ffmpeg static build from {url} ...", verbose)

        with urllib.request.urlopen(url) as response, open(archive_path, "wb") as out_file:
            shutil.copyfileobj(response, out_file)

        vprint("📦 Extracting archive ...", verbose)
        extract_dir = Path(tmp) / "extracted"
        shutil.unpack_archive(archive_path, extract_dir)

        # find ffmpeg and ffprobe in extracted folder
        for name in ("ffmpeg", "ffprobe"):
            src = next(extract_dir.rglob(name), None)
            if src and src.is_file():
                dest = venv_bin / name
                shutil.copy2(src, dest)
                os.chmod(dest, 0o755)
                vprint(f"✅ Installed {dest.name} to {venv_bin}", verbose)

    vprint("🎉 ffmpeg and ffprobe installed successfully on Linux!", verbose)




def install_ffmpeg(verbose=False):
    if not has_ffmpeg():
        if IS_WINDOWS:
            install_ffmpeg_windows(verbose=verbose)
        elif IS_MAC:
            install_ffmpeg_macos(verbose=verbose)
        elif IS_LINUX:
            install_ffmpeg_linux(verbose=verbose)
        else:
            vprint("Unsupported OS for automatic ffmpeg install", verbose)
    else:
        vprint("ffmpeg already installed", verbose)




if __name__ == "__main__":
    print("running")
    if not has_ffmpeg():
        print("not has")
        install_ffmpeg_windows()
    else:
        print("has")
