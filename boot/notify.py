
import json
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

def post_webhook_json(webhook_url: str, payload: dict, timeout=10):
    """
    Send a JSON payload to a Discord webhook URL.

    Args:
        webhook_url (str): Full Discord webhook URL.
        payload (dict): JSON payload to send (e.g., {"content": "Hello"}).
        timeout (int, optional): Timeout in seconds. Defaults to 10.

    Raises:
        URLError, HTTPError: If the request fails.
    """
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
