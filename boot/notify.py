
import os
import json

from dotenv import load_dotenv

from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


def get_webhook_url():
    return os.getenv("DISCORD_WEBHOOK_URL")

def post_webhook_json(webhook_url=None, payload={"content": "Hello World"}, timeout=10):
    """
    Send a JSON payload to a Discord webhook URL.

    Args:
        webhook_url (str | None): Full Discord webhook URL.
        payload (dict): JSON payload to send (e.g., {"content": "Hello"}).
        timeout (int, optional): Timeout in seconds. Defaults to 10.

    Raises:
        URLError, HTTPError: If the request fails.
    """
    if webhook_url is None:
        try:
            webhook_url = get_webhook_url()
        except:
            raise ValueError("Webhook URL not found")

    #make request
    req = Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "MySupervisor/1.0" #required for discord webhooks
        }
    )

    try:
        with urlopen(req, timeout=timeout) as resp:
            resp.read()  # optionally could return resp.read() if you want

    except HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
        raise
    except URLError as e:
        print(f"URLError: {e.reason}")
        raise



################################################
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    from boot.notify import post_webhook_json

    #load in environment variables
    load_dotenv()

    #read webhook url
    DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

    payload = {"content": "🚀 Supervisor test: webhook is working!"}
    print(DISCORD_WEBHOOK_URL)
    try:
        post_webhook_json(DISCORD_WEBHOOK_URL, payload)
        print("✅ Webhook message sent successfully.")
    except Exception as e:
        print(f"❌ Failed to send webhook message: {e}")
