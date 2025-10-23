
import traceback
from backend.core.database.audio_database import AudioDatabase
from backend.core.models.download_job import DownloadJob
from backend.core.queue.implementations.play_queue import PlayQueue
from backend.core.queue.implementations.download_queue import DownloadQueue
from backend.core.youtube.client import YouTubeClient


class DownloadWorker:
    def __init__(
        self, 
        play_queue: PlayQueue,
        download_queue: DownloadQueue, 
        youtube_client: YouTubeClient,
        audio_database: AudioDatabase
    ):
        self.play_queue = play_queue
        self.download_queue = download_queue
        self.youtube_client = youtube_client #supports retry handling
        self.audio_database = audio_database

        self.stopped = False
    
    async def run(self):
        while not self.stopped:
            #potentially rename to job and define a custom DownloadJob wrapper for track with fields like requested_by
            job: DownloadJob = await self.download_queue.pop() #thank you to async condition
            track = None #null this out

            try:
                print(f"[DEBUG] DownloadWorker handling {job.get_type()} type")
                match job.get_type():
                    case "id":
                        track = await self.youtube_client.download_by_id(
                            id=job.get_id(), 
                            custom_metadata=job.get_metadata()
                        )
                    case "query":
                        track = await self.youtube_client.download_by_query(
                            q=job.get_query(), 
                            custom_metadata=job.get_metadata()
                        )
                    case _:
                        print(f"[WARN] Unknown DownloadJob type: {job.get_type()}")
                        continue

                #client should return the classic Track metadata with {id, title, artist, dur} 
                if track:
                    await self.audio_database.log_track(track)
                    await self.audio_database.log_download(track.id)

                    #put into a playlist right away? in the case of importing a playlist then yes
                    if job.get_updates():
                        await self.audio_database.update_track_playlists(track.id, job.get_updates())

                    #push into play queue? in most cases yes
                    if job.get_queue_first_status():
                        await self.play_queue.insert_next(track.id)
                    
                    if job.get_queue_last_status():
                        await self.play_queue.push(track.id)

            except Exception as e:
                print(f"[ERROR] DownloadWorker error ({e}) handling DownloadJob: {job}\n{traceback.format_exc()}")

    def shutdown(self):
        """Signal the worker to stop."""
        self.stopped = True

        dummy_job = DownloadJob()
        self.download_queue.push(dummy_job) #close out the loop, and it probably breaks but who cares
