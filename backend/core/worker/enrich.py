
import traceback
import asyncio
from backend.core.database.audio_database import AudioDatabase
from backend.core.models.jobs import EnrichJob
from backend.core.queue.implementations.enrich_queue import EnrichQueue
from backend.core.musicbrainz.client import MusicBrainzClient
from backend.core.lib.utils import dice_coefficient

import backend.globals as G

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

                #these can get overwritten based on the different kinds of executions that are required, consider refactoring with more variables if it gets confusing
                job_id = job.get_id()
                job_title = job.get_title()
                job_artist = job.get_artist()
                job_type = job.get_type()

                #resolve to downloadable id (yt_id)
                try:
                    print(f"[DEBUG] EnrichWorker handling {job_type} type")

                    #process for mb query
                    if job_id:
                        job_metadata = await self.audio_database.get_metadata(job_id, artist_delim=G.UNIT_SEP)
                        print(f"[DEBUG] job_metadata: {job_metadata}")

                        job_title = job_metadata.get("title", "Never Gonna Give You Up")
                        job_artist = job_metadata.get("artist", "Rick Astley")

                    else:
                        job_artist = job_artist.replace(",", G.UNIT_SEP)
     
                    mb_search = await self.musicbrainz_client.search(job_title, job_artist)
                    if not mb_search:
                        continue
                        
                        mb_artists = 

                except Exception as e:
                    print(f"[ERROR] EnrichWorker error ({e}) resolving while handling EnrichJob: {job}\n{traceback.format_exc()}")

        except asyncio.CancelledError:
            raise

        except Exception as e:
            print(f"[CRITICAL] {self.__class__.__name__} crashed: {e}")
            print(traceback.format_exc())

        finally:
            print(f"[INFO] {self.__class__.__name__} shutdown.")

    
    @staticmethod
    def validate_align_artists(self, db_artists, mb_artists, threshold=0.5):
        """
        Validates that the DB artists roughly match the MB artists using Dice coefficient.
        Returns a list of paired tuples (db, mb) if successful. Could be blanks for db entries if db_artists is empty.
        """
        if not mb_artists:
            return None
    
        if not db_artists:
            db_artists = [{}] * len(mb_artists)
            return list(zip(db_artists, mb_artists))
        
        if len(db_artists) != len(mb_artists): 
            return None

        #sort both to align strings
        db_sorted = sorted(db_artists, key=lambda x: x['artist'])
        mb_sorted = sorted(mb_artists, key=lambda x: x['artist'])

        #similarity check
        aligned = list(zip(db_sorted, mb_sorted)) #convert iterator to list
        for db_a, mb_a in aligned:
            score = dice_coefficient(db_a['artist'], mb_a['artist'])
            if score < threshold:
                return None
            
        return aligned
        