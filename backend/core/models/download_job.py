from typing import Optional

class DownloadJob:
    def __init__(
        self,
        id: Optional[str] = None,
        query: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        self.id = id
        self.query = query
        self.metadata = metadata

    def get_type(self) -> str:
        if self.id:
            return "id"
        if self.query:
            return "query"
        return "unknown"
    
    def get_id(self) -> str | None:
        return self.id
    
    def get_query(self) -> str | None:
        return self.query
    
    def get_metadata(self) -> dict | None:
        return self.metadata

    def get_identifier(self) -> str:
        """
        Return a string uniquely identifying this job.
        For id, returns the id.
        For query, returns the entire query string.
        """
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
