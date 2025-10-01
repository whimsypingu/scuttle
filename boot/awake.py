import ctypes
import subprocess
import os
import sys

def _prevent_sleep_windows():
    ES_CONTINUOUS = 0x80000000
    ES_SYSTEM_REQUIRED = 0x00000001
    ctypes.windll.kernel32.SetThreadExecutionState(
        ES_CONTINUOUS | ES_SYSTEM_REQUIRED
    )
    return None

def _allow_sleep_windows():
    #https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadexecutionstate
    ES_CONTINUOUS = 0x80000000
    ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)
    return None

def _prevent_sleep_macos():
    #https://ss64.com/mac/caffeinate.html
    proc = subprocess.Popen([
        "caffeinate", "-i"
    ])
    return proc

def _allow_sleep_macos(proc):
    if proc:
        proc.terminate()
        proc.wait()
    return None

def _prevent_sleep_linux():
    #https://www.freedesktop.org/software/systemd/man/latest/systemd-inhibit.html
    proc = subprocess.Popen([
        "systemd-inhibit",
        "--what=idle",
        "sleep", "infinity"
    ])
    return proc

def _allow_sleep_linux(proc):
    if proc:
        proc.terminate()
        proc.wait()
    return None


def prevent_sleep(verbose=False):
    """
    Enables keeping the system awake indefinitely

    Parameters
        verbose (bool): Logs. Defaults to False

    Returns
        proc (Popen object): For windows returns True, for macOS or linux returns a process, otherwise False
    """
    platform = sys.platform

    #windows
    if platform.startswith("win"):
        _prevent_sleep_windows()
        proc = True
    
    elif platform.startswith("darwin"):
        proc = _prevent_sleep_macos()

    elif platform.startswith("linux"):
        proc = _prevent_sleep_linux()

    else:
        if verbose:
            print(f"[prevent_sleep] failed: Platform [{platform}] not identified")
        return False
    
    #logging
    if verbose:
        print(f"[prevent_sleep] successful")
        
    return proc

def allow_sleep(proc, verbose=False):
    """
    Stops keeping the system awake

    Parameters
        proc (Popen object): Only necessary for macOS and linux
        verbose (bool): Logs. Defaults to False
    """
    platform = sys.platform

    if platform.startswith("win"):
        _allow_sleep_windows()
    
    elif platform.startswith("darwin"):
        _allow_sleep_macos(proc)
    
    elif platform.startswith("linux"):
        _allow_sleep_linux(proc)

    else:
        if verbose:
            print(f"[allow_sleep] failed: Platform [{platform}] not identified")

    #logging
    if verbose:
        print(f"[allow_sleep] successful")
    return 
        
