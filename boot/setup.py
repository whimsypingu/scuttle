import os
import subprocess
import venv
from pathlib import Path

from boot.utils.misc import IS_WINDOWS, VENV_DIR, REQ_FILE, vprint

def run(cmd, check=True):
    cmd_strs = [str(c) for c in cmd] #typeerror fix on windows
    print(">", " ".join(cmd_strs))
    subprocess.run(cmd, check=check) #check status code

def ensure_venv(verbose=False):
    if not VENV_DIR.exists():
        vprint("Creating virtual environment...", verbose)
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


def setup_all(verbose=False):
    python_bin = ensure_venv(verbose=True)



################################################
if __name__ == "__main__":
    python_bin = ensure_venv(verbose=True)
