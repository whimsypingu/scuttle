#/utils/yt.py
class NoSearchResultsError(Exception):
    """Raised when a YouTube search returns no valid results."""
    pass

class DownloadFailedError(Exception):
    """Raised when a ytdlp download fails."""
    pass

class SearchFailedError(Exception):
    """Raised when a ytdlp search fails."""
    pass

#/utils/db.py
class TrackInsertError(Exception):
    """Raised when a sql track insertion attempt fails."""
    pass

class CachingFailError(Exception):
    """Raised when a sql caching attempt fails."""
    pass

class DownloadLogFailError(Exception):
    """Raised when a sql download logging attempt fails."""
    pass

