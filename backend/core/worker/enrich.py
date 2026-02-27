
import traceback
from backend.core.database.audio_database import AudioDatabase
from backend.core.models.jobs import EnrichJob
from backend.core.queue.implementations.enrich_queue import EnrichQueue
from backend.core.musicbrainz.client import MusicbrainzClient


class DownloadWorker:
    def __init__(
        self, 
        enrich_queue: EnrichQueue, 
        musicbrainz_client: MusicbrainzClient,
        audio_database: AudioDatabase
    ):
        self.enrich_queue = enrich_queue
        self.musicbrainz_client = musicbrainz_client
        self.audio_database = audio_database

        self.stopped = False

    async def run(self):
        while not self.stopped:
            job: EnrichJob = await self.enrich_queue.pop() #thank you to async condition

            job_id = job.get_id()
            job_title = job.get_title()

            #these can get overwritten based on the different kinds of executions that are required, consider refactoring with more variables if it gets confusing
            job_query = job.get_query()
            job_id = job.get_id()
            job_type = job.get_type()
            job_metadata = job.get_metadata()

            #resolve to downloadable id (yt_id)
            try:
                print(f"[DEBUG] DownloadWorker handling {job_type} type")
            except Exception as e:
                print(f"[ERROR] DownloadWorker error ({e}) resolving id while handling DownloadJob: {job}\n{traceback.format_exc()}")

    def shutdown(self):
        """Signal the worker to stop."""
        self.stopped = True

        dummy_job = EnrichJob()
        self.enrich_queue.push(dummy_job) #close out the loop, and it probably breaks but who cares
