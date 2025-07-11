from pydantic import BaseModel
from typing import Optional

#audio
class Track(BaseModel):
    youtube_id: str
    title: str
    uploader: str
    duration: int

#queueing
class TrackNode:
    def __init__(self, track: Track):
        self.track = track
        self.prev = None
        self.next = None

class TrackQueue:
    def __init__(self):
        self.head = None
        self.tail = None
        self.youtube_id_counts = {}
        self.size = 0

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

    def _add_track(self, track: Track):
        """Internal helper to update counters when a track is added."""
        self.youtube_id_counts[track.youtube_id] = self.youtube_id_counts.get(track.youtube_id, 0) + 1
        self.size += 1
        return

    def _remove_track(self, track: Track):
        """Internal helper to update counters when a track is removed."""
        if track.youtube_id in self.youtube_id_counts:
            self.youtube_id_counts[track.youtube_id] -= 1
            if self.youtube_id_counts[track.youtube_id] <= 0:
                del self.youtube_id_counts[track.youtube_id]
            self.size -= 1


    def to_list(self):
        """Returns a list of serialized track dicts (via model_dump)."""
        return [track.model_dump() for track in self]

    def get_size(self):
        """Returns number of tracks in the queue."""
        return self.size

    def contains(self, track):
        """Returns True if track is in the queue (based on YouTube ID)."""
        return self.youtube_id_counts.get(track.youtube_id, 0) > 0


    def peek(self) -> Optional[Track]:
        """Returns the track at the front of the queue without removing it."""
        if not self.head:
            return None
        return self.head.track

    def push(self, track: Track):
        """Appends a track to the end of the queue."""
        new_node = TrackNode(track)
        if not self.tail:
            self.head = self.tail = new_node
        else:
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node
        
        self._add_track(track)

    def pop(self) -> Optional[Track]:
        """Removes and returns the track at the front of the queue."""
        if not self.head:
            return None
        removed_node = self.head
        self.head = removed_node.next
        if self.head:
            self.head.prev = None
        else:
            self.tail = None  # queue is now empty

        self._remove_track(removed_node.track)
        
        return removed_node.track
    

    def insert_at(self, index: int, track: Track):
        """
        Inserts a track at the specified index.
        - If queue is empty, inserts as the only node.
        - If index >= size, appends to end.
        - If index <= 0, inserts at front.
        """
        new_node = TrackNode(track)

        #queue is empty
        if self.head is None:
            self.head = self.tail = new_node
            self._add_track(track)
            return

        #end of queue
        if index >= self.size:
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node
            self._add_track(track)
            return
        
        #front of queue
        if index <= 0:
            new_node.next = self.head
            self.head.prev = new_node
            self.head = new_node
            self._add_track(track)
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

        self._add_track(track)
        return


    

#handles all the queues, singleton
class QueueManager:
    def __init__(self):
        self._queues = {}

    def create(self, queue_name: str):
        if queue_name not in self._queues:
            self._queues[queue_name] = TrackQueue()
            return True
        return False

    def get(self, queue_name: str):
        return self._queues.get(queue_name)

    def delete(self, queue_name: str):
        return self._queues.pop(queue_name, None) is not None

    def list(self):
        return list(self._queues.keys())