from backend.core.models.track import Track
from backend.core.queue.base.observable_dll import ObservableQueue

from enum import Enum


class PlayQueueAction(str, Enum):
    SET_FIRST = "set_first"
    INSERT_NEXT = "insert_next"
    PUSH = "push"
    POP = "pop"
    REMOVE = "remove"
    SEND_CONTENT = "send_content"


PQA = PlayQueueAction #alias for convenience in this file


class PlayQueue(ObservableQueue[Track]):
    async def set_first(self, track: Track):
        #replacing the first item in the queue, as if pressing play overwriting the current song
        async with self._lock:
            self._pop()
            self._insert_at(0, track)
            await self._emit_event(action=PQA.SET_FIRST, payload={"track": track, "content": self.to_json()})
    
    async def insert_next(self, track: Track):
        #for queueing the song right after the current one
        async with self._lock:
            self._insert_at(1, track)
            await self._emit_event(action=PQA.INSERT_NEXT, payload={"track": track, "content": self.to_json()})

    async def push(self, track: Track):
        #pushing to end
        async with self._lock:
            self._push(track)
            await self._emit_event(action=PQA.PUSH, payload={"track": track, "content": self.to_json()})

    async def pop(self):
        #pop first track
        async with self._lock:
            track = self._pop()
            await self._emit_event(action=PQA.POP, payload={"track": track, "content": self.to_json()})

    async def remove_at(self, index: int):
        #remove track
        async with self._lock:
            track = self._remove_at(index)
            await self._emit_event(action=PQA.REMOVE, payload={"track": track, "content": self.to_json()})

    async def send_content(self):
        async with self._lock:
            await self._emit_event(action=PQA.SEND_CONTENT, payload={"content": self.to_json()})