from pydantic import BaseModel
from typing import Optional
from backend.data_structures import Track

#networking
class SearchRequest(BaseModel):
    q: Optional[str] = None

class DownloadRequest(BaseModel):
    track: Track

class QueueRequest(BaseModel):
    track: Track
    play: Optional[bool]

class PlayRequest(BaseModel):
    track: Track