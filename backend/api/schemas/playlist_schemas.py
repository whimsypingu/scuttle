from pydantic import BaseModel
from typing import List, Optional
from backend.core.models.track import Track

class CreatePlaylistRequest(BaseModel):
    temp_id: str
    name: str
    import_url: Optional[str]


class PlaylistSelection(BaseModel):
    id: str             #technically should be an int, but sqlite will handle conversion.
    checked: bool

class EditTrackRequest(BaseModel):
    id: str
    title: Optional[str]
    artist: Optional[str]
    playlists: List[PlaylistSelection]

class DeleteTrackRequest(BaseModel):
    id: str