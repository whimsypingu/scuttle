from pydantic import BaseModel
from typing import List, Optional
from backend.core.models.track import Track


class QueueSetAllTracksRequest(BaseModel):
    ids: List[str]

class QueueSetFirstTrackRequest(BaseModel):
    id: str

class QueuePushTrackRequest(BaseModel):
    id: str

#QueuePopTrackRequest no need to implement

class QueueRemoveTrackRequest(BaseModel):
    id: str
    index: int = 0

#QueueContentRequest no need to implement