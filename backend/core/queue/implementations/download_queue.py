from backend.core.models.download_job import DownloadJob
from backend.core.queue.base.observable_dll import ObservableQueue
import asyncio

from backend.core.models.enums import DownloadQueueAction as DQA

class DownloadQueue(ObservableQueue[DownloadJob]):
    async def insert_next(self, job: DownloadJob):
        #for queueing the song right after the current one
        async with self._condition:
            self._insert_at(1, job)
            await self._emit_event(action=DQA.INSERT_NEXT, payload={"id": job.get_identifier(), "content": self.to_json()})
            self._condition.notify()
            
    async def push(self, job: DownloadJob):
        #pushing to end
        async with self._condition:
            self._push(job)
            await self._emit_event(action=DQA.PUSH, payload={"id": job.get_identifier(), "content": self.to_json()})
            self._condition.notify()

            print(f"[DEBUG]: contents of download queue: {self.to_json()}")

    async def pop(self):
        #pop first id
        async with self._condition:
            while self.is_empty():
                await self._condition.wait() #yield control nothing to consume
            job = self._pop()
            await self._emit_event(action=DQA.POP, payload={"id": job.get_identifier(), "content": self.to_json()})

            print(f"[DEBUG]: contents of download queue: {self.to_json()}")
            return job

    '''
    async def remove_at(self, index: int):
        #remove id
        async with self._lock:
            id = self._remove_at(index)
            await self._emit_event(action=DQA.REMOVE, payload={"id": id, "content": self.to_json()})
    '''


    def contains(self, item: DownloadJob | str):
        """Check if a job with the same identifier or YouTube ID exists."""
        if isinstance(item, DownloadJob):
            identifier = item.get_identifier()
        elif isinstance(item, str):
            identifier = item
        else:
            return False

        return any(identifier == job.get_identifier() for job in self)

            
    async def send_content(self):
        async with self._lock:
            await self._emit_event(action=DQA.SEND_CONTENT, payload={"content": self.to_json()})