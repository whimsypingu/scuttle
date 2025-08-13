from typing import Optional
from backend.core.queue.base.observable_dll import ObservableQueue

#handles all the queues, singleton
class QueueManager:
    def __init__(self):
        self._queues = {}

    def add(self, queue: ObservableQueue) -> bool:
        name = queue.get_name()
        if name not in self._queues:
            self._queues[name] = queue
            return True
        return False
    
    def get(self, queue_name: str) -> Optional[ObservableQueue]:
        return self._queues.get(queue_name)

    def delete(self, queue_name: str) -> bool:
        return self._queues.pop(queue_name, None) is not None

    def list(self) -> list[str]:
        return list(self._queues.keys())