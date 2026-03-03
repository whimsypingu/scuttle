import asyncio
from contextlib import contextmanager
from pathlib import Path
import sqlite3
import math
from typing import List, Optional

from backend.core.events.event_bus import EventBus
from backend.core.models.event import Event

from backend.core.database.mixins.seed import SeedMixin
from backend.core.database.mixins.getset import GetsetMixin
from backend.core.database.mixins.likes import LikesMixin
from backend.core.database.mixins.playlists import PlaylistsMixin
from backend.core.database.mixins.register import RegisterMixin
from backend.core.database.mixins.search import SearchMixin
from backend.core.database.mixins.enrich import EnrichMixin



class AudioDatabase(
    SeedMixin,
    GetsetMixin,
    LikesMixin,
    PlaylistsMixin,
    RegisterMixin,
    SearchMixin,
    EnrichMixin
):
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

        print(f"[AudioDatabase] {self.name} initialized with Mixins")


    def _get_connection(self):
        """Creates a connection with the db file"""
        conn = sqlite3.connect(
            self._filepath,
            detect_types=sqlite3.PARSE_DECLTYPES,
            timeout=30.0 #critical for multiprocessing
        )
        conn.row_factory = sqlite3.Row

        def sql_ln_boost(pref):
            return 1 + math.log(float(pref) + 1.0) #at x=0 y=1, and at x=1 y=1.69ish for a ~70% max boost
        conn.create_function("LN_BOOST", 1, sql_ln_boost)
        return conn
    
    @contextmanager
    def cursor(self):
        """Managed connection and cursor that handle commit and rollback and closes"""
        conn = self._get_connection()
        cur = conn.cursor()
        try:
            yield cur
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
            conn.close()


    async def _atomic_db_op(self, func, *args, **kwargs):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))


    async def _emit_event(self, action: str, payload: Optional[dict] = None):
        if self._event_bus:
            event = Event(
                source=self.name,
                action=action,
                payload={**(payload or {})}
            )
            await self._event_bus.publish(event)

    async def build_from_file(self):
        sql_path = Path(__file__).parent / "base_schema.sql"
        def _logic():
            with open(sql_path, "r") as f:
                schema_script = f.read()
        
            with self.cursor() as cur:
                cur.execute("PRAGMA journal_mode = WAL;")
                cur.execute("PRAGMA foreign_keys = ON;")
                cur.executescript(schema_script)

        await self._atomic_db_op(_logic)


    async def initialize(self):
        """
        Public entry point to prepare the database for use.
        Ensures schema is built and any startup constraints are checked.
        """
        await self.build_from_file()
        await self.seed()
        await self.rebuild_search_index()
        
        print(f"[AudioDatabase] {self.name} schema verified and ready.")
