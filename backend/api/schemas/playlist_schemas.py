from pydantic import BaseModel
from typing import List, Optional
from backend.core.models.track import Track

class CreatePlaylistRequest(BaseModel):
    temp_id: str
    name: str
    import_url: Optional[str]


class ReorderPlaylistRequest(BaseModel):
    id: str
    from_index: int
    to_index: int


class PlaylistSelection(BaseModel):
    id: str             #technically should be an int, but sqlite will handle conversion.
    checked: bool


class EditPlaylistRequest(BaseModel):
    id: str
    name: str

class DeletePlaylistRequest(BaseModel):
    id: str


class EditTrackRequest(BaseModel):
    id: str
    title: Optional[str]
    artist: Optional[str]
    playlists: List[PlaylistSelection]

class DeleteTrackRequest(BaseModel):
    id: str