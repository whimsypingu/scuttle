from typing import List

from backend.core.models.track import Track
from backend.core.models.enums import AudioDatabaseAction as ADA

class SearchMixin:
    async def search(self, q: str) -> List[Track]:
        """
        Search for tracks by title or artist, matching both original and custom values.

        Args:
            q (str): The search query string. If empty, returns all tracks.

        Returns:
            list[dict]: List of track objects with id, title, artist, duration.
        """
        async with self._lock:
            if not q:
                query = '''
                    SELECT
                        t.id,
                        COALESCE(t.title_display, t.title) AS title,
                        COALESCE(
                            GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', '),
                            t.source
                        ) AS artist,
                        t.duration
                    FROM titles t
                    INNER JOIN downloads d ON t.id = d.id
                    LEFT JOIN title_artists ta ON t.rowid = ta.title_rowid
                    LEFT JOIN artists a ON ta.artist_rowid = a.rowid
                    GROUP BY t.id
                    ORDER BY d.downloaded_at DESC;
                '''
                params = ()

            else:            
                query = '''
                    SELECT
                        t.id,
                        COALESCE(t.title_display, t.title) AS title,
                        COALESCE(
                            GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', '),
                            t.source
                        ) AS artist,
                        t.duration
                    FROM titles t
                    JOIN catalog_fts fts ON fts.rowid = t.rowid
                    LEFT JOIN title_artists ta ON t.rowid = ta.title_rowid
                    LEFT JOIN artists a ON ta.artist_rowid = a.rowid
                    WHERE catalog_fts MATCH ?
                    GROUP BY t.id
                    ORDER BY rank;
                '''
                tokens = q.split()
                fts_query = " ".join(f"{t}*" for t in tokens)
                params = (fts_query,)

            rows = await self._fetchall(query, params)
            content = [
                Track(
                    id=row["id"], 
                    title=row["title"],
                    artist=row["artist"],
                    duration=row["duration"]
                )
                for row in rows
            ]

            await self._emit_event(action=ADA.SEARCH, payload={"content": content})
    
            return [track.to_json() for track in content]
