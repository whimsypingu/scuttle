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

from backend.core.database.base import BaseDatabase
from backend.core.database.mixins.getset import GetsetMixin
from backend.core.database.mixins.likes import LikesMixin
from backend.core.database.mixins.playlists import PlaylistsMixin
from backend.core.database.mixins.register import RegisterMixin
from backend.core.database.mixins.search import SearchMixin

class AudioDatabase(
    BaseDatabase,
    GetsetMixin,
    LikesMixin,
    PlaylistsMixin,
    RegisterMixin,
    SearchMixin
):
    def __init__(
        self, 
        name: str,
        filepath: Path,
        event_bus: Optional[EventBus] = None,
    ):
        super().__init__(
            name=name,
            filepath=filepath,
            event_bus=event_bus
        )


        print(f"[AudioDatabse] {self.name} initialized with Mixins")


    async def initialize(self):
        """
        Public entry point to prepare the database for use.
        Ensures schema is built and any startup constraints are checked.
        """
        await self.build_from_file()
        await self.seed()
        await self.rebuild_search_index()
        
        print(f"[AudioDatabase] {self.name} schema verified and ready.")

