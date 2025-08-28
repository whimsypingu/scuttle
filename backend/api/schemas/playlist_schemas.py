from pydantic import BaseModel
from typing import Optional
from backend.core.models.track import Track

class CreatePlaylistRequest(BaseModel):
    temp_id: str
    name: str

