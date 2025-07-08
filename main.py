from globals import *
from utils import *

import subprocess
import signal
import sys
import time
import os
from dotenv import load_dotenv
from pyngrok import ngrok, exception


def start_server():
    return subprocess.Popen([sys.executable, "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

def start_ngrok(port):
    ngrok_auth_token = os.getenv("NGROK_AUTH_TOKEN")
    if not ngrok_auth_token:
        raise ValueError("NGROK_AUTH_TOKEN not found in environment variables. Please set it in your .env file.")

    ngrok.set_auth_token(ngrok_auth_token)
    tunnel = ngrok.connect(port)
    print("Ngrok tunnel URL:", tunnel.public_url)
    return tunnel

def shutdown(server_proc, tunnel):
    print("Shutting down...")

    # Try to disconnect ngrok tunnel if it exists
    if tunnel:
        try:
            ngrok.disconnect(tunnel.public_url)
            print("Ngrok tunnel disconnected.")
        except exception.PyngrokNgrokURLError as e:
            print(f"Warning: Could not disconnect ngrok tunnel: {e}")

    # Kill ngrok process if it’s running
    try:
        ngrok.kill()
        print("Ngrok process killed.")
    except Exception as e:
        print(f"Warning: Could not kill ngrok process: {e}")

    # Terminate your server process gracefully
    if server_proc:
        server_proc.terminate()
        server_proc.wait()
        print("Server process terminated.")

def main():
    load_dotenv()
    server_proc = start_server()
    tunnel = start_ngrok(8000)

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
    #main()

    start_server()

'''
delete_db()
print()

init_db()
print()

view_db()
print()

t = Track(
    "0LMwgWFzDjU", "tree among shrubs", "men i trust", 100
)

add_track_to_db(t)
print()

view_db()




    t = Track(
        "uQgI1XNtwrw", "lose control", "jj lin", 101
    )
    t2 = Track(
        "DnZ2xE8DhwY", "broken record", "gsoul", 102
    )
    add_track_to_db(t)
    add_track_to_db(t2)

    print()
    view_db()
'''