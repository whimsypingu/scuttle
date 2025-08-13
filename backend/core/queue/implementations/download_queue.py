from backend.core.models.track import Track
from backend.core.queue.base.observable_dll import ObservableQueue
import asyncio

from enum import Enum


class DownloadQueueAction(str, Enum):
    SET_FIRST = "set_first"
    INSERT_NEXT = "insert_next"
    PUSH = "push"
    POP = "pop"
    REMOVE = "remove"
    SEND_CONTENT = "send_content"


DQA = DownloadQueueAction #alias for convenience in this file


class DownloadQueue(ObservableQueue[Track]):
    async def insert_next(self, track: Track):
        #for queueing the song right after the current one
        async with self._condition:
            self._insert_at(1, track)
            await self._emit_event(action=DQA.INSERT_NEXT, payload={"track": track, "content": self.to_json()})
            self._condition.notify()
            
    async def push(self, track: Track):
        #pushing to end
        async with self._condition:
            self._push(track)
            await self._emit_event(action=DQA.PUSH, payload={"track": track, "content": self.to_json()})
            self._condition.notify()

            print(f"[DEBUG]: contents of download queue: {self.to_json()}")

    async def pop(self):
        #pop first track
        async with self._condition:
            while self.is_empty():
                await self._condition.wait() #yield control nothing to consume
            track = self._pop()
            await self._emit_event(action=DQA.POP, payload={"track": track, "content": self.to_json()})

            print(f"[DEBUG]: contents of download queue: {self.to_json()}")
            return track

    '''
    async def remove_at(self, index: int):
        #remove track
        async with self._lock:
            track = self._remove_at(index)
            await self._emit_event(action=DQA.REMOVE, payload={"track": track, "content": self.to_json()})
    '''
            
    async def send_content(self):
        async with self._lock:
            await self._emit_event(action=DQA.SEND_CONTENT, payload={"content": self.to_json()})