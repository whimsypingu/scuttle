from pydantic import BaseModel
from typing import Iterable, Mapping

from backend.core.models.event import Event

#shared base class
class WebsocketMessage(BaseModel):
    source: str
    action: str
    payload: dict

    @classmethod
    def from_event(cls, event: Event):
        return cls(source=event.source, action=event.action, payload=event.payload or {})
    
    def _clean(self, value):
        #recursively called to clean out the contents and prepare in json format
        if hasattr(value, "to_json") and callable(value.to_json): #try custom to_json() first
            return self._clean(value.to_json())
        
        elif isinstance(value, BaseModel): #pydantic
            return self._clean(value.model_dump())
        
        elif isinstance(value, Mapping): #dicts
            return {self._clean(k): self._clean(v) for k, v in value.items()}
        
        elif isinstance(value, Iterable) and not isinstance(value, (str, bytes)): #lists
            return [self._clean(item) for item in value]

        else:
            return value

    def to_json(self):
        return {
            "source": self.source,
            "action": self.action,
            "payload": self._clean(self.payload)
        }
