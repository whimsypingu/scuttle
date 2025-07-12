from pydantic import BaseModel

#audio
class Track(BaseModel):
    youtube_id: str
    title: str
    uploader: str
    duration: int

    def to_json(self):
        return self.model_dump() #pydantic v2