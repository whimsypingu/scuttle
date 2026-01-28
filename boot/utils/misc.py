import os
from pathlib import Path
import sys


IS_WINDOWS = os.name == "nt"
IS_MAC = sys.platform == "darwin"
IS_LINUX = sys.platform.startswith("linux")

SYS_PLATFORM = sys.platform

ROOT_DIR = Path(__file__).parent.parent.parent
TOOLS_DIR = ROOT_DIR / "tools"

BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

BOOT_DIR = ROOT_DIR / "boot"
VENV_DIR = ROOT_DIR / "venv"
REQ_FILE = ROOT_DIR / "requirements.txt"

ENV_FILE = ROOT_DIR / ".env"


def update_env(key, value):
    """
    Update or insert a key=value pair in the .env file. 
    DOES NOT call load_dotenv(override=True) afterwards.
    Creates .env file if doesn't exist

    Args:
        key (str): Environment variable name.
        value (str): New value to set.
    """
    new_line = f"{key}={value}\n"

    # Read existing lines if the file exists
    lines = []
    if ENV_FILE.exists():
        with ENV_FILE.open("r") as f:
            lines = f.readlines()

    # Update if key exists, else append
    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = new_line
            updated = True
            break

    if not updated:
        lines.append(new_line)

    # Write all lines back to the .env file
    with ENV_FILE.open("w") as f:
        f.writelines(lines)

    os.environ[key] = str(value) #just in case Path


def vprint(message, verbose=False):
    if verbose:
        print(message)
