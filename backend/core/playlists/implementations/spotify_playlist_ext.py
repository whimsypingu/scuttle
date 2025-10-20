import requests
import re
import json
import urllib.request
from urllib.parse import urlparse

from backend.core.lib.utils import find_key
from backend.core.playlists.base.extractor import PlaylistExtractor


class SpotifyPlaylistExtractor(PlaylistExtractor):
    SPOTIFY_PLAYLIST_RE = re.compile(
        r"(spotify:playlist:|open\.spotify\.com/playlist|spotify\.link/)", re.IGNORECASE
    )

    def matches_url(self) -> bool:
        return bool(self.SPOTIFY_PLAYLIST_RE.search(self.url))
        #return "spotify.com/playlist" in self.url or "spotify:playlist:" in self.url #URI handling too
    

    def _resolve_link(self):
        try: 
            with urllib.request.urlopen(self.url, timeout=15) as response:
                self.set_url(response.geturl())
        except Exception as e:
            print(f"[DEBUG] Failed to resolve link: {e}")
            return


    def _embed_url(self):
        # handles forms like:
        # https://open.spotify.com/playlist/<id>?si=...
        # https://open.spotify.com/playlist/<id>
        #needs handling for URI?
        try:
            p = urlparse(self.url)
            parts = p.path.split("/")
            idx = parts.index("playlist")
            playlist_id = parts[idx + 1]
        except Exception:
            #fallback regex
            m = re.search(r"playlist/([A-Za-z0-0]+)", self.url)
            playlist_id = m.group(1) if m else None

        if not playlist_id:
            raise ValueError(f"Could not extract playlist ID from URL: {self.url}")

        return f"https://open.spotify.com/embed/playlist/{playlist_id}"



    def _clean(self, s: str) -> str:
        """Clean up weird characters, spot has \xa0 which is non-breaking space"""
        if not s:
            return ""
        s = s.replace("\xa0", " ")
        return s
    

    def fetch_data(self):
        #get optimal webpage for scraping
        self._resolve_link()
        embed_url = self._embed_url()
        #print(f"embed_url: {embed_url}")

        r = requests.get(embed_url, headers=self.HEADERS, timeout=15)
        r.raise_for_status()

        #scrape
        html = r.text
        match = re.search(r'<script[^>]+type="application/json"[^>]*>(.*?)</script>', html, re.DOTALL)
        if not match:
            raise ValueError("No JSON script tag found")

        data = json.loads(match.group(1))

        #after digging through the data this is probably optimal
        #test using this command in case spotify breaks some shit
        # print(json.dumps(data, indent=4))
        keyword = "trackList"
        track_list = find_key(data, keyword) 
        
        #validation
        if not track_list:
            raise ValueError(f"Failed to locate '{keyword}' in Spotify embed JSON. The structure may have changed")
        
        for i, track in enumerate(track_list):
            if "title" not in track or "subtitle" not in track:
                raise ValueError(f"Track at index {i} is missing one or more required fields: {track}")
            


        #clean it up and send it back
        tracks = []
        for t in track_list or []:
            title = self._clean(t.get("title", ""))
            artist = self._clean(t.get("subtitle", ""))
            tracks.append({
                "download_query": f"{title} by {artist}",
                "metadata": {
                    "title": title,
                    "artist": artist
                }
            })


        #debugging
        # for t in tracks:
        #     print(json.dumps(t, indent=4))
        if not tracks:
            raise ValueError(f"No tracks found")

        return tracks
