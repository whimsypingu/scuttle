#backend/core/audio/youtube_client.py

import asyncio
import json
from pathlib import Path
import subprocess
import time
from typing import List, Optional
from backend.core.lib.utils import get_audio_path
from backend.core.events.event_bus import EventBus
from backend.core.models.event import Event
from backend.core.models.track import Track
from backend.exceptions import SearchFailedError

from enum import Enum


class YouTubeClientAction(str, Enum):
    SEARCH = "search"
    DOWNLOAD = "download"

YTCA = YouTubeClientAction #alias for convenience in this file


class YouTubeClient:
    def __init__(
        self,
        *,
        name: str,
        base_dir: Path,
        event_bus: Optional[EventBus] = None,

        dl_format_filter: Optional[str] = None,
        dl_format: Optional[str] = None,
        dl_quality: Optional[str] = None,
        dl_user_agent: Optional[str] = None
    ):
        self.name = name
        self.base_dir = base_dir

        self._event_bus = event_bus

        self.dl_format_filter = dl_format_filter or "bestaudio[ext=m4a]/bestaudio/best"
        self.dl_format = dl_format or "mp3"
        self.dl_quality = dl_quality or "192K"
        self.dl_user_agent = dl_user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"

        self.dl_temp_format = "%(ext)s"


    async def _run_subprocess(self, cmd: List[str], timeout: int = 60):
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            raise RuntimeError(f"Subprocess timed out after {timeout} seconds.")
        
        return proc.returncode, stdout.decode(), stderr.decode()


    async def _emit_event(self, action: str, payload: Optional[dict] = None):
        if self._event_bus:
            event = Event(
                source=self.name,
                action=action,
                payload={**(payload or {})}
            )
            await self._event_bus.publish(event)
            print("[DEBUG]: Emitted event from YoutubeClient")

    
    async def search(
        self, 
        q: str, 
        limit: int = 3, 
        timeout: int = 60, 
        max_attempts: int = 3, 
        retry_delay: int = 30
    ) -> List[Track]:
        #cmd line search
        cmd = [
            "yt-dlp",
            "--format", self.dl_format_filter, #defeat SABR fragmentation streaming from yt, GitHub issue 12482
            f"ytsearch{limit}:{q}",
            "--user-agent", self.dl_user_agent,
            "--dump-json",
            "--skip-download"
        ]
        print(f"Running command: {' '.join(cmd)}")

        results = []
        try:
            start_time = time.time()
            code, out, err = await self._run_subprocess(cmd, timeout=timeout)

            if code != 0:
                raise RuntimeError(f"yt-dlp exited with code {code}: {err.strip()}")
        
            elapsed = time.time() - start_time
            print(f"[INFO] Searched {q} in {elapsed:.2f}s")

            #parse stdout
            raw_lines = out.strip().splitlines()

            if not raw_lines or all(not line.strip() for line in raw_lines):
                print(f"No output received from yt-dlp for query: '{q}'")

            for line in raw_lines:
                try:
                    data = json.loads(line)
                    track = Track(
                        youtube_id=data.get("id"),
                        title=data.get("title", "Unknown Title"),
                        uploader=data.get("uploader", "Unknown Uploader"),
                        duration=data.get("duration", 0),
                    )
                    results.append(track)
                except json.JSONDecodeError as je:
                    print(f"[WARN] JSON decode error on line: {line}\nError: {je}")

        except Exception as e:
            print(f"[ERROR] Failed to search {q}: {e}")
            results = []
        
        await self._emit_event(action=YTCA.SEARCH, payload={"content": results})
        return results


    async def download(
        self,
        track: Track, 
        timeout: int = 60, 
        max_attempts: int = 3, 
        retry_delay: int = 2
    ) -> bool:
        #prepares cmd line arguments
        output_path = get_audio_path(track=track, base_dir=self.base_dir, audio_format=self.dl_format)
        temp_path = get_audio_path(track=track, base_dir=self.base_dir, audio_format=self.dl_temp_format)

        url = f"https://www.youtube.com/watch?v={track.youtube_id}"

        #cmd line download
        cmd = [
            "yt-dlp",
            "-x", #audio only
            "-f", self.dl_format_filter, #defeat SABR fragmentation potentially
            "--audio-format", self.dl_format,
            "--audio-quality", self.dl_quality,
            "--user-agent", self.dl_user_agent,
            "--quiet",
            "--no-playlist",
            "-o", str(temp_path), #ytdlp requires temporary format
            url
        ]
        print(f"Running command: {' '.join(cmd)}")

        try:
            start_time = time.time()
            code, out, err = await self._run_subprocess(cmd, timeout=timeout)

            if code != 0:
                raise RuntimeError(f"yt-dlp exited with code {code}: {err.strip()}")
        
            elapsed = time.time() - start_time
            print(f"[INFO] Downloaded {track} in {elapsed:.2f}s")
            await self._emit_event(action=YTCA.DOWNLOAD, payload={})
            return True

        except Exception as e:
            print(f"[ERROR] Failed to download {track}: {e}")
            await self._emit_event(action=YTCA.DOWNLOAD, payload={})
            return False


        
    '''
        #retry on failure
        for attempt in range(1, max_attempts + 1):
            try:
                start_time = time.time()
                run_subprocess(cmd, timeout)
                elapsed_time = time.time() - start_time

                #ensure downloaded properly 
                if not output_path.exists() or get_audio_size(youtube_id) == 0:
                    raise DownloadFailedError(f"ytdlp succeeded but output file missing or empty: {output_path}")
                
                logger.info(f"Downloaded {youtube_id} in {elapsed_time:.2f}s at {output_path}")
                return None
            
            #catch error
            except subprocess.CalledProcessError as e:
                logger.error(f"Download failed for {youtube_id}: {e}")
                if attempt < max_attempts:
                    logger.warning(f"Download failed for {youtube_id} attempt number {attempt}. Retrying...")
                    time.sleep(retry_delay)
                else:
                    raise DownloadFailedError(f"Download failed for {youtube_id}") from e
            
            #timeout error
            except subprocess.TimeoutExpired as e:
                logger.error(f"Download timed out for {youtube_id}: {e}")
                raise DownloadFailedError(f"Download timed out for {youtube_id}") from e



    
    async def best_match(self, q: str) -> Optional[Track]:
        results = await self.search(q)
        return results[0] if results else None

    async def download(self, track: Track) -> bytes:
        # download audio from YouTube using youtube_id
        ...
    '''

'''
        #retry on failure
        for attempt in range(1, max_attempts + 1):
            try:
                start_time = time.time()    
                result = run_subprocess(cmd, timeout)
                elapsed_time = time.time() - start_time

                #parse stdout
                results = []
                raw_lines = result.stdout.strip().split('\n')

                if not raw_lines or all(not line.strip() for line in raw_lines):
                    print(f"No output received from yt-dlp for query: '{q}'")
                    return []

                for line in raw_lines:
                    try:
                        data = json.loads(line)
                        results.append(
                            Track(
                                youtube_id=data.get("id"),
                                title=data.get("title", "Unknown Title"),
                                uploader=data.get("uploader", "Unknown Uploader"),
                                duration=data.get("duration", 0),
                         )
                    except json.JSONDecodeError as je:
                        print(f"JSON decode error on line: {line}\nError: {je}")

                print(f"yt-dlp search for {limit} results on '{q}' took {elapsed_time:.2f} seconds.")
         )
                  
                await self._emit_event(source="search", action="enter", payload={"content": results}) #ENUMS?
                return results

            #catch error
            except subprocess.CalledProcessError as e:    
                print(f"Search failed for {q}: {e.stderr}")
                if attempt < max_attempts:
                    print(f"Search failed for {q} attempt number {attempt}. Retrying...")
                    time.sleep(retry_delay)
                else:
                    raise SearchFailedError(f"Search failed for {q}") from e
                
            #timeout error
            except subprocess.TimeoutExpired as e:
                print(f"Search timed out for {q}: {e}")
                raise SearchFailedError(f"Search timed out for {q}") from 

'''