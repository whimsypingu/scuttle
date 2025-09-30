#!/usr/bin/env python3
"""
supervisor.py

Usage:
  python supervisor.py --webhook https://discord.com/api/webhooks/.... 
  or set env var DISCORD_WEBHOOK and run `python supervisor.py`

What it does:
- starts: uvicorn backend.server:app --host 0.0.0.0
- starts: cloudflared tunnel --url http://localhost:8000 (uses .\\cloudflared.exe on Windows if present)
- parses cloudflared stdout for a public https:// URL and sends it to the Discord webhook
- restarts both if either dies. Posts status messages to the webhook.
"""

import os
from dotenv import load_dotenv

from boot.notify import post_webhook_json

#load in environment variables
load_dotenv()

#read webhook url
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

if not DISCORD_WEBHOOK_URL:
    raise ValueError("DISCORD_WEBHOOK_URL not found in environment")

if __name__ == "__main__":
    payload = {"content": "🚀 Supervisor test: webhook is working!"}
    print(DISCORD_WEBHOOK_URL)
    try:
        post_webhook_json(DISCORD_WEBHOOK_URL, payload)
        print("✅ Webhook message sent successfully.")
    except Exception as e:
        print(f"❌ Failed to send webhook message: {e}")
