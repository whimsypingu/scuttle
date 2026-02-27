#backend/core/musicbrainz/client.py

import asyncio
import time
import httpx
import secrets
from typing import Optional

class MusicbrainzClient:
    def __init__(
        self,
        name: str,
        user: Optional[str] = None,
        contact: Optional[str] = None,
        minimum_wait: float = 1.5,
        max_retries: int = 3
    ):
        self.name = name

        #see this link for rate-limiting docs on musicbrainz, consider changing instance to per user in .env
        #https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
        self._instance_identifier = secrets.token_hex(4) #e.g., 'f3a2b1c0'
        self.user = user or "ScuttleMusicEnrichment/0.1"
        self.contact = contact or "( https://github.com/whimsypingu/scuttle )"

        self.user_agent = f"{self.user} {self.contact} Instance/{self._instance_identifier}"

        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": self.user_agent,
                "Accept": "application/json"
            }
            timeout=10.0,
            follow_redirects=True
        )

        self._last_call = 0.0
        self._lock = asyncio.Lock()

        self.minimum_wait = minimum_wait
        self.max_retries = max_retries

    async def fetch(self, endpoint: str, params: Optional[dict] = {}):
        #only one request handled at a time
        async with self._lock:
            now = time.time()
            elapsed = now - self._last_call

            if elapsed < self.minimum_wait:
                await asyncio.sleep(self.minimum_wait - elapsed)

            try: 
                for attempt in range(self.max_retries):
                    full_url = f"{self.base_url}/{endpoint}"
                    response = await self.client.get(full_url, params=params)

                    self._last_call = time.time()

                    if response.status_code == 200:
                        return response.json()
                    
                    if response.status_code == 503: #rate limited
                        retry_delay = self.minimum_wait * (attempt + 2)
                        await asyncio.sleep(retry_delay)

                        self._last_call = time.time()
                        continue
                        
                    response.raise_for_status()
            
            except httpx.HTTPStatusError as e:
                print(f"[ERROR]: Musicbrainz returned {e.response.status_code}")
            except Exception as e:
                print(f"[ERROR]: {e}")

            return None

    async def close(self):
        await self.client.aclose()
