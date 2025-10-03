#!/usr/bin/env python3
"""
main.py

Usage:
    python main.py

What it does:
- starts: uvicorn backend.server:app --host 0.0.0.0
- starts: cloudflared tunnel --url http://localhost:8000 (uses .\\cloudflared.exe on Windows if present)
- parses cloudflared stdout for a public https:// URL and sends it to the Discord webhook
- restarts both if either dies. Posts status messages to the webhook.
"""

import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

from boot.awake import prevent_sleep, allow_sleep
from boot.utils import terminate_process

from boot.notify import post_webhook_json
from boot.tunnel import start_cloudflared, get_cloudflared_url
from boot.uvicorn import start_uvicorn, wait_for_uvicorn

#load in environment variables
load_dotenv()
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

if not DISCORD_WEBHOOK_URL:
    raise ValueError("DISCORD_WEBHOOK_URL not found in environment")

#messages
def log(message, send_webhook=False):
    """
    Logs a message and optionally sends it to a Discord webhook
    
    Parameters
        message (str): Message
        send_webhook (bool): Whether to post or not
    """
    print(message)
    if send_webhook:
        post_webhook_json(DISCORD_WEBHOOK_URL, {"content": message})


def main():

    #------------------------------- Keep system awake -------------------------------#
    verbose=False
    keep_awake_proc = prevent_sleep(verbose=verbose)

    num_restarts = 0
    last_restart = datetime.now()

    log("========================\n🚀 Scuttle Booting Up!", send_webhook=True)

    try:
        while True:
            #------------------------------- Start server -------------------------------#
            log("🚀 Starting Uvicorn server...")
            server_proc, server_queue = start_uvicorn(verbose=verbose)
            wait_for_uvicorn(verbose=verbose)


            #------------------------------- Start tunnel -------------------------------#
            log("🌐 Starting Cloudflared tunnel...")
            tunnel_proc, tunnel_queue = start_cloudflared()

            #extract tunnel url
            log("⏳ Waiting for tunnel URL...")
            tunnel_url = get_cloudflared_url(tunnel_queue, timeout=60, verbose=verbose)
        
            if tunnel_url:
                log(f"✅ Tunnel URL: {tunnel_url}", send_webhook=True)
                log("📨 Discord webhook sent!")
            else:
                log("❌ Failed to get tunnel URL in time.", send_webhook=True)

        
            #------------------------------- Monitor loop -------------------------------#
            while True:
                time.sleep(5)

                #periodically restart
                if datetime.now() - last_restart > timedelta(hours=2): #magic number here!??
                    log("⏳ Restarting both processes after refresh...", send_webhook=True)
                    break
            
                if server_proc.poll() is not None:
                    log("❌ Server crashed, restarting both...", send_webhook=True)
                    break

                if tunnel_proc.poll() is not None:
                    log("⚠️ Tunnel crashed, restarting tunnel only...", send_webhook=True)

                    #kill and restart tunnel
                    terminate_process(tunnel_proc)
                    
                    tunnel_proc, tunnel_queue = start_cloudflared()
                    tunnel_url = get_cloudflared_url(tunnel_queue, timeout=60, verbose=verbose)

                    if tunnel_url:
                        log(f"✅ Tunnel URL restarted: {tunnel_url}", send_webhook=True)
                    else:
                        log("❌ Failed to get tunnel URL in time.", send_webhook=True)                
                    continue


            #------------------------------- Cleanup before restart -------------------------------#
            terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
            terminate_process(server_proc, "Server", verbose=verbose)

            num_restarts += 1
            last_restart = datetime.now()

            log(f"\n🔄 Restart cycle #{num_restarts} complete\n", send_webhook=True)
    
    except KeyboardInterrupt:

        terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
        terminate_process(server_proc, "Server", verbose=verbose)

        log("\n⏹ KeyboardInterrupt received, shutting down Scuttle...", send_webhook=True)
     
    finally:
        #cleanup keep-awake process
        allow_sleep(keep_awake_proc, verbose=verbose)
        log("💤 System allowed to sleep again.")

if __name__ == "__main__":
    main()