from pydantic import BaseModel
from backend.core.models.track import Track

class AudioRequest(BaseModel):
    track: Track
