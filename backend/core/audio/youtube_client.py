#backend/core/audio/youtube_client.py

import json
from pathlib import Path
import subprocess
import time
from typing import List, Optional
from backend.core.audio.utils import run_subprocess
from backend.core.events.event_bus import EventBus
from backend.core.models.event import Event
from backend.core.models.track import Track
from backend.exceptions import SearchFailedError

class YouTubeClient:
    def __init__(
        self,
        *,
        download_dir: Path,
        event_bus: EventBus,

        dl_format_filter: Optional[str] = None,
        dl_format: Optional[str] = None,
        dl_user_agent: Optional[str] = None
    ):
        self.download_dir = download_dir

        self._event_bus = event_bus

        self.dl_format_filter = dl_format_filter or "bestaudio[ext=m4a]/bestaudio/best"
        self.dl_format = dl_format or "mp3"
        self.dl_user_agent = dl_user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"


    async def _emit_event(self, source: str, action: str, payload: Optional[dict] = None):
        if self._event_bus:
            event = Event(
                source=source,
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
        cmd = [
            "yt-dlp",
            "--format", self.dl_format_filter, #defeat SABR fragmentation streaming from yt, GitHub issue 12482
            f"ytsearch{limit}:{q}",
            "--user-agent", self.dl_user_agent,
            "--dump-json",
            "--skip-download"
        ]
        print(f"Running command: {' '.join(cmd)}")

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
                        )
                    except json.JSONDecodeError as je:
                        print(f"JSON decode error on line: {line}\nError: {je}")

                print(f"yt-dlp search for {limit} results on '{q}' took {elapsed_time:.2f} seconds.")

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
                raise SearchFailedError(f"Search timed out for {q}") from e



    async def best_match(self, q: str) -> Optional[Track]:
        results = await self.search(q)
        return results[0] if results else None

    async def download(self, track: Track) -> bytes:
        # download audio from YouTube using youtube_id
        ...

