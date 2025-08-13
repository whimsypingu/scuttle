from pydantic import BaseModel
from typing import Optional

from ..track import Track

#rest
class SearchRequest(BaseModel):
    q: Optional[str] = None


class DownloadRequest(BaseModel):
    track: Track

class QueueRequest(BaseModel):
    track: Track

class PlayNowRequest(BaseModel):
    track: Track

class QueueRemoveRequest(BaseModel):
    index: Optional[int] = 0

class PlayRequest(BaseModel):
    track: Track
