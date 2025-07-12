from pydantic import BaseModel
from typing import Optional, Literal, List

from .track import Track

#rest
class SearchRequest(BaseModel):
    q: Optional[str] = None


class DownloadRequest(BaseModel):
    track: Track

class QueueRequest(BaseModel):
    track: Track
    play: Optional[bool]


class PlayRequest(BaseModel):
    track: Track

#websocket
class WebsocketMessage(BaseModel):
    action: Literal["add", "remove"]
    name: str
    queue: List[dict]

    def to_json(self):
        return self.model_dump()