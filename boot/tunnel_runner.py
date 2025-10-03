import os
import time

from boot.tunnel.cloudflared import get_cloudflared_url, start_cloudflared
from boot.utils.threads import terminate_process

#this stuff is useless right now, but it is here in case other tunnel strategies are implemented
def start_tunnel(verbose=False):
    bin_path = os.environ.get("TUNNEL_BIN_PATH")

    tunnel_proc, tunnel_queue = start_cloudflared(bin_path)
    tunnel_url = get_cloudflared_url(stdout_queue=tunnel_queue, timeout=60, verbose=verbose)
    
    return tunnel_proc, tunnel_url


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    bin_path = os.environ.get("TUNNEL_BIN_PATH")

    print("\ncloudflared binary:", bin_path)
    print("\nStarting tunnel for manual test (ctrl+c to stop)...\n")

    proc, stdout_queue = start_cloudflared(bin_path)

    try:
        url = get_cloudflared_url(stdout_queue=stdout_queue, timeout=60)
        if url:
            print(f"\n✅ Tunnel URL found: {url}\n")
        else:
            print("\n❌ Timed out waiting for tunnel URL.\n")

        #keep tunnel process alive
        while proc.poll() is None:
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\nKeyboardInterrupt received, stopping cloudflared...")
        
        terminate_process(proc)