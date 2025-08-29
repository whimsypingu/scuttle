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


class PlayQueue(ObservableQueue[str]):
    async def set_first(self, id: str):
        #replacing the first item in the queue, as if pressing play overwriting the current song
        async with self._lock:
            self._pop()
            self._insert_at(0, id)
            await self._emit_event(action=PQA.SET_FIRST, payload={"id": id, "content": self.to_json()})

            print(f"[DEBUG]: contents of play queue: {self.to_json()}")
    
    async def insert_next(self, id: str):
        #for queueing the song right after the current one
        async with self._lock:
            self._insert_at(1, id)
            await self._emit_event(action=PQA.INSERT_NEXT, payload={"id": id, "content": self.to_json()})

            print(f"[DEBUG]: contents of play queue: {self.to_json()}")

    async def push(self, id: str):
        #pushing to end
        async with self._lock:
            self._push(id)
            await self._emit_event(action=PQA.PUSH, payload={"id": id, "content": self.to_json()})

            print(f"[DEBUG]: contents of play queue: {self.to_json()}")

    async def pop(self):
        #pop first track
        async with self._lock:
            id = self._pop()
            await self._emit_event(action=PQA.POP, payload={"id": id, "content": self.to_json()})

            print(f"[DEBUG]: contents of play queue: {self.to_json()}")

    async def remove_at(self, index: int):
        #remove track
        async with self._lock:
            id = self._remove_at(index)
            await self._emit_event(action=PQA.REMOVE, payload={"id": id, "content": self.to_json()})

            print(f"[DEBUG]: contents of play queue: {self.to_json()}")

    async def send_content(self):
        async with self._lock:
            await self._emit_event(action=PQA.SEND_CONTENT, payload={"content": self.to_json()})