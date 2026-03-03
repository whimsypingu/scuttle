from typing import Optional
from backend.core.models.enums import AudioDatabaseAction as ADA
import backend.globals as G

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
        def _logic():
            with self.cursor() as cur:
                cur.execute('''
                    SELECT
                        t.id,
                        COALESCE(t.title_display, t.title) AS title,
                        GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', ') AS artist,
                        t.duration
                    FROM titles t
                    INNER JOIN downloads d ON t.id = d.id
                    LEFT JOIN title_artists ta ON t.rowid = ta.title_rowid
                    LEFT JOIN artists a ON ta.artist_rowid = a.rowid
                    GROUP BY t.id
                    ORDER BY d.downloaded_at DESC;
                ''')
                return [dict(row) for row in cur.fetchall()]
            
        content = await self._atomic_db_op(_logic)
        await self._emit_event(action=ADA.GET_DOWNLOADS_CONTENT, payload={"content": content})

        return content


    async def get_all_playlists(self):
        def _logic():
            with self.cursor() as cur:
                cur.execute('SELECT id, name FROM playlists ORDER BY id;')
                return [dict(row) for row in cur.fetchall()]
            
        playlists = await self._atomic_db_op(_logic)
        await self._emit_event(action=ADA.GET_ALL_PLAYLISTS, payload={"content": playlists})
        
        return playlists


    async def get_playlist_content(self, playlist_id: int):
        def _logic():
            with self.cursor() as cur:
                #get playlist
                cur.execute('''
                    SELECT id, name
                    FROM playlists
                    WHERE id = ?
                ''', (playlist_id,))
                playlist_row = cur.fetchone()

                if not playlist_row:
                    return {
                        "id": playlist_id,
                        "name": None,
                        "trackIds": []
                    } 
                
                #get track ids in one go
                cur.execute('''
                    SELECT track_id
                    FROM playlist_titles 
                    WHERE playlist_id = ?
                    ORDER BY position ASC;
                ''', (playlist_id,))

                return {
                    "id": playlist_row["id"],
                    "name": playlist_row["name"],
                    "trackIds": [r["track_id"] for r in cur.fetchall()]
                }
            
        content = await self._atomic_db_op(_logic)
        await self._emit_event(action=ADA.GET_PLAYLIST_CONTENT, payload={"content": content})

        return content
        

    async def get_metadata(self, id: str, artist_delim: str = G.UNIT_SEP, include_artists: bool = False):
        """
        Retrieves a track's metadata by ID.

        Args:
            id: The unique identifier for the track.
            artist_delim: String separator for multiple artists. Defaults to UNIT_SEP.
            include_artists: If True, includes the 'artists' dictionary of artist credits in the response.

        Returns:
            dict: Metadata containing:
                {
                    "title": str,           # The track title display name
                    "artist": str,          # The formatted artist(s) display string
                    "artists": dict[str, Any] # (Optional) Full artist credit mapping
                }

            None: if invalid id.
        """
        def _logic():
            with self.cursor() as cur:
                track_id = id #id is a reserved sqlite function
                cur.execute(f'''
                    SELECT
                        t.rowid,
                        COALESCE(t.title_display, t.title) AS title,
                        GROUP_CONCAT(COALESCE(a.artist_display, a.artist), '{artist_delim} ') AS artist
                    FROM titles t
                    LEFT JOIN title_artists ta ON t.rowid = ta.title_rowid
                    LEFT JOIN artists a ON ta.artist_rowid = a.rowid
                    WHERE t.id = ?
                    GROUP BY t.rowid;
                ''', (track_id,))
                row = cur.fetchone()

                if not row:
                    return None

                data = dict(row)

                if include_artists:
                    title_rowid = data.pop('rowid')
                    cur.execute("""
                        SELECT
                            a.rowid,
                            a.id,
                            a.artist,
                            COALESCE(a.artist_display, a.artist) AS artist_display,
                            a.enriched_at
                        FROM artists a
                        JOIN title_artists ta ON ta.artist_rowid = a.rowid
                        WHERE ta.title_rowid = ?
                        ORDER BY ta.rowid; --preserves order they were added in
                    """, (title_rowid,))

                    data["artists"] = [dict(row) for row in cur.fetchall()]
                return data
            
        return await self._atomic_db_op(_logic)


    async def set_metadata(self, id: str, metadata: dict):
        """
        Updates a track's metadata usinga dictionary of fields.
        
        Supported fields:
        - 'new_id': Updates the unique track ID (assuming seed entry previously)
        - 'title': Updates the title
        - 'title_display': Updates the user-facing title
        - 'duration': Updates track length
        """
        def _logic():
            field_map = {
                "new_id": "id",
                "title": "title",
                "title_display": "title_display",
                "duration": "duration"
            }

            updates = []
            params = []

            for key, col in field_map.items():
                if key in metadata and metadata[key] not in (None, ""):
                    updates.append(f"{col} = ?")
                    params.append(metadata[key])

            with self.cursor() as cur:
                #update
                if updates:
                    params.append(id) #for the WHERE clause
                    cur.execute(f"UPDATE titles SET {', '.join(updates)} WHERE id = ?;", tuple(params))

                #fetch fresh state using new_id if it changed, otherwise the old id
                search_id = metadata.get("new_id", id)
                cur.execute('''
                    SELECT
                        t.id AS updated_id,
                        COALESCE(t.title_display, t.title) AS updated_title,
                        GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', ') AS updated_artist
                    FROM titles t
                    LEFT JOIN title_artists ta ON t.rowid = ta.title_rowid
                    LEFT JOIN artists a ON ta.artist_rowid = a.rowid
                    WHERE t.id = ?
                    GROUP BY t.id;
                ''', (search_id,))

                row = cur.fetchone()
                return {
                    "id": id,
                    "newId": row["updated_id"],
                    "title": row["updated_title"],
                    "artist": row["updated_artist"]
                }

        content = await self._atomic_db_op(_logic)
        await self._emit_event(action=ADA.SET_METADATA, payload={"content": content})

        return content
