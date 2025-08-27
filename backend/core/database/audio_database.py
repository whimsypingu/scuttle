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
        self.CACHE_TABLE = "cache"

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
                CREATE TABLE IF NOT EXISTS {self.CACHE_TABLE} (
                    id TEXT PRIMARY KEY,
                    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                    access_count INTEGER DEFAULT 0,
                    FOREIGN KEY (id) REFERENCES {self.DOWNLOADS_TABLE}(id) ON DELETE CASCADE
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

            print("\n=== CACHE TABLE ===")
            cache = await self._fetchall(f"SELECT * FROM {self.CACHE_TABLE};")
            if cache:
                for row in cache:
                    print(dict(row))
            else:
                print("(no cache found)")



    async def log_track(self, track: Track):
        async with self._lock:
            await self._execute(f'''
                INSERT OR REPLACE INTO {self.TRACKS_TABLE}
                (id, title, uploader, duration)
                VALUES (?, ?, ?, ?)
            ''', (
                track.id,
                track.title,
                track.uploader,
                track.duration
            ))


    async def log_download(self, track: Track):
        async with self._lock:
            await self._execute(f'''
                INSERT OR IGNORE INTO {self.DOWNLOADS_TABLE} (id, downloaded_at)
                VALUES (?, CURRENT_TIMESTAMP)
            ''', (track.id,))


    async def log_cache(self, track: Track):
        async with self._lock:
            #upserts into cache with access count
            await self._execute(f'''
                INSERT INTO {self.CACHE_TABLE} (id, last_accessed, access_count)
                VALUES (?, CURRENT_TIMESTAMP, 0)
                ON CONFLICT (id) DO UPDATE SET
                    last_accessed = CURRENT_TIMESTAMP,
                    access_count = access_count + 1;
            ''', (track.id,))


    async def search(self, q: str) -> List[Track]:
        async with self._lock:
            if not q:
                #no filtering, return all entries from downloads
                query = f"""
                    SELECT t.id, t.title, t.uploader, t.duration 
                    FROM {self.TRACKS_TABLE} t
                    INNER JOIN {self.DOWNLOADS_TABLE} d ON t.id = d.id
                    ORDER BY d.downloaded_at DESC
                """
                params = ()
            
            else:
                pattern = f"%{q.lower()}%"
                query = f"""
                SELECT t.id, t.title, t.uploader, t.duration
                FROM {self.TRACKS_TABLE} t
                LEFT JOIN {self.DOWNLOADS_TABLE} d ON t.id = d.id
                WHERE title LIKE ? COLLATE NOCASE OR uploader LIKE ? COLLATE NOCASE
                ORDER BY d.downloaded_at DESC, t.title COLLATE NOCASE
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

