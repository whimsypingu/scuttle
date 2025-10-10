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

        #generate
        if is_new:
            self.build()


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


    #callable exposed functions
    async def build(self):
        async with self._lock:
            await self._execute(f'''
                CREATE TABLE IF NOT EXISTS {self.TRACKS_TABLE} (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT,
                    duration INTEGER,
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
            await self._execute(f'''
                CREATE TABLE IF NOT EXISTS {self.LIKES_TABLE} (
                    id TEXT PRIMARY KEY,
                    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (id) REFERENCES {self.TRACKS_TABLE}(id) ON DELETE CASCADE
                );
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
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (playlist_id) REFERENCES {self.PLAYLISTS_TABLE}(id) ON DELETE CASCADE,
                    FOREIGN KEY (track_id) REFERENCES {self.TRACKS_TABLE}(id) ON DELETE CASCADE,
                    PRIMARY KEY (playlist_id, track_id)
                );
            ''')


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


    async def log_track(self, track: Track):
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


    async def delete_track(self, id: str):
        #deletes via ON DELETE CASCADE foreign keys automatically cleaning up tables
        async with self._lock:
            await self._execute(f'''
                DELETE FROM {self.TRACKS_TABLE}
                WHERE id = ?;
            ''', (id,))

            content = {
                "id": id
            }
            await self._emit_event(action=ADA.DELETE_TRACK, payload={"content": content})


    async def log_download(self, id: str):
        async with self._lock:
            await self._execute(f'''
                INSERT OR IGNORE INTO {self.DOWNLOADS_TABLE} (id, downloaded_at)
                VALUES (?, CURRENT_TIMESTAMP);
            ''', (id,))

    
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


    async def search(self, q: str) -> List[Track]:
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
                LEFT JOIN {self.DOWNLOADS_TABLE} d ON t.id = d.id
                WHERE COALESCE(t.custom_title, t.title) LIKE ? COLLATE NOCASE 
                    OR COALESCE(t.custom_artist, t.artist) LIKE ? COLLATE NOCASE
                ORDER BY d.downloaded_at DESC, t.title COLLATE NOCASE;
                """
                params = (pattern, pattern)

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


    #likes
    async def toggle_like(self, id: str):
        async with self._lock:
            #check if already in db
            row = await self._fetchone(f'''
                SELECT 1 FROM {self.LIKES_TABLE}
                WHERE id = ?;
            ''', (id,))

            if row:
                await self._execute(f'''
                    DELETE FROM {self.LIKES_TABLE}
                    WHERE id = ?;
                ''', (id,))
            else:
                await self._execute(f'''
                    INSERT INTO {self.LIKES_TABLE} (id) VALUES (?);
                ''', (id,))

    async def fetch_liked_tracks(self):
        async with self._lock:
            rows = await self._fetchall(f'''
                SELECT id
                FROM {self.LIKES_TABLE}
                ORDER BY liked_at ASC;
            ''')
            track_ids = [row["id"] for row in rows]
            await self._emit_event(action=ADA.FETCH_LIKES, payload={"content": track_ids})
    
            return track_ids



    #playlists
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
                ORDER BY added_at ASC;
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
                    #insert or keep existing
                    await self._execute(f'''
                        INSERT OR IGNORE INTO {self.PLAYLIST_TRACKS_TABLE} (playlist_id, track_id)
                        VALUES (?, ?);
                    ''', (playlist_id, track_id))

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
