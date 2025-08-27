import asyncio
from contextlib import contextmanager
from pathlib import Path
import sqlite3
from typing import List, Optional

from backend.core.events.event_bus import EventBus
from backend.core.lib.utils import run_in_executor
from backend.core.models.event import Event
from backend.core.models.track import Track

from enum import Enum

class AudioDatabaseAction(str, Enum):
    SEARCH = "search"

    FETCH_LIKES = "fetch_likes"

    CREATE_PLAYLIST = "create_playlist"
    ADD_TO_PLAYLIST = "add_to_playlist"

ADA = AudioDatabaseAction #alias


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
                    uploader TEXT,
                    duration INTEGER
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
                    position INTEGER NOT NULL,
                    track_id TEXT NOT NULL,
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (playlist_id) REFERENCES {self.PLAYLISTS_TABLE}(id) ON DELETE CASCADE,
                    FOREIGN KEY (track_id) REFERENCES {self.TRACKS_TABLE}(id) ON DELETE CASCADE,
                    PRIMARY KEY (playlist_id, position)
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
                (id, title, uploader, duration)
                VALUES (?, ?, ?, ?);
            ''', (
                track.id,
                track.title,
                track.uploader,
                track.duration
            ))


    async def log_download(self, id: str):
        async with self._lock:
            await self._execute(f'''
                INSERT OR IGNORE INTO {self.DOWNLOADS_TABLE} (id, downloaded_at)
                VALUES (?, CURRENT_TIMESTAMP);
            ''', (id,))


    async def search(self, q: str) -> List[Track]:
        async with self._lock:
            if not q:
                #no filtering, return all entries from downloads
                query = f"""
                    SELECT t.id, t.title, t.uploader, t.duration 
                    FROM {self.TRACKS_TABLE} t
                    INNER JOIN {self.DOWNLOADS_TABLE} d ON t.id = d.id
                    ORDER BY d.downloaded_at DESC;
                """
                params = ()
            
            else:
                pattern = f"%{q.lower()}%"
                query = f"""
                SELECT t.id, t.title, t.uploader, t.duration
                FROM {self.TRACKS_TABLE} t
                LEFT JOIN {self.DOWNLOADS_TABLE} d ON t.id = d.id
                WHERE title LIKE ? COLLATE NOCASE OR uploader LIKE ? COLLATE NOCASE
                ORDER BY d.downloaded_at DESC, t.title COLLATE NOCASE;
                """
                params = (pattern, pattern)

            rows = await self._fetchall(query, params)
            content = [
                Track(
                    id=row["id"], 
                    title=row["title"],
                    uploader=row["uploader"],
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
                SELECT t.id, t.title, t.uploader, t.duration
                FROM {self.LIKES_TABLE} l
                JOIN {self.TRACKS_TABLE} t ON l.id = t.id
                ORDER BY t.title COLLATE NOCASE;
            ''')
            content = [Track(**row) for row in rows]
            await self._emit_event(action=ADA.FETCH_LIKES, payload={"content": content})
    
            return [track.to_json() for track in content]







    #playlists
    async def create_playlist(self, name: str):
        async with self._lock:
            row = await self._fetchone(f'''
                INSERT INTO {self.PLAYLISTS_TABLE} (name) 
                VALUES (?)
                RETURNING id;
            ''', (name,))

            content = {"id": row["id"], "name": name}
            await self._emit_event(action=ADA.CREATE_PLAYLIST, payload={"content": content})

            return content
        
    async def add_track_to_playlist(self, playlist_id: int, track_id: str, position: int = None):
        async with self._lock:
            if position is None:
                row = await self._fetchone(f'''
                    SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
                    FROM {self.PLAYLIST_TRACKS_TABLE}
                    WHERE playlist_id = ?;
                ''', (playlist_id,))
                position = row["next_pos"]
            else:
                await self._execute(f'''
                    UPDATE {self.PLAYLIST_TRACKS_TABLE}
                    SET position = position + 1
                    WHERE playlist_id = ? AND position >= ?;
                ''', (playlist_id, position))
            
            #handle insertion
            await self._execute(f'''
                INSERT INTO {self.PLAYLIST_TRACKS_TABLE} (playlist_id, track_id, position)
                VALUES (?, ?, ?);
            ''', (playlist_id, track_id, position))

            #fetch updated playlist
            rows = await self._fetchall(f'''
                SELECT pt.position, t.id AS track_id, t.title, t.uploader, t.duration
                FROM {self.PLAYLIST_TRACKS_TABLE} pt
                JOIN {self.TRACKS_TABLE} t ON pt.track_id = t.id
                WHERE pt.playlist_id = ?
                ORDER BY pt.position;
            ''', (playlist_id,))
            content = [
                Track(
                    id=row["id"], 
                    title=row["title"],
                    uploader=row["uploader"],
                    duration=row["duration"]
                )
                for row in rows
            ]

            await self._emit_event(action=ADA.ADD_TO_PLAYLIST, payload={"content": content})
    
            return [track.to_json() for track in content]