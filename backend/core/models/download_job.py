from typing import Optional

class DownloadJob:
    """
    Represents a download task for a track.
    Will need either id or query to be valid, but we shouldn't ever reach this error

    Args:
        id: Optional unique ID for the track, which may be extracted from a query
        query: Optional search query to fetch the track. 
        metadata: Optional track metadata, expected format:
            {
                "title": str,
                "artist": str,
                ...etc
            }
        updates: Optional dictionary indicating which playlists this track should be added to after download:
            {
                playlist_id: True #see audio_database.update_track_playlists()
            }
        queue_first: Optional boolean for whether to push to play queue after download or not
        queue_last: Optional boolean for whether to push to play queue after download or not
    """
    def __init__(
        self,
        id: Optional[str] = None,
        query: Optional[str] = None,
        metadata: Optional[dict] = None,
        updates: Optional[dict] = None,
        queue_first: Optional[bool] = False,
        queue_last: Optional[bool] = False
    ):
        if not id and not query:
            raise ValueError("Either 'id' or 'query' must be provided.")
        
        self.id = id
        self.query = query
        self.metadata = metadata
        self.updates = updates #follows convention of {playlist_id: checked(bool)}
        self.queue_first = queue_first
        self.queue_last = queue_last

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
    
    def get_updates(self) -> dict | None:
        return self.updates
    
    def get_queue_first_status(self) -> bool | None:
        return self.queue_first

    def get_queue_last_status(self) -> bool | None:
        return self.queue_last


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
            "id": self.id,
            "query": self.query,
            "metadata": self.metadata
        }

    def __repr__(self):
        return f"<DownloadJob type={self.get_type()} id={self.get_identifier()}>"
