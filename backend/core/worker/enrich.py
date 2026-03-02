
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

                #resolve the job
                try:
                    print(f"[DEBUG] EnrichWorker handling {job_type} type")

                    #process for preparing for mb query
                    if not job_id:
                        continue

                    job_metadata = await self.audio_database.get_metadata(job_id, artist_delim=G.UNIT_SEP)
                    print(f"[DEBUG] job_metadata: {job_metadata}")

                    job_title = job_metadata.get("title", "Never Gonna Give You Up")
                    job_artist = job_metadata.get("artist", "Rick Astley")
     
                    mb_search = await self.musicbrainz_client.search(job_title, job_artist)
                    if not mb_search:
                        continue
                        
                    #
                    print(f"[DEBUG] mb_search {mb_search}")
                    mb_artists = mb_search['artists']
                    db_artists = await self.audio_database.get_artists(job_id)

                    #
                    print(f"[DEBUG] mb_artists: {mb_artists}, db_artists: {db_artists}")
                    aligned_artists = self._validate_align_artists(db_artists, mb_artists)

                    print(f"[DEBUG] aligned_artists {aligned_artists}")
                    artists, titles, junctions = await self._prepare_batch_data(aligned_artists)

                    artist_rowid_map = await self.audio_database.batch_update_artists(artists)
                    title_rowid_map = await self.audio_database.batch_update_titles(titles)
                    await self.audio_database.batch_update_junctions(junctions, title_rowid_map=title_rowid_map, artist_rowid_map=artist_rowid_map)

                    await self.audio_database.rebuild_search_index()

                    print("[DEBUG] Success, hopefully")

                except Exception as e:
                    print(f"[ERROR] EnrichWorker error ({e}) resolving while handling EnrichJob: {job}\n{traceback.format_exc()}")

        except asyncio.CancelledError:
            raise

        except Exception as e:
            print(f"[CRITICAL] {self.__class__.__name__} crashed: {e}")
            print(traceback.format_exc())

        finally:
            print(f"[INFO] {self.__class__.__name__} shutdown.")


    async def _prepare_batch_data(self, aligned_artists):
        artists = {}
        titles = []
        junctions = []

        for dba, mba in aligned_artists:
            dba_id = dba.get('id', None)

            #collect existing songs and enrichment songs for an artist, keep only new songs
            dbset = await self.audio_database.get_recordings(dba_id)
            mbset = await self.musicbrainz_client.recordings(mba['mbid'], limit=300)

            new_id = f"SEED___{mba['mbid']}"
            artists.setdefault(new_id, {
                "old_id": dba_id,
                "artist": mba['artist'],
                "artist_display": mba['artist_display']
            })

            for title, title_data in mbset.items():
                #skip songs in database already
                if title in dbset:
                    continue

                title_id = f"SEED___{title_data['mbid']}"
                titles.append({
                    "new_id": title_id,
                    "title": title_data['title'],
                    "title_display": title_data['title_display'],
                    "duration": title_data['duration']
                })

                #per song, collect all unique artists
                for a in title_data.get("artists", []):
                    artist_id = f"SEED___{a['mbid']}"
                    artists.setdefault(artist_id, {
                        "artist": a['artist'],
                        "artist_display": a['artist_display']
                    })

                    junctions.append((title_id, artist_id))

        return artists, titles, junctions


    def _validate_align_artists(self, db_artists, mb_artists, threshold=0.5):
        """
        Validates that the DB artists roughly match the MB artists using Dice coefficient.
        Returns a list of paired tuples (db, mb) if successful. Could be blanks for db entries if db_artists is empty or mismatched in legnth.
        """
        if not mb_artists:
            return None
    
        if len(db_artists) != len(mb_artists):
            db_artists = [{}] * len(mb_artists)
            return list(zip(db_artists, mb_artists))
        
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
        