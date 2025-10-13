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

ENV_FILE = ROOT_DIR / ".env"




def vprint(message, verbose=False):
    if verbose:
        print(message)
