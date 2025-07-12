import asyncio
from typing import Optional

from .track import Track
from .track_node import TrackNode
from .websocket_manager import WebsocketManager
from .schemas import WebsocketMessage

class TrackQueue:
    def __init__(
        self, 
        name: Optional[str] = None, 
        websocket_manager: Optional[WebsocketManager] = None
    ):
        self.name = name
        self.websocket_manager = websocket_manager

        self.head = None
        self.tail = None
        self.youtube_id_counts = {}
        self.size = 0

        self._lock = asyncio.Lock() #prevent race conditions because broadcasting is async and head and tail edits

    def __iter__(self):
        """Allows iteration over the queue yielding Track objects."""
        curr = self.head
        while curr:
            yield curr.track
            curr = curr.next

    def __str__(self):
        """Human-readable representation of the queue."""
        titles = [track.title for track in self]
        return " -> ".join(titles) if titles else "Queue is empty"


    #internal helpers
    async def _add_track(self, track: Track):
        """
        Update counters and broadcast when a track is added.

        Args:
            track (Track): The track to add.

        Returns:
            None
        """
        self.youtube_id_counts[track.youtube_id] = self.youtube_id_counts.get(track.youtube_id, 0) + 1
        self.size += 1
        if self.websocket_manager:
            message = WebsocketMessage(
                action="add", 
                name=self.name, 
                queue=self.to_json() #required for data type and to prevent circular import of TrackQueue
            ).to_json()
            await self.websocket_manager.broadcast(message)
        return

    async def _remove_track(self, track: Track):
        """
        Update counters and broadcast when a track is removed.

        Args:
            track (Track): The track to remove.

        Returns:
            None
        """
        if track.youtube_id in self.youtube_id_counts:
            self.youtube_id_counts[track.youtube_id] -= 1
            if self.youtube_id_counts[track.youtube_id] <= 0:
                del self.youtube_id_counts[track.youtube_id]
            self.size -= 1

            if self.websocket_manager:
                message = WebsocketMessage(
                    action="remove", 
                    name=self.name, 
                    queue=self.to_json()
                ).to_json()
                await self.websocket_manager.broadcast(message)
        return


    #public methods
    def to_json(self):
        """
        Get the queue as a list of serialized track dictionaries.

        Returns:
            List[dict]: List of tracks serialized as dicts.
        """
        return [track.to_json() for track in self]

    def get_size(self):
        """
        Get the number of tracks currently in the queue.

        Returns:
            int: Number of tracks in the queue.
        """
        return self.size

    def contains(self, track):
        """
        Check if the given track is present in the queue.

        Args:
            track (Track): Track to check.

        Returns:
            bool: True if the track is in the queue, False otherwise.
        """
        return self.youtube_id_counts.get(track.youtube_id, 0) > 0

    def peek(self) -> Optional[Track]:
        """
        Get the track at the front of the queue without removing it.

        Returns:
            Optional[Track]: The track at the front, or None if empty.
        """
        if not self.head:
            return None
        return self.head.track


    #modify queue contents
    async def push(self, track: Track):
        """
        Append a track to the end of the queue and broadcast the update.

        Args:
            track (Track): Track to append.

        Returns:
            None
        """
        async with self._lock:
            new_node = TrackNode(track)
            if not self.tail:
                self.head = self.tail = new_node
            else:
                self.tail.next = new_node
                new_node.prev = self.tail
                self.tail = new_node
            
            await self._add_track(track)
            return

    async def pop(self) -> Optional[Track]:
        """
        Remove and return the track at the front of the queue, broadcasting the update.

        Returns:
            Optional[Track]: The removed track, or None if the queue was empty.
        """
        async with self._lock:
            if not self.head:
                return None
            removed_node = self.head
            self.head = removed_node.next
            if self.head:
                self.head.prev = None
            else:
                self.tail = None  # queue is now empty

            await self._remove_track(removed_node.track)
            
            return removed_node.track
    

    async def insert_at(self, index: int, track: Track):
        """
        Insert a track at a specified index in the queue.

        If the queue is empty, inserts as the only node.
        If the index is greater than or equal to the queue size, appends to the end.
        If the index is less than or equal to zero, inserts at the front.

        Args:
            index (int): Position at which to insert.
            track (Track): Track to insert.

        Returns:
            None
        """
        async with self._lock:
            new_node = TrackNode(track)

            #queue is empty
            if self.head is None:
                self.head = self.tail = new_node
                await self._add_track(track)
                return

            #end of queue
            if index >= self.size:
                self.tail.next = new_node
                new_node.prev = self.tail
                self.tail = new_node
                await self._add_track(track)
                return
            
            #front of queue
            if index <= 0:
                new_node.next = self.head
                self.head.prev = new_node
                self.head = new_node
                await self._add_track(track)
                return
            
            #middle of queue
            curr = self.head
            for _ in range(index):
                curr = curr.next

            #insertion
            prev_node = curr.prev
            prev_node.next = new_node
            new_node.prev = prev_node
            new_node.next = curr
            curr.prev = new_node

            await self._add_track(track)
            return


    

    
