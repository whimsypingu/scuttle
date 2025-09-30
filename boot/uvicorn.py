import subprocess
import sys

from boot.utils import terminate_process

def start_uvicorn(host="0.0.0.0", port=8000):
    """
    Start the FastAPI app with uvicorn.
    
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

    print(f"[uvicorn] Started wit PID {proc.pid}")
    return proc

# Optional CLI interface for standalone usage thank you yapgpt
if __name__ == "__main__":
    proc = start_uvicorn()
    try:
        # Print stdout lines in real-time
        for line in iter(proc.stdout.readline, ""):
            print(line, end="")
    except KeyboardInterrupt:
        print("KeyboardInterrupt received, terminating uvicorn...")

        terminate_process(proc)