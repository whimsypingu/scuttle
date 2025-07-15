import logging
import subprocess
import threading
import signal
import sys
import time
import os
from dotenv import load_dotenv
from pyngrok import ngrok, exception


# === Logging Setup ===
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# === Constants ===
PORT = 8000


# === Start Uvicorn Server ===
def start_server():
    logger.info("Starting FastAPI server...")
    return subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", str(PORT), "--reload"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
        universal_newlines=True
    )


# === Stream Server Logs in Background ===
def stream_logs(process):
    for line in iter(process.stdout.readline, ""):
        print(line, end="")


# === Start Ngrok Tunnel ===
def start_ngrok():
    logger.info("Starting ngrok tunnel...")
    ngrok_auth_token = os.getenv("NGROK_AUTH_TOKEN")
    if not ngrok_auth_token:
        raise ValueError("NGROK_AUTH_TOKEN not found in environment variables. Please set it in your .env file.")

    ngrok.set_auth_token(ngrok_auth_token)
    tunnel = ngrok.connect(PORT)
    logger.info(f"Ngrok tunnel URL: {tunnel.public_url}")

    with open("ngrok_url.txt", "w") as f:
        f.write(tunnel.public_url)

    return tunnel


# === Graceful Shutdown ===
def shutdown(server_proc, tunnel):
    logger.info("Shutting down...")

    if tunnel:
        try:
            ngrok.disconnect(tunnel.public_url)
            logger.info("Ngrok tunnel disconnected.")
        except exception.PyngrokNgrokURLError as e:
            logger.warning(f"Could not disconnect ngrok tunnel: {e}")

    try:
        ngrok.kill()
        logger.info("Ngrok process killed.")
    except Exception as e:
        logger.warning(f"Could not kill ngrok process: {e}")

    if server_proc:
        server_proc.terminate()
        server_proc.wait()
        logger.info("Server process terminated.")


# === Main Entrypoint ===
def main():
    load_dotenv()
    server_proc = start_server()

    # Start a thread to stream logs
    threading.Thread(target=stream_logs, args=(server_proc,), daemon=True).start()

    # Give the server a moment to start before opening ngrok
    time.sleep(4)
    tunnel = start_ngrok()

    def signal_handler(sig, frame):
        shutdown(server_proc, tunnel)
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown(server_proc, tunnel)


if __name__ == "__main__":
    main()
