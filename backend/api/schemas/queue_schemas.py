from pydantic import BaseModel
from typing import Optional
from backend.core.models.track import Track

class QueueSetFirstTrackRequest(BaseModel):
    track: Track

class QueuePushTrackRequest(BaseModel):
    track: Track

#QueuePopTrackRequest no need to implement

class QueueRemoveTrackRequest(BaseModel):
    index: int = 0

#QueueContentRequest no need to implement