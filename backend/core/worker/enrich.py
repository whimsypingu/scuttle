
import traceback
import asyncio
from backend.core.database.audio_database import AudioDatabase
from backend.core.models.jobs import EnrichJob
from backend.core.queue.implementations.enrich_queue import EnrichQueue
from backend.core.musicbrainz.client import MusicBrainzClient


class EnrichWorker:
    def __init__(
        self, 
        enrich_queue: EnrichQueue, 
        musicbrainz_client: MusicBrainzClient,
        audio_database: AudioDatabase
    ):
        self.enrich_queue = enrich_queue
        self.musicbrainz_client = musicbrainz_client
        self.audio_database = audio_database

    async def run(self):
        try:
            while True:
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

        except asyncio.CancelledError:
            raise

        except Exception as e:
            print(f"[CRITICAL] {self.__class__.__name__} crashed: {e}")
            print(traceback.format_exc())

        finally:
            print(f"[INFO] {self.__class__.__name__} shutdown.")