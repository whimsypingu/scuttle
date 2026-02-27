
import asyncio
import traceback
from backend.core.database.audio_database import AudioDatabase
from backend.core.models.jobs import DownloadJob
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

    async def run(self):
        try:
            while True:
                #potentially rename to job and define a custom DownloadJob wrapper for track with fields like requested_by
                job: DownloadJob = await self.download_queue.pop() #thank you to async condition
                track = None #null this out

                #these can get overwritten based on the different kinds of executions that are required, consider refactoring with more variables if it gets confusing
                job_query = job.get_query()
                job_id = job.get_id()
                job_type = job.get_type()
                job_metadata = job.get_metadata()

                #resolve to downloadable id (yt_id)
                try:
                    print(f"[DEBUG] DownloadWorker handling {job_type} type")

                    match job_type:
                        case "query":
                            job_id = await self.youtube_client.id_by_query(
                                q=job_query
                            )
                        case "yt_id":
                            pass
                        case "seed_id":
                            job_metadata = await self.audio_database.get_metadata(job_id)

                            #re-queued under old seed_id, and now it is a completed yt_id. without this, duplicate queueing is possible which causes errors
                            if not job_metadata:
                                continue

                            print(f"[DEBUG] seed_metadata/job_metadata: {job_metadata}")
                            
                            job_query = f'{job_metadata.get("title", "Never Gonna Give You Up")} {job_metadata.get("artist", "Rick Astley")}'
                            job_id = await self.youtube_client.id_by_query(
                                q=job_query
                            )
                        case _:
                            print(f"[WARN] Unknown DownloadJob id ({job_id}), query ({job_query}), or type ({job_type})")
                except Exception as e:
                    print(f"[ERROR] DownloadWorker error ({e}) resolving id while handling DownloadJob: {job}\n{traceback.format_exc()}")

                #attempt download of file
                try:
                    already_downloaded = await self.audio_database.is_downloaded(job_id)

                    #downloaded audio already exists
                    if already_downloaded:
                        print(f"[DEBUG] file download status: {already_downloaded} file: {job_id}")
                        continue

                    track = await self.youtube_client.download_by_id(
                        id=job_id,
                        custom_metadata=job_metadata
                    )
                except Exception as e:
                    print(f"[ERROR] DownloadWorker error ({e}) downloading file while handling DownloadJob: {job}\n{traceback.format_exc()}")

                #post processing
                try:
                    #client should return the classic Track metadata with {id, title, artist, dur} 
                    if track:
                        print(f"[DEBUG] DownloadWorker found track: {track}")

                        #seeded entry downloads require database changes
                        if job_type == "seed_id":
                            print(f"[DEBUG] DownloadWorker seed_id set_metadata")
                            await self.audio_database.set_metadata(job.get_id(), metadata={ #little bit jank here now but this must send the old id first, then the new id in the metadata
                                "new_id": track.id,
                                "title": track.title,
                                "title_display": job_metadata.get("title"),
                                "duration": track.duration
                            })

                        else:
                            print(f"[DEBUG] DownloadWorker NON-seed_id register_track")
                            await self.audio_database.register_track(track)
                            await self.audio_database.rebuild_search_index()
                        
                        await self.audio_database.register_download(track.id)

                        #put into a playlist right away? in the case of importing a playlist then yes
                        if job.get_updates():
                            await self.audio_database.update_track_playlists(track.id, job.get_updates())

                        #push into play queue? in most cases yes
                        if job.get_queue_first_status():
                            await self.play_queue.insert_next(track.id)
                        
                        if job.get_queue_last_status():
                            await self.play_queue.push(track.id)

                except Exception as e:
                    print(f"[ERROR] DownloadWorker error ({e}) database and/or system processing file while handling DownloadJob: {job}\n{traceback.format_exc()}")
        
        except asyncio.CancelledError:
            raise

        except Exception as e:
            print(f"[CRITICAL] {self.__class__.__name__} crashed: {e}")
            print(traceback.format_exc())

        finally:
            print(f"[INFO] {self.__class__.__name__} shutdown.")