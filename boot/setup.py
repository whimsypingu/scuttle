import os
import subprocess
import venv

from boot.utils.misc import IS_WINDOWS, vprint
from boot.utils.env import update_env
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
    #user venv consent
    consent_venv = input("Do you allow this script to create a virtual environment? (y/n): ").strip().lower()
    if consent_venv != "y":
        print("Skipping virtual environment setup.")
    else:
        ensure_venv(verbose)

    #user cloudflared consent
    consent_cloudflared = input("Do you allow this script to download cloudflared? (y/n): ").strip().lower()
    if consent_cloudflared == "y":
        download_cloudflared(verbose)
    else:
        print("Skipping cloudflared download.")

    #user discord webhook url
    webhook_url = input("Enter your Discord webhook URL (or leave blank to skip): ").strip()
    if webhook_url:
        update_env("DISCORD_WEBHOOK_URL", webhook_url)
        print("Webhook URL saved to .env.")
    else:
        print("Webhook URL set skipped.")


################################################
if __name__ == "__main__":
    python_bin = ensure_venv(verbose=True)
