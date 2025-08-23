import asyncio

from backend.core.events.event_bus import EventBus
from backend.core.models.event import Event

from .doubly_linked_list import DoublyLinkedList

from typing import Generic, TypeVar, Optional
from abc import ABC, abstractmethod

T = TypeVar("T")

class ObservableQueue(Generic[T], ABC):
    def __init__(
        self,
        *,
        dll: Optional[DoublyLinkedList[T]] = None,
        name: Optional[str] = None,
        event_bus: Optional[EventBus] = None,
    ):
        self._dll = dll or DoublyLinkedList()
        self._name = name
        self._event_bus = event_bus
        self._lock = asyncio.Lock()
        self._condition = asyncio.Condition(lock=self._lock)

    # ===== Internal helpers (do not override) =====
    async def _emit_event(self, action: str, payload: Optional[dict] = None):
        if self._event_bus:
            event = Event(
                source=self._name,
                action=action,
                payload={**(payload or {})}
            )
            await self._event_bus.publish(event)

    def _push(self, item: T):
        self._dll.push(item)

    def _pop(self) -> Optional[T]:
        item = self._dll.pop()
        return item

    def _insert_at(self, index: int, item: T):
        self._dll.insert_at(index, item)

    def _remove_at(self, index: int) -> Optional[T]:
        # you would need to implement remove_at in DoublyLinkedList too
        raise NotImplementedError("Implement remove_at in DoublyLinkedList")
        # item = self._dll.remove_at(index)
        # await self._emit_event("remove", {"index": index, "item": item, "size": self.size()})
        # return item

    # ===== Public Read-only APIs =====
    def __iter__(self):
        return iter(self._dll)

    def peek(self) -> Optional[T]:
        return self._dll.peek()

    def peek_at(self, index: int) -> Optional[T]:
        return self._dll.peek_at(index)

    def contains(self, item: T) -> bool:
        return self._dll.contains(item)
    
    def is_empty(self) -> bool:
        return self._dll.size == 0

    def get_size(self) -> int:
        return self._dll.size

    def get_name(self) -> str:
        return self._name
    
    def to_json(self) -> list:
        #custom to_json builder
        result = []
        for item in self._dll:
            if hasattr(item, "to_json"):
                result.append(item.to_json())
            else:
                result.append(item)
        return result

