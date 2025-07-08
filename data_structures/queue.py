from data_structures import Track
from typing import Optional

#queueing
class Node:
    def __init__(self, track: Track):
        self.track = track
        self.prev = None
        self.next = None

class Queue:
    def __init__(self):
        self.head = None
        self.tail = None

    #iterator to use in loops
    def __iter__(self):
        curr = self.head
        while curr:
            yield curr.track
            curr = curr.next

    #printable debugging
    def __str__(self):
        titles = [track.title for track in self]
        return " -> ".join(titles) if titles else "Queue is empty"

    #put at the end
    def push(self, track: Track):
        new_node = Node(track)
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