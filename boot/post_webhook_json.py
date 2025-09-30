
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

