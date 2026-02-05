from typing import Optional
from backend.core.models.enums import AudioDatabaseAction as ADA

class GetsetMixin:
    async def get_downloads_content(self):
        """
        Retrieve full metadata for all downloaded tracks, ordered by download time.

        This method joins the DOWNLOADS and TRACKS tables to fetch detailed
        information (id, title, artist, duration) for each downloaded track.
        Custom title and artist fields are preferred if available.

        The results are returned in reverse chronological order of download time,
        with the most recently downloaded tracks first.

        After fetching, an ADA.GET_DOWNLOADS_CONTENT event is emitted to notify
        connected clients or listeners.

        Returns:
            list[dict]: A list of track objects in the following shape:
                [
                    {
                        "id": str,
                        "title": str,
                        "artist": str,
                        "duration": float
                    },
                    ...
                ]

        Example:
            >>> await db.get_downloads_content()
            [
                {"id": "abc123", "title": "Song A", "artist": "Artist X", "duration": 210},
                {"id": "xyz456", "title": "Song B", "artist": "Artist Y", "duration": 185},
            ]
        """
        async with self._lock:
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
            rows = await self._fetchall(query)

            content = [
                {
                    "id": row["id"],
                    "title": row["title"],
                    "artist": row["artist"],
                    "duration": row["duration"]
                }
                for row in rows
            ]

            await self._emit_event(
                action=ADA.GET_DOWNLOADS_CONTENT,
                payload={"content": content}
            )

            return content


    async def get_all_playlists(self):
        async with self._lock:
            rows = await self._fetchall(f'''
                SELECT id, name
                FROM playlists
                ORDER BY id;
            ''')
            playlists = [{"id": row["id"], "name": row["name"]} for row in rows]

            await self._emit_event(action=ADA.GET_ALL_PLAYLISTS, payload={"content": playlists})
            
            return playlists


    async def get_playlist_content(self, playlist_id: int):
        async with self._lock:
            # Get playlist info
            playlist_row = await self._fetchone(f'''
                SELECT id, name
                FROM playlists
                WHERE id = ?
            ''', (playlist_id,))
            if not playlist_row:
                return {
                    "id": playlist_id,
                    "name": None,
                    "trackIds": []
                } 
    
            rows = await self._fetchall(f'''
                SELECT track_id
                FROM playlist_titles 
                WHERE playlist_id = ?
                ORDER BY position ASC;
            ''', (playlist_id,))
            track_ids = [row["track_id"] for row in rows]

            content = {
                "id": playlist_row["id"],
                "name": playlist_row["name"],
                "trackIds": track_ids
            }

            await self._emit_event(action=ADA.GET_PLAYLIST_CONTENT, payload={"content": content})
    
            return content
            #PLEASE CHANGE THIS THIS IS SO UGLY
        


    async def set_custom_metadata(self, id: str, custom_title: Optional[str] = None, custom_artist: Optional[str] = None):
        async with self._lock:
            #some robustness for handling None or "" values
            custom_title_val = custom_title if custom_title not in (None, "") else None
            custom_artist_val = custom_artist if custom_artist not in (None, "") else None

            await self._execute(f'''
                UPDATE titles
                SET title_display = ?,
                    source = ?
                WHERE id = ?;
            ''', (custom_title_val, custom_artist_val, id))

            #compute effective title/artist (unfortunately uses another query but it works)
            row = await self._fetchone(f'''
                SELECT 
                    COALESCE(t.title_display, t.title) AS title,
                    COALESCE(
                        GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', '),
                        t.source
                    ) AS artist
                FROM titles t
                WHERE id = ?;
            ''', (id,))

            content = {
                "id": id,
                "title": row["title"],
                "artist": row["artist"]
            }

            await self._emit_event(action=ADA.SET_METADATA, payload={"content": content})

            return content
