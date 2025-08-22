
from backend.core.database.audio_database import AudioDatabase
from backend.core.models.download_job import DownloadJob
from backend.core.queue.base.observable_dll import ObservableQueue
from backend.core.youtube.client import YouTubeClient


class DownloadWorker:
    def __init__(
        self, 
        download_queue: ObservableQueue, 
        youtube_client: YouTubeClient,
        audio_database: AudioDatabase
    ):
        self.download_queue = download_queue
        self.youtube_client = youtube_client
        self.audio_database = audio_database
    
    async def run(self):
        while True:
            #potentially rename to job and define a custom DownloadJob wrapper for track with fields like requested_by
            job = await self.download_queue.pop()
            try:
                track = await self.youtube_client.robust_download(job.get_identifier())
                await self.audio_database.log_track(track)
                await self.audio_database.log_download(track)
                await self.audio_database.log_cache(track)
            except Exception as e:
                print(f"[ERROR] DownloadWorker error handling track {track}: {e}")

