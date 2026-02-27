from backend.core.models.jobs import EnrichJob
from backend.core.queue.base.observable_dll import ObservableQueue

class EnrichQueue(ObservableQueue[EnrichJob]):
    async def push(self, job: EnrichJob):
        #pushing to end
        async with self._condition:
            self._push(job)
            self._condition.notify()

    async def pop(self):
        #pop first id
        async with self._condition:
            while self.is_empty():
                await self._condition.wait() #yield control nothing to consume
            job = self._pop()
            return job