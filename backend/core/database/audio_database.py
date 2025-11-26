import asyncio
from contextlib import contextmanager
from pathlib import Path
import sqlite3
from typing import List, Optional

from backend.core.events.event_bus import EventBus
from backend.core.lib.utils import run_in_executor
from backend.core.models.event import Event
from backend.core.models.track import Track

from backend.core.models.enums import AudioDatabaseAction as ADA


class AudioDatabase:
    def __init__(
        self, 
        *,
        name: str,
        filepath: Path,
        event_bus: Optional[EventBus] = None,
    ):
        self.name = name

        self._filepath = filepath
        self._event_bus = event_bus
        self._lock = asyncio.Lock()

        self.TRACKS_TABLE = "tracks"
        self.DOWNLOADS_TABLE = "downloads"
        self.LIKES_TABLE = "likes"

        #self.SEARCHES_TABLE = "searches"

        self.PLAYLISTS_TABLE = "playlists"
        self.PLAYLIST_TRACKS_TABLE = "playlist_tracks"

        #ensure parent directories exist
        self._filepath.parent.mkdir(parents=True, exist_ok=True)

        #generate
        is_new = not self._filepath.exists()
        if is_new:
            print(f"[AudioDatabase] Creating new database at {self._filepath}")
        else:
            print(f"[AudioDatabase] Using existing database at {self._filepath}")

        #connect
        self._conn = sqlite3.connect(
            self._filepath,
            detect_types=sqlite3.PARSE_DECLTYPES,
            check_same_thread=False #allow multithread access
        )
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA foreign_keys = ON;")


    def close(self):
        if self._conn:
            self._conn.close()


    @contextmanager
    def cursor(self):
        #returns a cursor wrapped in a with block for use
        cur = self._conn.cursor()
        try:
            yield cur
            self._conn.commit()
        except Exception as e:
            self._conn.rollback()
            raise e
        finally:
            cur.close()


    #async functions thanks to the decorator, prevents blocking on heavier db operations
    @run_in_executor
    def _execute(self, query: str, params: tuple = ()):
        with self.cursor() as cur:
            cur.execute(query, params)

    @run_in_executor
    def _fetchone(self, query: str, params: tuple = ()):
        with self.cursor() as cur:
            return cur.execute(query, params).fetchone()

    @run_in_executor
    def _fetchall(self, query: str, params: tuple = ()):
        with self.cursor() as cur:
            return cur.execute(query, params).fetchall()

    async def _emit_event(self, action: str, payload: Optional[dict] = None):
        if self._event_bus:
            event = Event(
                source=self.name,
                action=action,
                payload={**(payload or {})}
            )
            await self._event_bus.publish(event)


    # ---------------------------------------------------------------------
    # BUILD
    # ---------------------------------------------------------------------
    async def build(self):
        async with self._lock:
            await self._execute(f'''
                CREATE TABLE IF NOT EXISTS {self.TRACKS_TABLE} (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT,
                    duration REAL,
                    custom_title TEXT,
                    custom_artist TEXT
                );
            ''')
            await self._execute(f'''
                CREATE TABLE IF NOT EXISTS {self.DOWNLOADS_TABLE} (
                    id TEXT PRIMARY KEY,
                    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (id) REFERENCES {self.TRACKS_TABLE}(id) ON DELETE CASCADE
                );
            ''')

            #likes
            await self._execute(f'''
                CREATE TABLE IF NOT EXISTS {self.LIKES_TABLE} (
                    id TEXT PRIMARY KEY,
                    position REAL NOT NULL,
                    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (id) REFERENCES {self.DOWNLOADS_TABLE}(id) ON DELETE CASCADE
                );
            ''')
            await self._execute(f'''
                CREATE INDEX IF NOT EXISTS idx_likes_position
                ON {self.LIKES_TABLE}(position);
            ''')

            #playlists
            await self._execute(f'''
                CREATE TABLE IF NOT EXISTS {self.PLAYLISTS_TABLE} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            await self._execute(f'''
                CREATE TABLE IF NOT EXISTS {self.PLAYLIST_TRACKS_TABLE} (
                    playlist_id INTEGER NOT NULL,
                    track_id TEXT NOT NULL,
                    position REAL NOT NULL,
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (playlist_id) REFERENCES {self.PLAYLISTS_TABLE}(id) ON DELETE CASCADE,
                    FOREIGN KEY (track_id) REFERENCES {self.DOWNLOADS_TABLE}(id) ON DELETE CASCADE,
                    PRIMARY KEY (playlist_id, track_id)
                );
            ''')
            await self._execute(f'''
                CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position
                ON {self.PLAYLIST_TRACKS_TABLE} (playlist_id, position, track_id);
            ''') #covering index


    async def view_all(self):
        async with self._lock:
            print("\n=== TRACKS TABLE ===")
            tracks = await self._fetchall(f"SELECT * FROM {self.TRACKS_TABLE};")
            if tracks:
                for row in tracks:
                    print(dict(row))
            else:
                print("(no tracks found)")

            print("\n=== DOWNLOADS TABLE ===")
            downloads = await self._fetchall(f"SELECT * FROM {self.DOWNLOADS_TABLE};")
            if downloads:
                for row in downloads:
                    print(dict(row))
            else:
                print("(no downloads found)")

            print("\n=== PLAYLISTS TABLE ===")
            playlists = await self._fetchall(f"SELECT * FROM {self.PLAYLISTS_TABLE};")
            if playlists:
                for row in playlists:
                    print(dict(row))
            else:
                print("(no playlists found)")

            print("\n=== PLAYLIST_TRACKS TABLE ===")
            playlist_tracks = await self._fetchall(f"SELECT * FROM {self.PLAYLIST_TRACKS_TABLE};")
            if playlist_tracks:
                for row in playlist_tracks:
                    print(dict(row))
            else:
                print("(no playlist tracks found)")


    # ---------------------------------------------------------------------
    # LOGS
    # ---------------------------------------------------------------------
    async def log_track(self, track: Track):
        """
        Log (insert or update) a track's metadata into the TRACKS table.

        This method ensures that the database always has up-to-date metadata for
        a given track. If the track already exists, its metadata is replaced;
        otherwise, a new row is inserted. The `downloads` and `playlist_tracks`
        tables are not affected by this call — it only manages the metadata
        layer.

        After the database operation completes, an ADA.LOG_TRACK event is emitted
        to notify any connected clients or event listeners of the new or updated
        track.

        Args:
            track (Track): A Track object containing at least:
                - id (str): Unique track ID (primary key).
                - title (str): Track title.
                - artist (str|None): Track artist.
                - duration (float|None): Track duration in seconds.

        Emits:
            ADA.LOG_TRACK — with payload containing the track's metadata.

        Example:
            >>> await db.log_track(Track(id="abc123", title="Song", artist="Artist", duration=200))
        """
        async with self._lock:
            await self._execute(f'''
                INSERT OR REPLACE INTO {self.TRACKS_TABLE}
                (id, title, artist, duration, custom_title, custom_artist)
                VALUES (?, ?, ?, ?, NULL, NULL);
            ''', (
                track.id,
                track.title,
                track.artist,
                track.duration,
            ))

            content = {
                "id": track.id,
                "title": track.title,
                "artist": track.artist,
                "duration": track.duration
            }
            await self._emit_event(action=ADA.LOG_TRACK, payload={"content": content})



    async def unlog_track(self, id: str):
        """
        Completely remove a track's metadata and all associated references
        from the database.

        This method deletes the track from the TRACKS table by its unique ID.
        Because of the ON DELETE CASCADE constraints, this operation will
        automatically propagate and remove any related entries in the
        DOWNLOADS, LIKES, and PLAYLIST_TRACKS tables.

        After the database operation completes, an ADA.UNLOG_TRACK event is
        emitted to notify any connected clients or listeners that the track has
        been fully removed from the system.

        Args:
            id (str): The unique track ID to remove.

        Side Effects:
            - Removes the track from TRACKS.
            - Cascades deletions to DOWNLOADS, LIKES, and PLAYLIST_TRACKS.
            - Emits an ADA.UNLOG_TRACK event.

        Example:
            >>> await db.unlog_track("abc123")
            # Removes the track metadata and all related entries
        """
        #deletes via ON DELETE CASCADE foreign keys automatically cleaning up tables
        async with self._lock:
            await self._execute(f'''
                DELETE FROM {self.TRACKS_TABLE}
                WHERE id = ?;
            ''', (id,))

            content = {
                "id": id
            }
            await self._emit_event(action=ADA.UNLOG_TRACK, payload={"content": content})

    async def is_logged(self, track_id: str) -> bool:
        """
        Check if a track exists in the TRACKS table (i.e., is logged).

        Args:
            track_id (str): The unique track ID to check.

        Returns:
            bool: True if the track exists in TRACKS, False otherwise.
        """
        async with self._lock:
            row = await self._fetchone(f'''
                SELECT 1 FROM {self.TRACKS_TABLE} WHERE id = ? LIMIT 1;
            ''', (track_id,))
            return row is not None

    async def log_download(self, id: str) -> dict:
        """
        Log a new download event for an existing track and return its full metadata.

        This method inserts a new entry into the DOWNLOADS table for the given
        track ID, recording the current timestamp. If the track has already
        been logged as downloaded, the INSERT OR IGNORE clause prevents
        duplicate entries.

        After insertion, the method fetches the track's full metadata from
        TRACKS_TABLE (id, title, artist, duration), emits an ADA.LOG_DOWNLOAD
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
            - Emits an ADA.LOG_DOWNLOAD event.

        Example:
            >>> track = await db.log_download("abc123")
            {"id": "abc123", "title": "Song A", "artist": "Artist X", "duration": 210}
        """
        async with self._lock:
            # Insert into downloads table
            await self._execute(f'''
                INSERT OR IGNORE INTO {self.DOWNLOADS_TABLE} (id, downloaded_at)
                VALUES (?, CURRENT_TIMESTAMP);
            ''', (id,))

            # Fetch full track metadata from tracks table
            row = await self._fetchone(f'''
                SELECT t.id,
                       COALESCE(t.custom_title, t.title) AS title,
                       COALESCE(t.custom_artist, t.artist) AS artist,
                       t.duration
                FROM {self.TRACKS_TABLE} t
                WHERE t.id = ?;
            ''', (id,))

            if row is None:
                raise ValueError(f"Track with id {id} does not exist in TRACKS_TABLE")

            track = {
                "id": row["id"],
                "title": row["title"],
                "artist": row["artist"],
                "duration": row["duration"]
            }

            # Emit event with full track object
            await self._emit_event(action=ADA.LOG_DOWNLOAD, payload={"content": track})

            return track

    async def unlog_download(self, id: str):
        """
        Remove a download entry for a track without deleting its metadata.

        This method deletes the specified track's entry from the DOWNLOADS table
        while leaving its metadata intact in the TRACKS table. Because the
        PLAYLIST_TRACKS table references the DOWNLOADS table (via foreign keys),
        this deletion will automatically cascade to remove any playlist
        associations tied to the download.

        After the database operation completes, an ADA.DELETE_DOWNLOAD event is
        emitted to notify connected clients or listeners that the download entry
        has been removed.

        Args:
            id (str): The unique track ID whose download entry should be removed.

        Side Effects:
            - Removes the entry from DOWNLOADS.
            - Cascades deletions to PLAYLIST_TRACKS (playlist associations).
            - Leaves TRACKS metadata intact.
            - Emits an ADA.DELETE_DOWNLOAD event.

        Example:
            >>> await db.unlog_download("abc123")
            # Removes the download entry but preserves the track metadata
        """
        async with self._lock:
            await self._execute(f'''
                DELETE FROM {self.DOWNLOADS_TABLE}
                WHERE id = ?;
            ''', (id,))

            content = {
                "id": id
            }
            await self._emit_event(action=ADA.UNLOG_DOWNLOAD, payload={"content": content})
            
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
                SELECT 1 FROM {self.DOWNLOADS_TABLE} WHERE id = ? LIMIT 1;
            ''', (track_id,))
            return row is not None


    # ---------------------------------------------------------------------
    # GET
    # ---------------------------------------------------------------------
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
            query = f"""
                SELECT t.id,
                       COALESCE(t.custom_title, t.title) AS title,
                       COALESCE(t.custom_artist, t.artist) AS artist,
                       t.duration
                FROM {self.TRACKS_TABLE} t
                INNER JOIN {self.DOWNLOADS_TABLE} d ON t.id = d.id
                ORDER BY d.downloaded_at DESC;
            """
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
                FROM {self.PLAYLISTS_TABLE}
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
                FROM {self.PLAYLISTS_TABLE}
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
                FROM {self.PLAYLIST_TRACKS_TABLE} 
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
        


    # ---------------------------------------------------------------------
    # TRACK
    # ---------------------------------------------------------------------
    async def set_custom_metadata(self, id: str, custom_title: Optional[str] = None, custom_artist: Optional[str] = None):
        async with self._lock:
            #some robustness for handling None or "" values
            custom_title_val = custom_title if custom_title not in (None, "") else None
            custom_artist_val = custom_artist if custom_artist not in (None, "") else None

            await self._execute(f'''
                UPDATE {self.TRACKS_TABLE}
                SET custom_title = ?,
                    custom_artist = ?
                WHERE id = ?;
            ''', (custom_title_val, custom_artist_val, id))

            #compute effective title/artist (unfortunately uses another query but it works)
            row = await self._fetchone(f'''
                SELECT 
                    COALESCE(t.custom_title, t.title) AS title,
                    COALESCE(t.custom_artist, t.artist) AS artist
                FROM {self.TRACKS_TABLE} t
                WHERE id = ?;
            ''', (id,))

            content = {
                "id": id,
                "title": row["title"],
                "artist": row["artist"]
            }

            await self._emit_event(action=ADA.SET_METADATA, payload={"content": content})

            return content


    # ---------------------------------------------------------------------
    # SEARCH
    # ---------------------------------------------------------------------
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
                #no filtering, return all entries from downloads
                query = f"""
                    SELECT t.id,
                        COALESCE(t.custom_title, t.title) AS title,
                        COALESCE(t.custom_artist, t.artist) AS artist,
                        t.duration
                    FROM {self.TRACKS_TABLE} t
                    INNER JOIN {self.DOWNLOADS_TABLE} d ON t.id = d.id
                    ORDER BY d.downloaded_at DESC;
                """
                params = ()
            
            else:
                pattern = f"%{q.lower()}%"
                query = f"""
                SELECT t.id, 
                    COALESCE(t.custom_title, t.title) AS title,
                    COALESCE(t.custom_artist, t.artist) AS artist,
                    t.duration
                FROM {self.TRACKS_TABLE} t
                WHERE t.title LIKE ? COLLATE NOCASE
                    OR t.artist LIKE ? COLLATE NOCASE
                    OR COALESCE(t.custom_title, t.title) LIKE ? COLLATE NOCASE 
                    OR COALESCE(t.custom_artist, t.artist) LIKE ? COLLATE NOCASE
                ORDER BY t.title COLLATE NOCASE;
                """
                params = (pattern, pattern, pattern, pattern)

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



    # ---------------------------------------------------------------------
    # LIKES
    # ---------------------------------------------------------------------
    async def toggle_like(self, id: str):
        async with self._lock:
            #check if already in db
            row = await self._fetchone(f'''
                SELECT 1 FROM {self.LIKES_TABLE}
                WHERE id = ?;
            ''', (id,))

            if row:
                #exists already, so remove
                await self._execute(f'''
                    DELETE FROM {self.LIKES_TABLE}
                    WHERE id = ?;
                ''', (id,))
            else:
                #doesn't exist yet, so we add it to the front/top of the list by inserting with a float that has min_pos-1
                result = await self._fetchone(f'''
                    SELECT MIN(position) AS min_pos FROM {self.LIKES_TABLE};
                ''')

                new_position = (result["min_pos"] or 0.0) - 1.0

                await self._execute(f'''
                    INSERT INTO {self.LIKES_TABLE} (id, position) VALUES (?, ?);
                ''', (id, new_position))

    async def fetch_liked_tracks(self):
        async with self._lock:
            rows = await self._fetchall(f'''
                SELECT id
                FROM {self.LIKES_TABLE}
                ORDER BY position ASC;
            ''')
            track_ids = [row["id"] for row in rows]
            await self._emit_event(action=ADA.FETCH_LIKES, payload={"content": track_ids})
    
            return track_ids

    async def reorder_likes_track(self, from_index: int, to_index: int):
        """
        Reorder a track within the system likes playlist by moving it from one index to another.

        This method updates the `position` column of the track to reflect its new order
        in the playlist. It uses floating point indexing and sqlite3 indexes (see Build) 
        to allow fast lookup and insertion without renumbering the entire playlist.

        Args:
            from_index (int): The current 0-based index of the track to move.
            to_index (int): Target 0-based index to move the track to.

        Returns:
            
        """
        async with self._lock:
            #fetch playlist tracks ordered by position
            rows = await self._fetchall(f'''
                SELECT id, position
                FROM {self.LIKES_TABLE}
                ORDER BY position ASC;
            ''')

            print("[reorder_likes] BEFORE reorder:")
            for r in rows:
                print(f"  id={r['id']}, position={r['position']}")


            n = len(rows) - 1 #have to account for removal of the element being reordered. to_index cannot be >= len(rows) - 1
            if n == 0 or from_index < 0 or from_index > n or to_index < 0 or to_index > n:
                print("FAILURE")
                return False #invalid
            
            #remove the moved track so indices reflect post-removal state
            moved_row = rows.pop(from_index)
            track_id = moved_row["id"]
            
            print("from_index:", from_index, "to_index:", to_index)

            if to_index == 0:
                new_position = rows[0]["position"] - 1.0
            elif to_index == n:                               #this is the last element
                new_position = rows[-1]["position"] + 1.0
            else:
                new_position = (rows[to_index - 1]["position"] + rows[to_index]["position"]) / 2.0

            #update
            await self._execute(f'''
                UPDATE {self.LIKES_TABLE}
                SET position = ?
                WHERE id = ?;                    
            ''', (new_position, track_id))

            print("[reorder_likes]: SUCCESS")

            #fetch playlist tracks ordered by position
            rows = await self._fetchall(f'''
                SELECT id, position
                FROM {self.LIKES_TABLE}
                ORDER BY position ASC;
            ''')

            print("[reorder_likes] AFTER reorder:")
            for r in rows:
                print(f"  id={r['id']}, position={r['position']}")

            return True



    # ---------------------------------------------------------------------
    # PLAYLISTS
    # ---------------------------------------------------------------------
    async def create_playlist(self, name: str, temp_id: str):
        async with self._lock:
            row = await self._fetchone(f'''
                INSERT INTO {self.PLAYLISTS_TABLE} (name) 
                VALUES (?)
                RETURNING id;
            ''', (name,))

            content = {
                "temp_id": temp_id, 
                "id": row["id"], 
                "name": name
            }
            await self._emit_event(action=ADA.CREATE_PLAYLIST, payload={"content": content})
            
            return content
        

    #modifications to data
    async def update_track_playlists(self, track_id: str, playlist_updates: list[dict]):
        """
        Update a track's playlist memberships based on a set of updates.

        For each playlist update in `playlist_updates`, which should be like [{id: '1', checked: false}]:
          - If `checked` is True: ensure the track is present in the playlist 
            (insert if missing, keep if already exists).
          - If `checked` is False: remove the track from the playlist if it exists.
          - If `checked` is None or not provided: make no changes for that playlist.

        Args:
            track_id (str): The ID of the track to update.
            playlist_updates (list[dict]): A list of updates, where each item is a dict
                with:
                  - "id" (str): Playlist ID
                  - "checked" (bool | None): Desired membership state
        """
        async with self._lock:
            for playlist in playlist_updates:
                playlist_id, checked = playlist["id"], playlist["checked"]

                if checked is True:
                    #insert new track at bottom of playlist (max+1) or keep existing
                    result = await self._fetchone(f'''
                        SELECT MAX(position) AS max_pos
                        FROM {self.PLAYLIST_TRACKS_TABLE}
                        WHERE playlist_id = ?;
                    ''', (playlist_id,))

                    new_position = (result["max_pos"] or 0.0) + 1.0

                    await self._execute(f'''
                        INSERT INTO {self.PLAYLIST_TRACKS_TABLE} (playlist_id, track_id, position)
                        VALUES (?, ?, ?)
                        ON CONFLICT(playlist_id, track_id) DO NOTHING;
                    ''', (playlist_id, track_id, new_position))

                elif checked is False:
                    #remove if exists
                    await self._execute(f'''
                        DELETE FROM {self.PLAYLIST_TRACKS_TABLE}
                        WHERE playlist_id = ? AND track_id = ?;
                    ''', (playlist_id, track_id))
                
                else:
                    #none or undefined do nothing
                    continue

            content = {
                "id": track_id,
                "updates": playlist_updates
            }
            await self._emit_event(ADA.UPDATE_PLAYLISTS, payload={"content": content})


    async def reorder_playlist_track(self, playlist_id: int, from_index: int, to_index: int):
        """
        Reorder a track within a playlist by moving it from one index to another.

        This method updates the `position` column of the track to reflect its new order
        in the playlist. It uses floating point indexing and sqlite3 indexes (see Build) 
        to allow fast lookup and insertion without renumbering the entire playlist.

        Args:
            playlist_id (int): The ID of the playlist to rename.
            from_index (int): The current 0-based index of the track to move.
            to_index (int): Target 0-based index to move the track to.

        Returns:
            
        """
        async with self._lock:
            # Fetch playlist tracks ordered by position
            rows = await self._fetchall(f'''
                SELECT track_id, position
                FROM {self.PLAYLIST_TRACKS_TABLE}
                WHERE playlist_id = ?
                ORDER BY position ASC;
            ''', (playlist_id,))
            
            n = len(rows) - 1 #have to account for removal of the element being reordered. to_index cannot be >= len(rows) - 1
            if n == 0 or from_index < 0 or from_index > n or to_index < 0 or to_index > n:
                return False #invalid
            
            #remove the moved track so indices reflect post-removal state
            moved_row = rows.pop(from_index)
            track_id = moved_row["track_id"]

            print("from_index:", from_index, "to_index:", to_index)

            if to_index == 0:
                new_position = rows[0]["position"] - 1.0
            elif to_index == n:                               #this is the last element
                new_position = rows[-1]["position"] + 1.0
            else:
                new_position = (rows[to_index - 1]["position"] + rows[to_index]["position"]) / 2.0

            #update
            await self._execute(f'''
                UPDATE {self.PLAYLIST_TRACKS_TABLE}
                SET position = ?
                WHERE playlist_id = ? AND track_id = ?;                    
            ''', (new_position, playlist_id, track_id))

            print("[reorder_playlist_track]: SUCCESS")
            return True



    # Edit a playlist's name
    async def edit_playlist(self, playlist_id: int, name: str):
        """
        Update the name of an existing playlist.

        Args:
            playlist_id (int): The ID of the playlist to rename.
            name (str): The new name for the playlist.

        Returns:
            dict: The updated playlist info.
        """
        async with self._lock:
            await self._execute(f'''
                UPDATE {self.PLAYLISTS_TABLE}
                SET name = ?
                WHERE id = ?;
            ''', (name, playlist_id))

            content = {
                "id": playlist_id,
                "name": name
            }
            await self._emit_event(action=ADA.EDIT_PLAYLIST, payload={"content": content})

            return content


    # Delete a playlist and optionally remove its tracks
    async def delete_playlist(self, playlist_id: int):
        """
        Delete a playlist and remove its track associations.

        Args:
            playlist_id (int): The ID of the playlist to delete.

        Returns:
            dict: Info about the deleted playlist.
        """
        async with self._lock:
            # Delete associated tracks
            await self._execute(f'''
                DELETE FROM {self.PLAYLIST_TRACKS_TABLE}
                WHERE playlist_id = ?;
            ''', (playlist_id,))

            # Delete the playlist itself
            await self._execute(f'''
                DELETE FROM {self.PLAYLISTS_TABLE}
                WHERE id = ?;
            ''', (playlist_id,))

            content = {
                "id": playlist_id
            }
            await self._emit_event(action=ADA.DELETE_PLAYLIST, payload={"content": content})

            return content
