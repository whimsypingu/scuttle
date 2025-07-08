from dataclasses import dataclass, field
from enum import Enum
import json

class SourceType(Enum):
    DB = 0
    YOUTUBE = 1

@dataclass
class Track:
    youtube_id: str
    title: str
    uploader: str
    duration: int
    #source: SourceType = field(default=SourceType.DB)

    def to_dict(self):
        return {
            "youtube_id": self.youtube_id,
            "title": self.title,
            "uploader": self.uploader,
            "duration": self.duration,
            #"source": self.source.value
        }
    
    def to_json(self):
        return json.dumps(self.to_dict())
    