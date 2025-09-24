from pydantic import BaseModel
from typing import Optional
from backend.core.models.track import Track

class QueueSetFirstTrackRequest(BaseModel):
    id: str

class QueuePushTrackRequest(BaseModel):
    id: str

#QueuePopTrackRequest no need to implement

class QueueRemoveTrackRequest(BaseModel):
    index: int = 0

#QueueContentRequest no need to implement