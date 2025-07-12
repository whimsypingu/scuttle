from typing import Optional
from .websocket_manager import WebsocketManager
from .track_queue import TrackQueue

#handles all the queues, singleton
class QueueManager:
    def __init__(self):
        """
        Initializes a new QueueManager.
        """
        self._queues = {}

    def create(self, queue_name: str, websocket_manager: Optional[WebsocketManager] = None):
        """
        Creates a new TrackQueue with the given name, if it doesn't already exist.

        Args:
            queue_name (str): The name of the queue to create.
            websocket_manager (WebsocketManager): The WebsocketManager to attach to the queue.

        Returns:
            bool: True if the queue was created, False if it already exists.
        """
        if queue_name not in self._queues:
            self._queues[queue_name] = TrackQueue(queue_name, websocket_manager)
            return True
        return False

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