import subprocess
import venv

from boot.utils.misc import IS_WINDOWS, VENV_DIR, REQ_FILE, vprint, ToolEnvPaths

def run(cmd, check=True):
    cmd_strs = [str(c) for c in cmd] #typeerror fix on windows
    print(">", " ".join(cmd_strs))
    subprocess.run(cmd, check=check) #check status code

def ensure_venv(verbose=False):
    if not VENV_DIR.exists():
        vprint("Creating virtual environment...", verbose)
        vprint("This may take a while...", verbose)
        venv.create(VENV_DIR, with_pip=True)
    else:
        vprint("Virtual environment already exists.", verbose)

    #get venv python path
    if IS_WINDOWS:
        python_bin = VENV_DIR / "Scripts" / "python.exe"
    else:
        python_bin = VENV_DIR / "bin" / "python"

    #upgrade pip
    run([python_bin, "--version"])
    run([python_bin, "-m", "pip", "install", "--upgrade", "pip"])
    run([python_bin, "-m", "pip", "install", "--upgrade", "-r", REQ_FILE])

    run([python_bin, "-m", "pip", "list"])

    return python_bin


def upgrade_ytdlp(python_bin, verbose=False):
    """
    Specifically handles nightly/pre-release installation of yt-dlp
    """
    vprint("Checking for yt-dlp nightly updates...", verbose)

    #use -U to force upgrade and --pre for nightly builds
    #[default] ensures core dependencies are included
    cmd = [
        python_bin, "-m", "pip", "install",
        "-U", "--pre",
        "yt-dlp[default]"
    ]

    try:
        run(cmd, check=True)
        vprint("yt-dlp nightly is up to date.", verbose)
    except Exception as e:
        vprint(f"Failed to upgrade yt-dlp: {e}", verbose)


def setup_all(verbose=False):
    python_bin = ensure_venv(verbose=verbose)

    upgrade_ytdlp(python_bin=python_bin, verbose=verbose)

    return ToolEnvPaths(
        name="python",
        env_paths={
            "PYTHON_BIN_PATH": python_bin
        }
    )




################################################
if __name__ == "__main__":
    python_bin = ensure_venv(verbose=True)
