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
from datetime import datetime, timedelta

from boot.utils.misc import IS_WINDOWS, update_env


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
        )
    )
    args = parser.parse_args()

    #parse the arguments and do setup
    verbose = args.verbose

    if args.set_webhook:
        update_env("DISCORD_WEBHOOK_URL", args.set_webhook)
        print(f"✅ Webhook updated: {args.set_webhook}")
    
    if args.setup:
        from boot.setup import ensure_venv
        from boot.tunnel.cloudflared import download_cloudflared
        from boot.install_ffmpeg import install_ffmpeg

        download_cloudflared(verbose=verbose)

        python_bin = ensure_venv(verbose=args.verbose)

        install_ffmpeg(verbose=verbose)

        print("\n✅ Environment setup complete.")
        print("👉 To activate the virtual environment, run:\n")
        if IS_WINDOWS:
            print(r"    venv\Scripts\activate")
        else:
            print("    source venv/bin/activate")
        print("\nThen re-run this script (python main.py) to start Scuttle.")
        return


    #------------------------------- Begin main code -------------------------------#
    from dotenv import load_dotenv

    from boot.awake import prevent_sleep, allow_sleep
    from boot.utils import terminate_process

    from boot.notify import post_webhook_json
    from boot.uvicorn import start_uvicorn, wait_for_uvicorn
    from boot.tunnel.cloudflared import start_cloudflared, get_cloudflared_url


    #load in environment variables
    load_dotenv()
    send_webhook = True
    DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
    if not DISCORD_WEBHOOK_URL:
        print(
            "[INFO] No Discord webhook set.\n"
            "Notifications will be disabled.\n"
            "Set a webhook with 'python main.py --set-webhook [URL]'."
        )
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
    load_dotenv(override=True) #prepare .env variables
    keep_awake_proc = prevent_sleep(verbose=verbose)

    num_restarts = 0
    last_restart = datetime.now()

    log("========================\n🚀 Scuttle Booting Up!", send_webhook=send_webhook)

    try:
        while True:
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
            while True:
                time.sleep(5)

                #periodically restart
                if datetime.now() - last_restart > timedelta(hours=2): #magic number here!??
                    log("⏳ Restarting both processes after refresh...", send_webhook=send_webhook)
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


            #------------------------------- Cleanup before restart -------------------------------#
            terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
            terminate_process(server_proc, "Server", verbose=verbose)

            num_restarts += 1
            last_restart = datetime.now()

            log(f"\n🔄 Restart cycle #{num_restarts} complete\n", send_webhook=send_webhook)
    
    except KeyboardInterrupt:

        #backup cleanup on keyboard interrupt so we don't have leftover processes
        terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
        terminate_process(server_proc, "Server", verbose=verbose)

        log("\n⏹ KeyboardInterrupt received, shutting down Scuttle...", send_webhook=send_webhook)
     
    finally:
        #clean up correctly when keyboard interrupted
        terminate_process(tunnel_proc, "Tunnel", verbose=verbose)
        terminate_process(server_proc, "Server", verbose=verbose)

        #cleanup keep-awake process
        allow_sleep(keep_awake_proc, verbose=verbose)
        log("💤 System allowed to sleep again.")

if __name__ == "__main__":
    main()