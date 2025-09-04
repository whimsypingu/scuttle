from pydantic import BaseModel
from typing import List, Optional
from backend.core.models.track import Track

class CreatePlaylistRequest(BaseModel):
    temp_id: str
    name: str


class EditTrackRequest(BaseModel):
    id: str
    title: Optional[str]
    author: Optional[str]
    playlists: List[str]