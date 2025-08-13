from dataclasses import dataclass
from typing import Optional

@dataclass
class Event:
    source: str
    action: str
    payload: Optional[dict] = None
