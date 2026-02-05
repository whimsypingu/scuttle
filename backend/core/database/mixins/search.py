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
                content = []

            else:
                limit = 30
                query = '''
                    SELECT
                        t.id,
                        COALESCE(t.title_display, t.title) AS title,
                        COALESCE(
                            GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', '),
                            "Unknown Artist"
                        ) AS artist,
                        t.duration,

                        sub.score * t.pref_weight * MAX(a.pref_weight) AS final_rank
                    FROM (
                        SELECT
                            rowid,
                            bm25(catalog_fts, 1.0, 1.5) AS score
                        FROM catalog_fts
                        WHERE catalog_fts MATCH ?
                        LIMIT ?
                    ) AS sub
                    JOIN titles t ON t.rowid = sub.rowid
                    JOIN title_artists ta ON ta.title_rowid = t.rowid
                    JOIN artists a ON a.rowid = ta.artist_rowid
                    GROUP BY sub.rowid
                    ORDER BY final_rank ASC;
                '''
                tokens = q.split()
                fts_query = " ".join(f"{t}*" for t in tokens)
                params = (fts_query, limit)

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
