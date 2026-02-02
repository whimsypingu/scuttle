import os
import shutil
import tempfile
from typing import Optional
import zipfile
import urllib.request
from pathlib import Path
from boot.utils.misc import IS_WINDOWS, IS_MAC, IS_LINUX, TOOLS_DIR, vprint, ToolEnvPaths

# FFMPEG_URLS = {
#     ("Windows", "AMD64"): "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
#     ("Linux", "x86_64"): "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
#     ("Darwin", "arm64"): "https://evermeet.cx/ffmpeg/ffmpeg-6.0.zip",
# }

FFMPEG_BIN_NAME = "ffmpeg.exe" if IS_WINDOWS else "ffmpeg"
FFPROBE_BIN_NAME = "ffprobe.exe" if IS_WINDOWS else "ffprobe"

def has_ff_bin(ff_bin: str) -> Optional[Path]:
    #tools folder check
    local_ff_bin = TOOLS_DIR / ff_bin
    return local_ff_bin.resolve() if local_ff_bin.exists() else None

#fw the emojis HEAVY here actually
def install_ffmpeg_windows(verbose=False):
    url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

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
                if name.lower() in (FFMPEG_BIN_NAME, FFPROBE_BIN_NAME):
                    src = Path(root) / name
                    dest = TOOLS_DIR / name
                    shutil.copy2(src, dest)

                    vprint(f"✅ Installed {dest.name} to {TOOLS_DIR}", verbose)

    vprint("🎉 ffmpeg and ffprobe installed successfully!", verbose)

    return ToolEnvPaths(
        name="ffmpeg",
        env_paths={
            "FFMPEG_LOCATION": TOOLS_DIR,
            "FFMPEG_BIN_PATH": TOOLS_DIR / FFMPEG_BIN_NAME,
            "FFPROBE_BIN_PATH": TOOLS_DIR / FFPROBE_BIN_NAME,
        }
    )



def install_ffmpeg_macos(verbose=False):
    url = "https://evermeet.cx/ffmpeg/getrelease/zip"

    with tempfile.TemporaryDirectory() as tmp:
        archive_path = Path(tmp) / "ffmpeg.zip"
        vprint(f"⬇️  Downloading ffmpeg static build from {url} ...", verbose)

        with urllib.request.urlopen(url) as response, open(archive_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)

        vprint("📦 Extracting archive ...", verbose)
        extract_dir = Path(tmp) / "extracted"
        shutil.unpack_archive(archive_path, extract_dir)

        # Move ffmpeg + ffprobe to venv/bin
        for name in (FFMPEG_BIN_NAME, FFPROBE_BIN_NAME):
            src = next(extract_dir.rglob(name), None)
            if src and src.is_file():
                dest = TOOLS_DIR / name
                shutil.copy2(src, dest)
                os.chmod(dest, 0o755)

                vprint(f"✅ Installed {dest.name} to {TOOLS_DIR}", verbose)

    vprint("🎉 ffmpeg and ffprobe installed successfully!", verbose)

    return ToolEnvPaths(
        name="ffmpeg",
        env_paths={
            "FFMPEG_LOCATION": TOOLS_DIR,
            "FFMPEG_BIN_PATH": TOOLS_DIR / FFMPEG_BIN_NAME,
            "FFPROBE_BIN_PATH": TOOLS_DIR / FFPROBE_BIN_NAME,
        }
    )





def install_ffmpeg_linux(verbose=False):
    url = "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"

    with tempfile.TemporaryDirectory() as tmp:
        archive_path = Path(tmp) / "ffmpeg.tar.xz"
        vprint(f"⬇️  Downloading ffmpeg static build from {url} ...", verbose)

        with urllib.request.urlopen(url) as response, open(archive_path, "wb") as out_file:
            shutil.copyfileobj(response, out_file)

        vprint("📦 Extracting archive ...", verbose)
        extract_dir = Path(tmp) / "extracted"
        shutil.unpack_archive(archive_path, extract_dir)

        # find ffmpeg and ffprobe in extracted folder
        for name in (FFMPEG_BIN_NAME, FFPROBE_BIN_NAME):
            src = next(extract_dir.rglob(name), None)
            if src and src.is_file():
                dest = TOOLS_DIR / name
                shutil.copy2(src, dest)
                os.chmod(dest, 0o755)

                vprint(f"✅ Installed {dest.name} to {TOOLS_DIR}", verbose)

    vprint("🎉 ffmpeg and ffprobe installed successfully on Linux!", verbose)

    return ToolEnvPaths(
        name="ffmpeg",
        env_paths={
            "FFMPEG_LOCATION": TOOLS_DIR,
            "FFMPEG_BIN_PATH": TOOLS_DIR / FFMPEG_BIN_NAME,
            "FFPROBE_BIN_PATH": TOOLS_DIR / FFPROBE_BIN_NAME,
        }
    )




def install_ffmpeg(verbose=False):
    ffmpeg_bin_path = has_ff_bin(FFMPEG_BIN_NAME)
    ffprobe_bin_path = has_ff_bin(FFPROBE_BIN_NAME)

    #condition of installation, both present and in same folder
    is_healthy = False
    if ffmpeg_bin_path and ffprobe_bin_path:
        if ffmpeg_bin_path.parent == ffprobe_bin_path.parent:
            is_healthy = True

    #install if ffmpeg or ffprobe not found, or if they are not sharing a parent directory (required by yt-dlp)
    if not is_healthy:
        vprint("Installing ffmpeg binaries", verbose)

        TOOLS_DIR.mkdir(exist_ok=True)

        if IS_WINDOWS:
            return install_ffmpeg_windows(verbose)
        elif IS_MAC:
            return install_ffmpeg_macos(verbose)
        elif IS_LINUX:
            return install_ffmpeg_linux(verbose)
        
        #no installation, return nothing
        else:
            vprint("Unsupported OS for automatic ffmpeg install", verbose)
            return ToolEnvPaths(name="ffmpeg", env_paths={})
        
    #already healthy, return verified paths
    vprint("ffmpeg already installed", verbose)
    return ToolEnvPaths(
        name="ffmpeg",
        env_paths={
            "FFMPEG_LOCATION": ffmpeg_bin_path.parent,
            "FFMPEG_BIN_PATH": ffmpeg_bin_path,
            "FFPROBE_BIN_PATH": ffprobe_bin_path,
        }
    )




if __name__ == "__main__":
    install_ffmpeg_windows()

'''    print("running")
    if not has_ffmpeg():
        print("not has")
        install_ffmpeg_windows()
    else:
        print("has")
'''