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

    #iterator to use in loops
    def __iter__(self):
        curr = self.head
        while curr:
            yield curr.track
            curr = curr.next

    #uses iterator to make a list
    def to_list(self):
        return [track.model_dump() for track in self]

    #printable debugging
    def __str__(self):
        titles = [track.title for track in self]
        return " -> ".join(titles) if titles else "Queue is empty"

    #put at the end
    def push(self, track: Track):
        new_node = TrackNode(track)
        if not self.tail:
            self.head = self.tail = new_node
        else:
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node

    #remove from front
    def pop(self) -> Optional[Track]:
        if not self.head:
            return None
        removed_node = self.head
        self.head = removed_node.next
        if self.head:
            self.head.prev = None
        else:
            self.tail = None  # queue is now empty
        return removed_node.track
    
class QueueManager:
    def __init__(self):
        self._queues = {}

    def get_or_create(self, queue_name: str):
        if queue_name not in self._queues:
            self._queues[queue_name] = TrackQueue()
        return self._queues[queue_name]

    def delete(self, queue_name: str):
        return self._queues.pop(queue_name, None) is not None

    def list(self):
        return list(self._queues.keys())