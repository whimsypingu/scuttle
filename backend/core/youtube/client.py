#backend/core/audio/youtube_client.py

import asyncio
import json
from pathlib import Path
import subprocess
import sys
import time
from typing import Callable, List, Optional

from backend.core.audio.postprocess import compress_audio, trim_silence, apply_loudnorm

from backend.core.lib.utils import get_audio_path
from backend.core.events.event_bus import EventBus
from backend.core.models.event import Event
from backend.core.models.track import Track
from backend.exceptions import SearchFailedError

from backend.core.models.enums import YouTubeClientAction as YTCA


#if this fucker breaks just run: python -m pip install -U yt-dlp (goated software btw up with ffmpeg)
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

        self.id_src = "YT___" #source for id's, so that it'll be like YT___#######...

        self.dl_format_filter = dl_format_filter or "bestaudio/best"
        self.dl_format = dl_format or "wav"
        self.dl_quality = dl_quality or "0"
        self.dl_user_agent = dl_user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
        #self.dl_user_agent = dl_user_agent or "Mozilla/5.0" #"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"

        self.dl_temp_format = "%(ext)s"
        
        #system check, not needed if python version >= 3.8
        if sys.platform == "win32": 
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            print("[DEBUG]: Set event loop policy")



    async def _run_subprocess(self, cmd: List[str], timeout: int = 60):
        """
        Run a subprocess asynchronously and capture its output.

        Parameters:
            cmd (List[str]): The command and arguments to execute as a list.
                            Example: ["yt-dlp", "--version"]
            timeout (int): Maximum time in seconds to wait for the subprocess to finish.
                        Raises RuntimeError if exceeded.

        Returns:
            Tuple[int, str, str]: (returncode, stdout, stderr)
                - returncode: The exit code of the subprocess.
                - stdout: Standard output decoded as a UTF-8 string.
                - stderr: Standard error decoded as a UTF-8 string.

        Raises:
            RuntimeError: If the subprocess does not complete within `timeout` seconds.
            Any exception raised by asyncio.create_subprocess_exec or communicate.

        Example:
            code, out, err = await self._run_subprocess(["yt-dlp", "--version"], timeout=10)
        """ 

        #NOTE: using --reload on fastapi server boot cucks asyncio create_subprocess
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
        except Exception as e:
            print(f"[ERROR]: Failed to start subprocess: {type(e).__name__}: {e}")

        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            print("[DEBUG]: TimeoutError")
            proc.kill()
            await proc.wait()
            raise RuntimeError(f"Subprocess timed out after {timeout} seconds.")
        
        return proc.returncode, stdout.decode(), stderr.decode()
     

    async def _retry_async(self, func: Callable, max_attempts=3, base_delay=1, factor=2, max_delay=20, *args, **kwargs):
        """
        Retry an asynchronous function with exponential backoff.

        Parameters:
            func (Callable): The async function to call.
            max_attempts (int): Maximum number of attempts before giving up.
            base_delay (float): Initial delay before first retry (seconds).
            factor (float): Multiplier for exponential backoff.
            max_delay (float): Maximum delay between retries (seconds).
            *args: Positional arguments to pass to func.
            **kwargs: Keyword arguments to pass to func.

        Returns:
            The return value of func if successful.

        Raises:
            Exception: Re-raises the last exception if all attempts fail.
        """
        for attempt in range(1, max_attempts + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                print(f"[WARN]: Attempt {attempt}/{max_attempts} failed: {e}")
                if attempt == max_attempts:
                    raise

                delay = min(base_delay * (factor ** (attempt - 1)), max_delay)
                await asyncio.sleep(delay)
                

    async def _emit_event(self, action: str, payload: Optional[dict] = None):
        if self._event_bus:
            event = Event(
                source=self.name,
                action=action,
                payload={**(payload or {})}
            )
            await self._event_bus.publish(event)
            print("[DEBUG]: Emitted event from YoutubeClient")


    async def update(self, timeout=60) -> bool:
        """
        Update yt-dlp
        """
        cmd = ["yt-dlp", "-U"]
        print(f"Running command: {' '.join(cmd)}")

        try:
            code, out, err = await self._run_subprocess(cmd, timeout=timeout)

            if code != 0:
                print(f"[ERROR] yt-dlp update failed: {err}")
                return False
            
            print("[INFO] yt-dlp updated successfully")
            return True

        except Exception as e:
            print(f"[ERROR] Failed to update yt-dlp: {e}")
            return False

    
    async def search(
        self, 
        q: str, 
        limit: int = 3, 
        timeout: int = 60,
        _retry: bool = True
    ) -> List[Track]:
        """
        Search YouTube using yt-dlp with retries and return Track objects.
        """
        await self._emit_event(action=YTCA.START, payload={})

        #cmd line search
        delim = "\x1f"
        cmd = [
            "yt-dlp",
            f'ytsearch{limit}:{q}',
            "--format", self.dl_format_filter, #defeat SABR fragmentation streaming from yt, GitHub issue 12482
            "--user-agent", self.dl_user_agent,
            "--no-download",
            "--no-cache-dir", #prevents using stale cached DASH fragments
            "--print", f"%(id)s{delim}%(title)s{delim}%(uploader)s{delim}%(duration)s"
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
                parts = line.split(delim)
                if len(parts) != 4:
                    print(f"[WARN]: Unexpected line format: {line}")
                    continue

                id, title, artist, duration = parts
                true_id = f"{self.id_src}{id}"

                track = Track(
                    id=true_id,
                    title=title or "Unknown Title",
                    artist=artist or "Unknown Artist",
                    duration=int(duration) if duration.isdigit() else 0,
                )
                results.append(track)

        except Exception as e:
            print(f"[ERROR] Failed to search {q}: {e}")

            #only retry once
            if _retry:
                print(f"[INFO] Attempting yt-dlp update and one retry")

                success = await self.update()
                if success:
                    print(f"[INFO] Retrying search after yt-dlp update")
                    return await self.search(q, limit, timeout, _retry=False) #try again without retry flag

            #retry failure return empty list
            results = []
        
        print(f"[DEBUG] Searching '{q}' with limit={limit}")
        
        #only emit when fetching multiple results
        if limit > 1:
            await self._emit_event(action=YTCA.SEARCH, payload={"content": results})

        await self._emit_event(action=YTCA.FINISH, payload={})
        return results


    async def download_by_id(
        self,
        id: str, 
        timeout: int = 60,
        custom_metadata: Optional[dict] = None,
        _retry: bool = True
    ) -> bool:
        """
        Downloads a track given a Youtube ID using ytdlp and returns a Track object.
        If custom_track is provided, its fields override the downloaded metadata.
        Internal flag _retry to attempt again if yt-dlp is updated.
        """
        #send task start notification
        await self._emit_event(action=YTCA.START, payload={})

        #prepares cmd line arguments
        output_path = get_audio_path(id=id, base_dir=self.base_dir, audio_format=self.dl_format)
        temp_path = get_audio_path(id=id, base_dir=self.base_dir, audio_format=self.dl_temp_format)

        if id.startswith(self.id_src):
            id = id[len(self.id_src):]

        url = f"https://www.youtube.com/watch?v={id}"

        #cmd line download
        delim = "\x1f"
        cmd = [
            "yt-dlp",
            "-x", #audio only
            "-f", self.dl_format_filter, #defeat SABR fragmentation potentially
            "--audio-format", self.dl_format,
            "--audio-quality", self.dl_quality,
            "--user-agent", self.dl_user_agent,
            "--quiet",
            "--no-playlist",
            "--no-cache-dir", #prevents using stale cached DASH fragments
            "--retries", "10",
            "--fragment-retries", "3", #network robustness for missing packets
            "--retry-sleep", "linear=1::5",
            "-o", str(temp_path), #ytdlp requires temporary format
            "--print", f"after_move:%(id)s{delim}%(title)s{delim}%(uploader)s{delim}%(duration)s", #complete print after download
            url
        ]
        print(f"Running command: {' '.join(cmd)}")

        track = None
        try:
            start_time = time.time()
            code, out, err = await self._run_subprocess(cmd, timeout=timeout)

            if code != 0:
                raise RuntimeError(f"[download_by_id] yt-dlp exited with code {code}: {err.strip()}")
        
            elapsed = time.time() - start_time
            print(f"[INFO] Downloaded {id} in {elapsed:.2f}s")

            # Parse metadata from stdout
            try:
                line = out.strip().splitlines()[0]  # first line
                id, title, artist, duration = line.split(delim)
            except Exception as e:
                raise ValueError(f"[download_by_id] Failed to parse metadata: {e}, Output was: {out}")

            #build track object
            true_id = f"{self.id_src}{id}"
            track = Track(
                id=true_id,
                title=title or "Unknown Title",
                artist=artist or "Unknown Artist",
                duration=int(duration) if duration.isdigit() else 0
            )

            #override custom fields
            if custom_metadata:
                for k, v in custom_metadata.items():
                    if v not in (None, "") and hasattr(track, k):
                        setattr(track, k, v)

            #postprocess audio file
            trim_silence(output_path)
            apply_loudnorm(output_path)
            compress_audio(output_path, "opus")

            await self._emit_event(action=YTCA.DOWNLOAD, payload={"content": track})
            return track

        except Exception as e:
            print(f"[ERROR] Failed to download {id}: {e}")
            await self._emit_event(action=YTCA.ERROR, payload={})

            #only retry once
            if _retry:
                print(f"[INFO] Attempting yt-dlp update and one retry")

                success = await self.update()
                if success:
                    print(f"[INFO] Retrying download after yt-dlp update")
                    return await self.download_by_id(id, timeout, custom_metadata, _retry=False) #try again without retry flag

            #if update fails or retry fails, raise original exception
            raise
        
        finally:
            #complete task notification
            await self._emit_event(action=YTCA.FINISH, payload={})
                

    async def download_by_query(
        self,
        q: str,
        timeout: int = 60,
        custom_metadata: Optional[dict] = None
    ) -> bool:
        
        result = await self.search(q=q, limit=1, timeout=timeout) #doesnt emit when searching 1 item

        if not result:
            print(f"[WARN]: No results found for query: {q}")
            return False
        
        id = result[0].id
        print(f"[DEBUG] Result: {result}, ID: {id}")

        track = await self.download_by_id(id, timeout=timeout, custom_metadata=custom_metadata)
        print(f"[DEBUG] Track: {track}")

        return track
