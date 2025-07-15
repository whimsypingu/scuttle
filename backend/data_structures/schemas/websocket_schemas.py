from pydantic import BaseModel, field_validator
from typing import Optional, List, Literal

from ..track import Track
from ..track_queue import TrackQueue

from backend.globals import Trigger


#shared base class
class WebsocketMessage(BaseModel):
    context: str
    data: dict
    
    def to_json(self):
        return self.model_dump()

#websocket message and builder function
class AddToQueueMessage(WebsocketMessage):
    @classmethod
    def build(cls, track_queue: TrackQueue, track: Track):
        """
        Constructs and returns an AddMessage from a given TrackQueue and the Track being added.
        """
        next = track_queue.peek_at(1)
        context = f"{track_queue.get_name()}.{Trigger.ON_ADD.value}"
        return cls(
            context=context,
            data={
                "content": track_queue.to_json(),
                "next": next.to_json() if next else None,
                "track": track.to_json()
            }
        ).to_json()

class RemoveFromQueueMessage(WebsocketMessage):
    @classmethod
    def build(cls, track_queue: TrackQueue, track: Track):
        """
        Constructs and returns a RemoveMessage from a given TrackQueue and the Track being added.
        """
        next = track_queue.peek_at(1)
        context = f"{track_queue.get_name()}.{Trigger.ON_REMOVE.value}"
        return cls(
            context=context,
            data={
                "content": track_queue.to_json(),
                "next": next.to_json() if next else None,
                "track": track.to_json()
            }
        ).to_json()