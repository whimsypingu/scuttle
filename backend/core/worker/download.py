
from backend.core.models.track import Track
from backend.core.queue.base.observable_dll import ObservableQueue
from backend.core.youtube.client import YouTubeClient


class DownloadWorker:
    def __init__(self, download_queue: ObservableQueue, youtube_client: YouTubeClient):
        self.download_queue = download_queue
        self.youtube_client = youtube_client
    
    async def run(self):
        while True:
            #potentially rename to job and define a custom DownloadJob wrapper for track with fields like requested_by
            track = await self.download_queue.pop()
            try: 
                await self._handle(track)
            except Exception as e:
                print(f"Error handling track {track}: {e}")

    async def _handle(self, track: Track):
        await self.youtube_client.download(track)

