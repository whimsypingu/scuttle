from typing import Generic, TypeVar, Optional

T = TypeVar("T")

class Node(Generic[T]):
    def __init__(self, value: T):
        self.value = value
        self.prev: Optional[Node[T]] = None
        self.next: Optional[Node[T]] = None

class DoublyLinkedList(Generic[T]):
    def __init__(self):
        self.head: Optional[Node[T]] = None
        self.tail: Optional[Node[T]] = None
        self.size = 0

    def __iter__(self):
        current = self.head
        while current:
            yield current.value
            current = current.next

    def clear(self):
        self.head = None
        self.tail = None
        self.size = 0

    def push(self, item: T):
        node = Node(item)
        if not self.tail:
            self.head = self.tail = node
        else:
            self.tail.next = node
            node.prev = self.tail
            self.tail = node
        self.size += 1

    def pop(self) -> Optional[T]:
        if not self.head:
            return None
        node = self.head
        self.head = node.next
        if self.head:
            self.head.prev = None
        else:
            self.tail = None
        self.size -= 1
        return node.value

    def insert_at(self, index: int, item: T):
        if index <= 0:
            node = Node(item)
            node.next = self.head
            if self.head:
                self.head.prev = node
            self.head = node
            if not self.tail:
                self.tail = node
            self.size += 1
            return
        if index >= self.size:
            self.push(item)
            return

        current = self.head
        for _ in range(index):
            current = current.next
        node = Node(item)
        prev_node = current.prev
        prev_node.next = node
        node.prev = prev_node
        node.next = current
        current.prev = node
        self.size += 1

    def peek(self) -> Optional[T]:
        return self.head.value if self.head else None

    def peek_at(self, index: int) -> Optional[T]:
        if index < 0 or index >= self.size:
            return None
        current = self.head
        for _ in range(index):
            current = current.next
        return current.value if current else None
    
    def remove_at(self, index: int) -> Optional[T]:
        if index < 0 or index >= self.size:
            return None
        if index == 0: #remove head
            return self.pop()
        
        if index == self.size - 1: #remove tail
            current = self.tail
            self.tail = current.prev
            if self.tail:
                self.tail.next = None
            else:
                self.head = None
            self.size -= 1
            return current.value
        
        current = self.head #remove middle
        for _ in range(index):
            current = current.next
        prev_node = current.prev
        next_node = current.next

        if prev_node:
            prev_node.next = next_node
        if next_node:
            next_node.prev = prev_node

        self.size -= 1
        return current.value
        

    def contains(self, item: T) -> bool:
        return any(x == item for x in self)

