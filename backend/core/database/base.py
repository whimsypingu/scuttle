import asyncio
from contextlib import contextmanager
import csv
from pathlib import Path
import sqlite3
import math
from typing import List, Optional

from backend.core.events.event_bus import EventBus
from backend.core.lib.utils import run_in_executor
from backend.core.models.event import Event
from backend.core.models.track import Track

from backend.core.models.enums import AudioDatabaseAction as ADA




class BaseDatabase:
    def __init__(
        self, 
        name: str,
        filepath: Path,
        event_bus: Optional[EventBus] = None,
    ):
        self.name = name

        self._filepath = filepath
        self._event_bus = event_bus
        self._lock = asyncio.Lock()

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
        self._conn.execute("PRAGMA journal_mode = WAL;")

        def sql_ln_boost(pref):
            return 1 + math.log(float(pref) + 1.0) #at x=0 y=1, and at x=1 y=1.69ish for a ~70% max boost
        
        self._conn.create_function("LN_BOOST", 1, sql_ln_boost)


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
    def _executescript(self, script: str):
        """Execute multiple SQL statements separated by semicolons."""
        with self.cursor() as cur:
            cur.executescript(script)

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

    def close(self):
        if self._conn:
            self._conn.close()

    async def build_from_file(self):
        sql_path = Path(__file__).parent / "base_schema.sql"
        with open(sql_path, "r") as f:
            schema_script = f.read()
        
        async with self._lock:
            await self._executescript(schema_script)

    async def seed(self):
        csv_path = Path(__file__).parent / "seed.csv"

        #check if seeding already done
        count_row = await self._fetchone("SELECT COUNT(*) as count FROM titles")
        if count_row and count_row["count"] > 0:
            return

        print(f"[{self.name}] Starting data seed...")
        await self._run_seed_logic(csv_path)

    async def _run_seed_logic(self, csv_path: Path):
        if not csv_path.exists():
            print(f"[{self.name}] Couldn't find seed csv path")
            return

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data = list(reader)

        pops = [float(row['popularity']) for row in data if row.get('popularity')]
        min_pop = min(pops) if pops else 0
        
        #calculate artist frequency for the 'pref' boost
        #we'll use a simple dict counter to avoid Pandas value_counts() or explode()
        artist_counts = {}
        for row in data:
            for a_id in str(row.get("artist_ids", "")).split("|"):
                a_id = a_id.strip()
                if a_id:
                    artist_counts[a_id] = artist_counts.get(a_id, 0) + 1
        
        max_freq = max(artist_counts.values()) if artist_counts else 1.0

        print(f"[Seed] Starting seed of {len(data)} tracks...")

        with self.cursor() as cursor:
            cursor.execute("PRAGMA synchronous = OFF;")
            cursor.execute("PRAGMA journal_mode = MEMORY;")

            for row in data:
                title = str(row.get("track_name", "UNKNOWN_TITLE"))
                title_id = f'SEED___{str(row.get("track_id", "UNKNOWN_TITLE"))}'

                #custom scoring math based on the seeding csv values
                pref = (float(row.get("popularity", min_pop)) - min_pop) / 50.0

                duration = float(row.get("duration", 0.0))

                #insertion into titles
                cursor.execute('''
                    INSERT INTO titles (id, title, title_display, duration, pref)
                    VALUES (?, ?, ?, ?, ?)
                ''', (title_id, title.lower(), title, duration, pref))

                #process artists
                names = str(row.get("artist_names", "")).split("|")
                ids = str(row.get("artist_ids", "")).split("|")

                for a_name, a_id in zip(names, ids):
                    a_name, a_id = a_name.strip(), a_id.strip()
                    if not a_id or not a_name: continue

                    #insert artists and junctions
                    cursor.execute('''
                        INSERT OR IGNORE INTO artists (id, artist, artist_display)
                        VALUES (?, ?, ?)
                    ''', (a_id, a_name.lower(), a_name))

                    cursor.execute('''
                        INSERT OR IGNORE INTO title_artists (title_rowid, artist_rowid)
                        SELECT t.rowid, a.rowid
                        FROM titles t, artists a
                        WHERE t.rowid = ? AND a.id = ?
                    ''', (title_id, a_id))

            #recalculate artist preferences based on frequency
            cursor.execute(f"""
                UPDATE artists
                SET pref = (
                    SELECT CAST(COUNT(*) AS REAL) / {2.0 * max_freq}
                    FROM title_artists
                    WHERE title_artists.artist_rowid = artists.rowid
                )
                WHERE EXISTS (SELECT 1 FROM title_artists WHERE artist_rowid = artists.rowid);
            """)

        print("[Seed] Success.")

    async def rebuild_search_index(self):
        """
        Manually synchronizes the FTS5 index with the current state of the
        titles and artists tables. Only necessary when names are changed for titles or artists.
        """
        print("Synchronizing search index with database...")

        try:
            with self.cursor() as cursor:
                # 1. Clear the current index
                cursor.execute("INSERT INTO catalog_fts(catalog_fts) VALUES('delete-all')")

                # 2. Re-populate from the view
                cursor.execute("INSERT INTO catalog_fts(catalog_fts) VALUES('rebuild')")

            print(f"[{self.name}] Success: FTS5 index is up to date.")
        except sqlite3.OperationalError as e:
            print(f"[{self.name}] Error rebuilding index: {e}")
