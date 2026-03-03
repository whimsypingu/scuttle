#backend/core/musicbrainz/client.py

import asyncio
import time
import httpx
import re
import secrets
from typing import Optional

from backend.core.lib.utils import normalize_for_search
import backend.globals as G

class MusicBrainzClient:
    def __init__(
        self,
        name: str,
        user: Optional[str] = None,
        contact: Optional[str] = None,
        minimum_wait: float = 1.5,
        max_retries: int = 3,
        limit: int = 1000
    ):
        self.name = name

        #see this link for rate-limiting docs on musicbrainz, consider changing instance to per user in .env
        #https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
        self._instance_identifier = secrets.token_hex(4) #e.g., 'f3a2b1c0'
        self.user = user or "ScuttleMusicEnrichment/0.1"
        self.contact = contact or "( https://github.com/whimsypingu/scuttle )"

        self.user_agent = f"{self.user} {self.contact} Instance/{self._instance_identifier}"

        self.base_url = "https://musicbrainz.org/ws/2"
        self.client = httpx.AsyncClient(
            headers={
                "User-Agent": self.user_agent,
                "Accept": "application/json"
            },
            timeout=10.0,
            follow_redirects=True
        )

        self.SPECIAL_CHARS_PATTERN = re.compile(r"[()\[\]/]")

        self._last_call = 0.0
        self._lock = asyncio.Lock()
        
        self.limit = limit
        self.minimum_wait = minimum_wait
        self.max_retries = max_retries

    async def fetch(self, endpoint: str, params: Optional[dict] = None):
        #only one request handled at a time
        params = params or {}
        async with self._lock:
            now = time.time()
            elapsed = now - self._last_call

            if elapsed < self.minimum_wait:
                await asyncio.sleep(self.minimum_wait - elapsed)

            try: 
                for attempt in range(self.max_retries):
                    full_url = f"{self.base_url}/{endpoint}"
                    response = await self.client.get(full_url, params=params)

                    print(f"[DEBUG] musicbrainzclient.py: full_url: {full_url}, params: {params}")

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
                print(f"[ERROR]: Musicbrainz fetch returned {e.response.status_code}")
            except Exception as e:
                print(f"[ERROR]: Musicbrainz fetch exception: {type(e).__name__} - {repr(e)}")
        
        return None
        

    async def search(self, title, artists, threshold=0.95):
        """
        Takes display titles and display artists to try a search, and returns the best valid result.

        title: "APT."
        artists: "Bruno Mars\x1fROSE"
        threshold: 0.95 (between 0 and 1)

        Returns: None on failure, otherwise in success in this format:
        {
            'score': 100,
            'title': 'apt',
            'title_display': 'APT.',
            'artists': 
            [
                {
                    'mbid': '7f233cda-eacb-4235-b681-5f7be343a1a2',
                    'artist': 'rose',
                    'artist_display': 'ROSÉ'
                },
                {
                    'mbid': 'afb680f2-b6eb-4cd7-a70b-a63b25c763d5',
                    'artist': 'bruno mars',
                    'artist_display': 'Bruno Mars'
                }
            ]
        }
        """
        title = title.replace('"', '')
        artists = artists.replace('"', '')
        artists = artists.replace(G.UNIT_SEP, '" OR "')

        lucene_query = f'recording:"{title}" AND artist:("{artists}")'

        endpoint = "recording"
        params = {
            "query": lucene_query
        }

        data = await self.fetch(endpoint=endpoint, params=params)
        print(f"[DEBUG] musicbrainzclient.py: fetch returned: {str(data)[:40]}")
        if not data:
            return None

        #no results
        recordings = data.get("recordings", [])
        if len(recordings) == 0:
            return None
        
        r = recordings[0]

        #best result score below threshold
        score = r.get("score", 0)
        if score < (threshold * 100):
            return None
        
        output = {}
        output["score"] = score

        title_display = r.get("title", "UNKNOWN TITLE")
        output["title"] = normalize_for_search(title_display)
        output["title_display"] = title_display
        output["artists"] = []

        #extract individual artist data. TODO: add more checks here for robustness
        for ac in r.get("artist-credit", []):
            data = ac.get("artist", {})
            
            artist_display = data.get("name", "")
            filtered_data = {
                "mbid": data.get("id", ""),
                "artist": normalize_for_search(artist_display),
                "artist_display": artist_display
            }

            output["artists"].append(filtered_data)
        
        return output
            
    
    async def recordings(self, mbid, limit=None):
        """
        Retrieves musicbrainz results from an mbid in a programmatic scrape effort
        """
        if limit is None:
            limit = self.limit
            
        result_set = {}

        iteration = 0
        retrievable = 100
        retrieved_count = 100 #initial to start the loop
        total_retrieved = 0

        endpoint = 'recording'
        exclusions = (
            '-status:"pseudo-release" -status:withdrawn -status:expunged -status:cancelled '
            '-primarytype:broadcast -primarytype:other '
            '-secondarytype:"mixtape/street" -secondarytype:"dj-mix" -secondarytype:remix '
            '-secondarytype:live -secondarytype:interview -secondarytype:spokenword'
        )
        search_query = f'arid:{mbid} {exclusions}'

        while retrieved_count >= retrievable and limit > 0:
            params = {
                "query": search_query,
                "limit": retrievable,
                "offset": total_retrieved,
            }

            data = await self.fetch(endpoint=endpoint, params=params)

            #process
            retrieved = data.get("recordings", [])
            for i, r in enumerate(data.get("recordings", [])):
                title = r.get("title", None)
                if ((not title) or self._contains_special_chars(title)):
                    continue

                duration = r.get("length", 0)
                if duration == 0:
                    continue

                norm_title = normalize_for_search(title)

                #filter to get the earliest date
                first_release_date = r.get("first-release-date", "9999-00-00")
                existing_date = result_set.get(norm_title, {}).get("first_release_date", "9999-99-99")
                if (first_release_date > existing_date):
                    continue

                #extract artist data
                artist_credits = r.get("artist-credit", [])
                artist_data = []
                for ac in artist_credits:
                    name = ac.get("name", "")
                    mbid = ac.get("artist", {}).get("id", "")
                    artist_data.append({
                        "mbid": mbid,
                        "artist": normalize_for_search(name),
                        "artist_display": name
                    })

                recording_entry = {
                    "mbid": r.get("id", ""),
                    "title": norm_title,
                    "title_display": title,
                    "artists": artist_data,
                    "first_release_date": first_release_date,
                    "duration": duration / 1000
                }

                result_set[norm_title] = recording_entry

            total_count = data.get("recording-count", data.get("count", 9999))
            retrieved_count = len(retrieved)
            total_retrieved += retrieved_count
            limit -= retrieved_count
            iteration += 1

            print(
                f'Iteration: {iteration}\n'
                f'Retrievable count: {total_count}\n'
                f'Number retrieved this iteration: {retrieved_count}\n'
                f'Total number retrieved: {total_retrieved}\n'
                f'Available to retrieve: {limit}\n'
            )

        return result_set


    def _contains_special_chars(self, s: str):
        """Returns True if the string satisfies the special character pattern condition"""
        return bool(self.SPECIAL_CHARS_PATTERN.search(s))


    async def close(self):
        await self.client.aclose()
