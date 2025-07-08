from dataclasses import dataclass
import json

from pydantic import BaseModel
from typing import Optional

class Track(BaseModel):
    youtube_id: str
    title: str
    uploader: str
    duration: int

class SearchRequest(BaseModel):
    q: Optional[str] = None

class DownloadRequest(BaseModel):
    youtube_id: str
    title: str
    uploader: str
    duration: int