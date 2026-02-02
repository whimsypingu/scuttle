import subprocess
import venv

from boot.utils.misc import IS_WINDOWS, ROOT_DIR, VENV_DIR, REQ_FILE, vprint, ToolEnvPaths

def run(cmd, check=True, verbose=False):
    cmd_strs = [str(c) for c in cmd] #typeerror fix on windows

    vprint(f"> {' '.join(cmd_strs)}", verbose)

    # stdout/stderr set to None means it prints to the terminal/GUI as normal.
    # Setting them to DEVNULL hides them completely.
    stdout_dest = None if verbose else subprocess.DEVNULL
    stderr_dest = None if verbose else subprocess.DEVNULL
    
    subprocess.run(
        cmd, 
        check=check,
        stdout=stdout_dest,
        stderr=stderr_dest
    )

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
    run([python_bin, "--version"], verbose=verbose)
    run([python_bin, "-m", "pip", "install", "--upgrade", "pip"], verbose=verbose)
    run([python_bin, "-m", "pip", "install", "--upgrade", "-r", REQ_FILE], verbose=verbose)

    #only show full package list if in verbose mode
    if verbose:
        run([python_bin, "-m", "pip", "list"], verbose=verbose)

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
        run(cmd, check=True, verbose=verbose)
        vprint("yt-dlp nightly is up to date.", verbose)
    except Exception as e:
        vprint(f"Failed to upgrade yt-dlp: {e}", verbose)


def setup_all(verbose=False):
    """
    Sets up the venv/ and ytdlp, and returns the Path to the python binary in the venv/
    """
    python_bin = ensure_venv(verbose=verbose)

    upgrade_ytdlp(python_bin=python_bin, verbose=verbose)

    return ToolEnvPaths(
        name="python",
        env_paths={
            "PYTHON_BIN_PATH": python_bin
        }
    )


def create_setup_sentinel_file(verbose=False):
    """
    Attempts 'touch'ing a sentinel file to mark that setup is complete
    """
    sentinel_path = ROOT_DIR / ".setup_done"
    sentinel_path.touch(exist_ok=True)
    vprint(f"Touched file: {sentinel_path}", verbose)



################################################
if __name__ == "__main__":
    python_bin = ensure_venv(verbose=True)
