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
import argparse
import threading
from datetime import datetime, timedelta

from boot.utils.misc import update_env


def main():
    #------------------------------- Parse arguments -------------------------------#
    parser = argparse.ArgumentParser(
        description=(
            "Scuttle\n\n"
            "Installation & Setup Instructions:\n"
            "  1. Run 'python main.py --setup' to create a virtual environment and install dependencies.\n"
            "  2. Activate the virtual environment:\n"
            "    - Windows (cmd): 'venv\\Scripts\\activate.bat'\n"
            "    - Windows (PowerShell): 'venv\\Scripts\\Activate.ps1'\n"
            "    - macOS/Linux: 'source venv/bin/activate'\n"
            "  3. Navigate to your discord server and get a webhook url.\n"
            "  4. Re-run 'python main.py --set-webhook [url]' to start the app.\n\n"
            "Running Scuttle:\n"
            "  - Start the app: 'python main.py'\n"
            "  - Close the app: Press Ctrl+C in the terminal"
        ),
        epilog=(
            "Example usage:\n"
            "  python main.py --setup\n"
            "  python main.py --set-webhook https://discord.com/api/webhooks/...\n"
            "  python main.py"
        ),
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Print detailed output for debugging."
    )
    parser.add_argument(
        "-w", "--set-webhook",
        type=str,
        metavar="URL",
        help=(
            "Set the Discord webhook URL to receive updates.\n"
            "  - Example: -w https://discord.com/api/webhooks/..."
        )
    )
    parser.add_argument(
        "-s", "--setup",
        action="store_true",
        help=(
            "Set up environment and exit.\n"
            "  - Create venv (default ./venv)\n"
            "  - Install pip packages from requirements.txt\n"
            "  - Download cloudflared binary to tools/"
            "  - Install ffmpeg dependency into venv"
        )
    )
    parser.add_argument(
        "-p", "--control-port",
        type=int,
        metavar="PORT",
        help=(
            "(Internal) Port to connect to Rust GUI."
        )
    )
    args = parser.parse_args()

    #parse the arguments and do setup
    verbose = args.verbose

    if args.setup:
        from boot.setup import setup_all #includes venv and yt-dlp nightly
        from boot.tunnel.cloudflared import download_cloudflared
        from boot.runtime.deno import download_deno
        from boot.install_ffmpeg import install_ffmpeg

        #get the paths and save them to environment variables
        #this is for venv Python, venv setup, js runtime, tunnel, and ffmpeg
        tool_installers = [
            lambda: download_cloudflared(verbose=verbose),
            lambda: download_deno(verbose=verbose),
            lambda: setup_all(verbose=verbose),
            lambda: install_ffmpeg(verbose=verbose)
        ]

        for tool in tool_installers:
            try:
                result = tool()
                
                #check if valid output and save to environment variables
                if result:
                    result.register(verbose=verbose)
                    print(f"✅ {result.name}")
            except Exception as e:
                print(f"❌ Setup failed during a step: {e}")

        print("✅ Environment setup complete.")
        return

    if args.set_webhook:
        #switch this to a boot/utils/misc.py/ToolEnvPaths style dataclass pattern
        update_env("DISCORD_WEBHOOK_URL", args.set_webhook, verbose=verbose) 
        print(f"✅ Webhook updated: {args.set_webhook}")
    
    #------------------------------- Begin main code -------------------------------#
    from dotenv import load_dotenv

    from boot.awake import prevent_sleep, allow_sleep
    from boot.utils import wait_for_stop_command, terminate_process, drain_queue

    from boot.notify import get_webhook_url, post_webhook_json
    from boot.uvicorn import start_uvicorn, wait_for_uvicorn
    from boot.tunnel.cloudflared import start_cloudflared, get_cloudflared_url


    #load in environment variables
    load_dotenv(override=True)
    send_webhook = True
    DISCORD_WEBHOOK_URL = get_webhook_url()
    if not DISCORD_WEBHOOK_URL:
        print("⚠️ No Discord webhook set. (Server settings » Integrations » Webhooks)")
        send_webhook = False

    TUNNEL_BIN_PATH = os.getenv("TUNNEL_BIN_PATH")
    if not TUNNEL_BIN_PATH:
        raise ValueError("TUNNEL_BIN_PATH not found in environment")


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

    #------------------------------- Keep system awake -------------------------------#
    keep_awake_proc = prevent_sleep(verbose=verbose)

    num_restarts = 0
    last_activity = datetime.now()

    IDLE_TIMEOUT = timedelta(hours=3) #restart timeout
    POLL_INTERVAL = 60 #seconds

    #shutting down from Rust GUI control server
    shutdown_event = threading.Event() #for shutting down safely
    if args.control_port is not None:
        wait_for_stop_command(shutdown_event=shutdown_event, control_port=args.control_port)

    log("========================\n🚀 Scuttle Booting Up!", send_webhook=send_webhook)

    try:
        while not shutdown_event.is_set():
            #------------------------------- Start server -------------------------------#
            log("🚀 Starting Uvicorn server...")
            server_proc, server_queue = start_uvicorn(verbose=verbose)
            wait_for_uvicorn(verbose=verbose)


            #------------------------------- Start tunnel -------------------------------#
            log("🌐 Starting Cloudflared tunnel...")
            tunnel_proc, tunnel_queue = start_cloudflared(verbose=verbose)

            #extract tunnel url
            log("⏳ Waiting for tunnel URL...")
            tunnel_url = get_cloudflared_url(tunnel_queue, timeout=60, verbose=verbose)
        
            if tunnel_url: 
                log(f"✅ Tunnel URL: {tunnel_url}", send_webhook=send_webhook)

                if send_webhook:
                    log("📨 Discord webhook sent!")
            else:
                log("❌ Failed to get tunnel URL in time.", send_webhook=send_webhook)

        
            #------------------------------- Monitor loop -------------------------------#
            while not shutdown_event.is_set():
                #read server logs non-blockingly
                lines = drain_queue(server_queue)
                if lines:
                    last_activity = datetime.now()
                    #print(f"[server]: {last_activity}: {lines[-1].strip()}")

                #idle restart
                if datetime.now() - last_activity > IDLE_TIMEOUT:
                    log("💤 No activity detected, restarting for refresh...", send_webhook=send_webhook)
                    break
            
                if server_proc.poll() is not None:
                    log("❌ Server crashed, restarting both...", send_webhook=send_webhook)
                    break

                if tunnel_proc.poll() is not None:
                    log("⚠️ Tunnel crashed, restarting tunnel only...", send_webhook=send_webhook)

                    #kill and restart tunnel
                    terminate_process(tunnel_proc)
                    
                    tunnel_proc, tunnel_queue = start_cloudflared(verbose=verbose)
                    tunnel_url = get_cloudflared_url(tunnel_queue, timeout=60, verbose=verbose)

                    if tunnel_url:
                        log(f"✅ Tunnel URL restarted: {tunnel_url}", send_webhook=send_webhook)
                    else:
                        log("❌ Failed to get tunnel URL in time.", send_webhook=send_webhook)                
                    continue
                

                shutdown_event.wait(timeout=POLL_INTERVAL)
                #time.sleep(POLL_INTERVAL)


            #------------------------------- Cleanup before restart -------------------------------#
            terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
            terminate_process(server_proc, "Server", verbose=verbose)

            if not shutdown_event.is_set():
                num_restarts += 1
                last_activity = datetime.now()

                log(f"\n🔄 Restart cycle #{num_restarts} complete\n", send_webhook=send_webhook)
    
    except KeyboardInterrupt:

        #backup cleanup on keyboard interrupt so we don't have leftover processes
        terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
        terminate_process(server_proc, "Server", verbose=verbose)

        shutdown_event.set()
        log("\n⏹ KeyboardInterrupt received, shutting down Scuttle...", send_webhook=send_webhook)
     
    finally:
        #clean up correctly when keyboard interrupted
        terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
        terminate_process(server_proc, "Server", verbose=verbose)

        #cleanup keep-awake process
        allow_sleep(keep_awake_proc, verbose=verbose)
        log("💤 System allowed to sleep again.", send_webhook=send_webhook)

if __name__ == "__main__":
    main()