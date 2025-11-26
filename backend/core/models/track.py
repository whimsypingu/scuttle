from pydantic import BaseModel

class Track(BaseModel):
    id: str
    title: str
    artist: str
    duration: float

    def to_json(self):
        return self.model_dump() #pydantic v2


