from typing import Optional
from ..core.events.temp.websocket_manager import WebsocketManager
from .track_queue import TrackQueue
from ..core.events.temp.events import EventBus

#handles all the queues, singleton
class QueueManager:
    def __init__(self):
        """
        Initializes a new QueueManager.
        """
        self._queues = {}

    def create(self, queue_name: str, event_bus: Optional[EventBus] = None):
        """
        Creates a new TrackQueue with the given name, if it doesn't already exist.

        Args:
            queue_name (str): The name of the queue to create.
            event_bus (EventBus): The EventBus to attach to the queue.

        Returns:
            TrackQueue | None: The queue if a new one was made successfully, else None.
        """
        if queue_name not in self._queues:
            new_queue = TrackQueue(queue_name, event_bus)
            self._queues[queue_name] = new_queue
            return new_queue
        return None

    def get(self, queue_name: str):
        """
        Retrieves the TrackQueue associated with the given name.

        Args:
            queue_name (str): The name of the queue to retrieve.

        Returns:
            TrackQueue | None: The queue if found, else None.
        """
        return self._queues.get(queue_name)

    def delete(self, queue_name: str):
        """
        Deletes the TrackQueue associated with the given name.

        Args:
            queue_name (str): The name of the queue to delete.

        Returns:
            bool: True if the queue existed and was deleted, False otherwise.
        """
        return self._queues.pop(queue_name, None) is not None

    def list(self):
        """
        Lists the names of all existing queues.

        Returns:
            list[str]: A list of all queue names.
        """
        return list(self._queues.keys())