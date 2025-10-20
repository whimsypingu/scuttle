import traceback
from backend.core.playlists.implementations.spotify_playlist_ext import SpotifyPlaylistExtractor

class PlaylistExtractorManager:
    def __init__(self):
        self.extractor_classes = [
            SpotifyPlaylistExtractor
        ]

    def fetch_data(self, url):
        for extractor_cls in self.extractor_classes:
            extractor = extractor_cls(url)

            if extractor.matches_url():
                try:
                    return extractor.fetch_data()
                except Exception as e:
                    print(f"Extractor {extractor_cls.__name__} failed: {e}")
                    traceback.print_exc()
                    return []
        
        #failed to find an extractor
        print("[ERROR] Failed to find an appropriate extractor")
        return []
    
        