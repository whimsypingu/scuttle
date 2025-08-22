from typing import Optional
from backend.core.models.track import Track

class DownloadJob:
    def __init__(
        self,
        track: Optional[Track] = None,
        id: Optional[str] = None,
        query: Optional[str] = None
    ):
        self.track = track
        self.id = id
        self.query = query

    def get_type(self) -> str:
        if self.track:
            return "Track"
        if self.id:
            return "id"
        if self.query:
            return "query"
        return "unknown"

    def get_identifier(self) -> str:
        """Return a string uniquely identifying this job."""
        if self.track:
            return self.track.id
        if self.id:
            return self.id
        if self.query:
            return self.query
        return "unknown"

    def to_json(self) -> dict:
        return {
            "type": self.get_type(),
            "track": self.track.to_json() if self.track else None,
            "id": self.id,
            "query": self.query
        }

    def __repr__(self):
        return f"<DownloadJob type={self.get_type()} id={self.get_identifier()}>"
