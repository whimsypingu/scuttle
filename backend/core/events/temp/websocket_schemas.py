from pydantic import BaseModel, field_validator
from typing import Iterable, Mapping

#shared base class
class WebsocketMessage(BaseModel):
    context: str
    data: dict
    
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
            "context": self.context,
            "data": self._clean(self.data)
        }
