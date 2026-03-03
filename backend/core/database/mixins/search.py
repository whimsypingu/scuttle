import time
import sqlite3

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
        if not q:
            content = []
        else:
            tokens = q.split()
            fts_query = " ".join(f"{t}*" for t in tokens)
            limit = 30            
            params = (fts_query, limit)

            def _execute_search():
                query = '''
                    SELECT
                        t.id,
                        COALESCE(t.title_display, t.title) AS title,
                        GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', ') AS artist,
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
                with self.cursor() as cur:
                    cur.execute(query, params)
                    return cur.fetchall()
                
            rows = await self._atomic_db_op(_execute_search)
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


    async def rebuild_search_index(self):
        """
        Manually synchronizes the FTS5 index with the current state of the
        titles and artists tables. Only necessary when names are changed for titles or artists.
        
        This should only be used for batch changes, but for now keep it. 
        Refactoring into faster updates will be important for future performance (currently 0.04s-0.06s)
        """
        print("Synchronizing search index with database...")

        def _rebuild():
            search_rebuild_start_time = time.perf_counter()

            with self.cursor() as cursor:
                # 1. Clear the current index
                cursor.execute("INSERT INTO catalog_fts(catalog_fts) VALUES('delete-all')")

                # 2. Re-populate from the view
                cursor.execute("INSERT INTO catalog_fts(catalog_fts) VALUES('rebuild')")

            search_rebuild_duration = time.perf_counter() - search_rebuild_start_time
            print(f"[{self.name}] Success: FTS5 index is up to date. ({search_rebuild_duration:.3f}s)")

        await self._atomic_db_op(_rebuild)


