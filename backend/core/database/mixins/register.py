from backend.core.models.track import Track
from backend.core.models.enums import AudioDatabaseAction as ADA

class RegisterMixin:
    async def register_track(self, track: Track):
        """
        Log (insert or update) a track's metadata into the TITLES table.

        This method ensures that the database always has up-to-date metadata for
        a given track. If the track already exists, its metadata is replaced;
        otherwise, a new row is inserted. The `downloads` and `playlist_titles`
        tables are not affected by this call — it only manages the metadata
        layer.

        After the database operation completes, an ADA.REGISTER_TRACK event is emitted
        to notify any connected clients or event listeners of the new or updated
        track.

        Args:
            track (Track): A Track object containing at least:
                - id (str): Unique track ID (primary key).
                - title (str): Track title.
                - artist (str|None): Track artist.
                - duration (float|None): Track duration in seconds.

        Emits:
            ADA.REGISTER_TRACK — with payload containing the track's metadata.

        Example:
            >>> await db.register_track(Track(id="abc123", title="Song", artist="Artist", duration=200))
        """
        async with self._lock:
            await self._execute('''
                INSERT INTO titles (id, title, source, duration)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title = excluded.title,
                    source = excluded.source,
                    duration = excluded.duration;
            ''', (
                track.id, 
                track.title, 
                track.artist,
                track.duration
            ))

            await self._execute('''
                INSERT INTO artists (artist) VALUES (?)
                ON CONFLICT(artist) DO NOTHING;
            ''', (track.artist,))

            await self._execute('''
                INSERT INTO title_artists (title_rowid, artist_rowid)
                SELECT t.rowid, a.rowid
                FROM titles t, artists a
                WHERE t.id = ? AND a.artist = ?
                ON CONFLICT DO NOTHING;
            ''', (track.id, track.artist))

            content = {
                "id": track.id,
                "title": track.title,
                "artist": track.artist,
                "duration": track.duration
            }
            await self._emit_event(action=ADA.REGISTER_TRACK, payload={"content": content})


    async def unregister_track(self, id: str):
        """
        Completely remove a track's metadata and all associated references
        from the database.

        This method deletes the track from the TITLES table by its unique ID.
        Because of the ON DELETE CASCADE constraints, this operation will
        automatically propagate and remove any related entries in the
        DOWNLOADS, LIKES, and PLAYLIST_TITLES tables.

        After the database operation completes, an ADA.UNREGISTER_TRACK event is
        emitted to notify any connected clients or listeners that the track has
        been fully removed from the system.

        Args:
            id (str): The unique track ID to remove.

        Side Effects:
            - Removes the track from TRACKS.
            - Cascades deletions to DOWNLOADS, LIKES, and PLAYLIST_TRACKS.
            - Emits an ADA.UNREGISTER_TRACK event.

        Example:
            >>> await db.unregister_track("abc123")
            # Removes the track metadata and all related entries
        """
        #deletes via ON DELETE CASCADE foreign keys automatically cleaning up tables
        async with self._lock:
            await self._execute(f'''
                DELETE FROM titles
                WHERE id = ?;
            ''', (id,))

            content = {
                "id": id
            }
            await self._emit_event(action=ADA.UNREGISTER_TRACK, payload={"content": content})


    async def is_registered(self, track_id: str) -> bool:
        """
        Check if a track exists in the TITLES table (i.e., is logged).

        Args:
            track_id (str): The unique track ID to check.

        Returns:
            bool: True if the track exists in TITLES, False otherwise.
        """
        async with self._lock:
            row = await self._fetchone(f'''
                SELECT 1 FROM titles WHERE id = ? LIMIT 1;
            ''', (track_id,))
            return row is not None


    async def register_download(self, id: str) -> dict:
        """
        Log a new download event for an existing track and return its full metadata.

        This method inserts a new entry into the DOWNLOADS table for the given
        track ID, recording the current timestamp. If the track has already
        been registered as downloaded, the INSERT OR IGNORE clause prevents
        duplicate entries.

        After insertion, the method fetches the track's full metadata from
        TITLES (id, title, artist, duration), emits an ADA.REGISTER_DOWNLOAD
        event, and returns the track object.

        Args:
            id (str): The unique track ID to log as downloaded.

        Returns:
            dict: A dictionary containing the track's metadata:
                {
                    "id": str,
                    "title": str,
                    "artist": str,
                    "duration": float
                }

        Side Effects:
            - Adds a row to DOWNLOADS if it doesn't exist already.
            - Emits an ADA.REGISTER_DOWNLOAD event.

        Example:
            >>> track = await db.register_download("abc123")
            {"id": "abc123", "title": "Song A", "artist": "Artist X", "duration": 210}
        """
        async with self._lock:
            #insert into downloads table
            await self._execute(f'''
                INSERT OR IGNORE INTO downloads (id, downloaded_at)
                VALUES (?, CURRENT_TIMESTAMP);
            ''', (id,))

            #fetch full track metadata from tracks table
            row = await self._fetchone(f'''
                SELECT 
                    t.id,
                    COALESCE(t.custom_title, t.title) AS title,
                    GROUP_CONCAT(COALESCE(a.artist_display, a.artist), ', ') AS artist,
                    t.duration
                FROM titles t
                LEFT JOIN title_artists ta ON t.rowid = ta.title_rowid
                LEFT JOIN artists a ON ta.artist_rowid = a.rowid
                WHERE t.id = ?
                GROUP BY t.id;
            ''', (id,))

            if row is None:
                raise ValueError(f"Track with id {id} does not exist in TITLES")

            track = dict(row)

            #emit event with full track object
            await self._emit_event(action=ADA.REGISTER_DOWNLOAD, payload={"content": track})

            return track


    async def unregister_download(self, id: str):
        """
        Remove a download entry for a track without deleting its metadata.

        This method deletes the specified track's entry from the DOWNLOADS table
        while leaving its metadata intact in the TITLES table. Because the
        PLAYLIST_TITLES table references the DOWNLOADS table (via foreign keys),
        this deletion will automatically cascade to remove any playlist
        associations tied to the download.

        After the database operation completes, an ADA.UNREGISTER_DOWNLOAD event is
        emitted to notify connected clients or listeners that the download entry
        has been removed.

        Args:
            id (str): The unique track ID whose download entry should be removed.

        Side Effects:
            - Removes the entry from DOWNLOADS.
            - Cascades deletions to PLAYLIST_TITLES (playlist associations).
            - Leaves TITLES metadata intact.
            - Emits an ADA.UNREGISTER_DOWNLOAD event.

        Example:
            >>> await db.unregister_download("abc123")
            # Removes the download entry but preserves the track metadata
        """
        async with self._lock:
            await self._execute(f'''
                DELETE FROM downloads
                WHERE id = ?;
            ''', (id,))

            content = {
                "id": id
            }
            await self._emit_event(action=ADA.UNREGISTER_DOWNLOAD, payload={"content": content})
            

    async def is_downloaded(self, track_id: str) -> bool:
        """
        Check if a track exists in the DOWNLOADS table (i.e., is downloaded).

        Args:
            track_id (str): The unique track ID to check.

        Returns:
            bool: True if the track is downloaded, False otherwise.
        """
        async with self._lock:
            row = await self._fetchone(f'''
                SELECT 1 FROM downloads WHERE id = ? LIMIT 1;
            ''', (track_id,))
            return row is not None
