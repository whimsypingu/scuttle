
import traceback
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
        self.youtube_client = youtube_client #supports retry handling
        self.audio_database = audio_database

        self.stopped = False
    
    async def run(self):
        while not self.stopped:
            #potentially rename to job and define a custom DownloadJob wrapper for track with fields like requested_by
            job: DownloadJob = await self.download_queue.pop() #thank you to async condition

            try:
                print(f"[DEBUG] DownloadWorker handling {job.get_type()} type")
                match job.get_type():
                    case "Track" | "id":
                        track = await self.youtube_client.download_by_id(id=job.get_identifier())
                    case "query":
                        track = await self.youtube_client.download_by_query(q=job.get_identifier())
                    case _:
                        raise ValueError(f"Unknown DownloadJob type: {job.get_type()}")
                    
                if track is not None:
                    await self.audio_database.log_track(track)
                    await self.audio_database.log_download(track)
                    await self.audio_database.log_cache(track)

            except Exception as e:
                print(f"[ERROR] DownloadWorker error ({e}) handling DownloadJob: {job}\n{traceback.format_exc()}")

    def shutdown(self):
        """Signal the worker to stop."""
        self.stopped = True

        dummy_job = DownloadJob()
        self.download_queue.push(dummy_job) #close out the loop, but it probably breaks but who cares
