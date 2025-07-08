from pydantic import BaseModel

#audio
class Track(BaseModel):
    youtube_id: str
    title: str
    uploader: str
    duration: int