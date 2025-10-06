from abc import ABC, abstractmethod

class PlaylistExtractor(ABC):
    def __init__(self, url=None):
        self.url = url
        self.id = None
        self.tracks = []

        self.HEADERS = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.google.com/"
        }

    def set_url(self, url):
        self.url = url

    @abstractmethod
    def matches_url(self) -> bool:
        """Return True if this extractor can handle the URL"""
        pass

    @abstractmethod
    def fetch_data(self):
        """Fetch and parse playlist data"""
        pass