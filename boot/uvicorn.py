import subprocess
import sys
import requests
import time

from boot.utils import terminate_process
from boot.utils.misc import vprint
from boot.utils.threads import drain_output

def start_uvicorn(host="0.0.0.0", port=8000, verbose=False):
    """
    Start the FastAPI app with uvicorn.

    Args:
        host (str): Host address. Defaults to "0.0.0.0" (all interfaces)
        port (int): Port to expose the server on. Defaults to 8000.
        verbose (bool): Logs. Defaults to False
    
    Returns:
        subprocess.Popen object
    """
    cmd = [
        sys.executable, "-m", "uvicorn",
        "backend.server:app",
        "--host", host,
        "--port", str(port),
    ]

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True, #text mode
        bufsize=1, #line buffer
    )

    vprint(f"[uvicorn] Started with PID {proc.pid}", verbose)

    #start background reader thread to drain output
    stdout_queue = drain_output(proc, verbose=verbose)
    
    #return proc and queue so caller can read lines non-blocking by attaching it as a property
    return proc, stdout_queue


def wait_for_uvicorn(host="127.0.0.1", port=8000, timeout=10, verbose=False):
    """
    Wait for the FastAPI app to finish booting
    
    Args:
        host (str): Host address. Defaults to "127.0.0.1" to ensure local health
        port (int): Port the server exposes. Defaults to 8000.
        timeout (float): Seconds after which gives up waiting. Defaults to 10
        verbose (bool): Logs. Defaults to false
    
    Returns:
        bool, True on boot before timeout
    """
    url = f"http://{host}:{port}/"
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url)
            if r.status_code < 500:  # server responded
                
                vprint(f"[uvicorn] Done waiting after {time.time() - start}s", verbose)
                return True
        except requests.exceptions.ConnectionError:
            pass

        time.sleep(0.1)
    return False



################################################
# Optional CLI interface for standalone usage thank you yapgpt
if __name__ == "__main__":
    proc, stdout_queue = start_uvicorn(verbose=True)
    print(wait_for_uvicorn(verbose=True))
    try:
        # Print stdout lines from the queue in real-time
        while True:
            line = stdout_queue.get()  # blocks until a line is available
            if line is None:           # EOF signal
                break
            print(line)
    except KeyboardInterrupt:
        print("KeyboardInterrupt received, terminating uvicorn...")

        terminate_process(proc)