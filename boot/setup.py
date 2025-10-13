import os
import subprocess
import venv

from boot.utils.misc import IS_WINDOWS, vprint
from boot.tunnel.cloudflared import download_cloudflared

VENV_DIR = "venv"
REQUIREMENTS_FILE = "requirements.txt"

def run(cmd, check=True):
    print(">", " ".join(cmd))
    subprocess.run(cmd, check=check) #check status code

def ensure_venv(verbose=False):
    if not os.path.exists(VENV_DIR):
        vprint("Creating virtual environment...", verbose)
        venv.create(VENV_DIR, with_pip=True)
    else:
        vprint("Virtual environment already exists.", verbose)

    #get venv python path
    if IS_WINDOWS:
        python_bin = os.path.join(VENV_DIR, "Scripts", "python.exe")
    else:
        python_bin = os.path.join(VENV_DIR, "bin", "python")

    #upgrade pip
    run([python_bin, "--version"])
    run([python_bin, "-m", "pip", "install", "--upgrade", "pip"])
    run([python_bin, "-m", "pip", "install", "--upgrade", "-r", REQUIREMENTS_FILE])

    run([python_bin, "-m", "pip", "list"])

    return python_bin


def setup(verbose=False):
    ensure_venv(verbose)
    download_cloudflared(verbose)


################################################
if __name__ == "__main__":
    python_bin = ensure_venv(verbose=True)
