#!/usr/bin/env python3
"""
supervisor.py

Usage:
  python supervisor.py --webhook https://discord.com/api/webhooks/.... 
  or set env var DISCORD_WEBHOOK and run `python supervisor.py`

What it does:
- starts: uvicorn backend.server:app --host 0.0.0.0
- starts: cloudflared tunnel --url http://localhost:8000 (uses .\cloudflared.exe on Windows if present)
- parses cloudflared stdout for a public https:// URL and sends it to the Discord webhook
- restarts both if either dies. Posts status messages to the webhook.
"""

import os
import re
import shlex
import signal
import subprocess
import sys
import threading
import time
from queue import Queue, Empty
from dotenv import load_dotenv

import json
from urllib.request import Request, urlopen

def post_webhook_json(webhook_url: str, payload: dict, timeout=10):
    req = Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urlopen(req, timeout=timeout) as resp:
        resp.read()


# ------------------------ Config ------------------------
UVICORN_CMD = ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000"]

import shutil

def find_local_cloudflared():
    """
    Look for a cloudflared binary next to this script (cloudflared or cloudflared.exe).
    If found on Unix-like systems, ensure it's executable. If not found, return the
    path discovered by shutil.which("cloudflared") or None.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = ["cloudflared", "cloudflared.exe"]

    for name in candidates:
        p = os.path.join(here, name)
        if os.path.exists(p):
            # On Unix, ensure executable bit is set (no-op on Windows)
            if os.name != "nt":
                try:
                    st = os.stat(p)
                    if not (st.st_mode & (stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)):
                        os.chmod(p, st.st_mode | stat.S_IXUSR)
                except Exception:
                    # best-effort: if chmod fails, we'll still try to run it and allow the subprocess error to surface
                    pass
            return p

    # fallback: check PATH
    path = shutil.which("cloudflared")
    return path

'''

# Cloudflared command: prefer local .\cloudflared.exe on Windows if exists; otherwise 'cloudflared'
if os.name == "nt":
    # Windows: check for ./cloudflared.exe next to script
    local_cf = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cloudflared.exe")
    if os.path.exists(local_cf):
        CLOUDFLARED_CMD = [local_cf, "tunnel", "--url", "http://localhost:8000"]
    else:
        CLOUDFLARED_CMD = ["cloudflared", "tunnel", "--url", "http://localhost:8000"]
else:
    CLOUDFLARED_CMD = ["cloudflared", "tunnel", "--url", "http://localhost:8000"]

# How long to wait when parsing cloudflared for a URL (seconds)
CLOUDFLARED_URL_TIMEOUT = 60

# Minimum delay between restarts (avoid thundering restarts)
RESTART_BACKOFF = 2.0

# ------------------------ Helpers ------------------------
url_regex = re.compile(r"https?://[^\s,;]+", re.IGNORECASE)


def extract_url_from_line(line: str):
    """Return first https? URL from a line or None."""
    if not line:
        return None
    m = url_regex.search(line)
    if m:
        url = m.group(0).strip()
        # simple heuristics: prefer trycloudflare or https
        if url.startswith("http"):
            return url
    return None


def enqueue_stream(stream, q: Queue):
    """Read lines from stream and put into queue (non-blocking reader used in threads)."""
    for raw in iter(stream.readline, ""):
        if raw is None:
            break
        line = raw.rstrip("\n")
        q.put(line)
    # signal EOF
    q.put(None)


def post_message(webhook_url: str, text: str):
    if not webhook_url:
        print("No webhook configured; would have posted:", text)
        return
    try:
        post_webhook_json(webhook_url, {"content": text})
    except Exception as e:
        print("Failed to post webhook:", e)


# ------------------------ Supervisor ------------------------
class Supervisor:
    def __init__(self, webhook_url: str = None):
        self.webhook_url = webhook_url
        self._stop = False
        self._current_tunnel_url = None

    def start_process(self, cmd, cwd=None):
        """Start a subprocess with stdout/stderr merged to stdout pipe (text mode)."""
        # On Windows, setting creationflags can avoid creating a new window; but we'll keep defaults.
        # We want stdout=PIPE so we can read cloudflared output.
        print("Starting:", " ".join(shlex.quote(p) for p in cmd))
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=cwd,
            text=True,
            bufsize=1,  # line buffered
        )
        return proc

    def read_cloudflared_url(self, cf_proc, line_queue: Queue, timeout=CLOUDFLARED_URL_TIMEOUT):
        """Read lines from queue for a while to find a public URL. Returns url or None."""
        start = time.time()
        while True:
            try:
                line = line_queue.get(timeout=0.5)
            except Empty:
                line = None

            # Process EOF marker
            if line is None and (cf_proc.poll() is not None):
                # process ended and queue drained
                return None

            if line:
                print("[cloudflared]", line)
                url = extract_url_from_line(line)
                if url and url.startswith("http"):
                    # Heuristic: accept urls that look like trycloudflare or https
                    return url

            if time.time() - start > timeout:
                return None

            if cf_proc.poll() is not None and line is None:
                # process ended
                return None

            if self._stop:
                return None

    def supervise_once(self):
        """Start uvicorn and cloudflared, watch them, and restart if necessary."""
        app_proc = None
        cf_proc = None
        cf_queue = Queue()

        try:
            app_proc = self.start_process(UVICORN_CMD)
            cf_proc = self.start_process(CLOUDFLARED_CMD)

            # start a background thread to read cloudflared stdout lines into queue
            cf_reader = threading.Thread(target=enqueue_stream, args=(cf_proc.stdout, cf_queue), daemon=True)
            cf_reader.start()

            # Try to find a public URL and post it
            url = self.read_cloudflared_url(cf_proc, cf_queue)
            if url:
                if url != self._current_tunnel_url:
                    post_message(self.webhook_url, f"✅ Server is live at: {url}")
                    self._current_tunnel_url = url
                else:
                    print("Tunnel URL unchanged.")
            else:
                post_message(self.webhook_url, "⚠️ cloudflared started but no public URL detected (check logs).")

            # Monitor processes: if either exits, break and restart loop
            print("Now supervising processes. Ctrl+C to stop.")
            while True:
                if self._stop:
                    break
                a_status = app_proc.poll()
                c_status = cf_proc.poll()
                if a_status is not None:
                    print("uvicorn exited with code", a_status)
                    post_message(self.webhook_url, f"⚠️ uvicorn exited (code {a_status}). Restarting...")
                    break
                if c_status is not None:
                    print("cloudflared exited with code", c_status)
                    post_message(self.webhook_url, f"⚠️ cloudflared exited (code {c_status}). Restarting...")
                    break

                # Also, periodically scan any leftover cloudflared lines and look for a new URL
                try:
                    line = cf_queue.get_nowait()
                except Empty:
                    line = None
                if line:
                    if line is None:
                        # EOF
                        pass
                    else:
                        print("[cloudflared]", line)
                        maybe = extract_url_from_line(line)
                        if maybe and maybe != self._current_tunnel_url:
                            self._current_tunnel_url = maybe
                            post_message(self.webhook_url, f"🔁 Tunnel URL changed: {maybe}")
                time.sleep(0.5)

        finally:
            # Clean up: terminate both processes if still running
            for p, name in ((app_proc, "uvicorn"), (cf_proc, "cloudflared")):
                if p and p.poll() is None:
                    try:
                        print("Terminating", name)
                        p.terminate()
                    except Exception:
                        pass
            # Give a moment, then kill if still alive
            time.sleep(1)
            for p, name in ((app_proc, "uvicorn"), (cf_proc, "cloudflared")):
                if p and p.poll() is None:
                    try:
                        print("Killing", name)
                        p.kill()
                    except Exception:
                        pass

    def run(self):
        print("Supervisor starting. Press Ctrl+C to stop.")
        post_message(self.webhook_url, "🔁 Supervisor starting (uvicorn + cloudflared).")
        while not self._stop:
            try:
                self.supervise_once()
            except Exception as e:
                print("Supervisor loop error:", e)
                try:
                    post_message(self.webhook_url, f"❌ Supervisor error: {e}")
                except Exception:
                    pass
            if self._stop:
                break
            print(f"Restarting in {RESTART_BACKOFF}s...")
            time.sleep(RESTART_BACKOFF)
        post_message(self.webhook_url, "⏹️ Supervisor stopped.")

    def stop(self):
        self._stop = True


# ------------------------ CLI & Entrypoint ------------------------
def parse_args():
    import argparse

    p = argparse.ArgumentParser(description="Supervise uvicorn + cloudflared and post webhook with tunnel URL.")
    p.add_argument("--webhook", "-w", type=str, default=os.environ.get("DISCORD_WEBHOOK"),
                   help="Discord webhook URL (or set DISCORD_WEBHOOK env var)")
    return p.parse_args()


def main():
    load_dotenv()
    args = parse_args()
    if not args.webhook:
        print("ERROR: No Discord webhook provided. Use --webhook or set DISCORD_WEBHOOK env var.")
        sys.exit(2)

    sup = Supervisor(webhook_url=args.webhook)

    def handle_signal(sig, frame):
        print("Signal received, shutting down supervisor...")
        sup.stop()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    sup.run()


if __name__ == "__main__":
    main()
'''