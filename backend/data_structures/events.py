import asyncio
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Callable

class EventTopic(Enum):
    TRACK_ADDED = "track_added"
    TRACK_REMOVED = "track_removed"

@dataclass
class Event:
    topic: EventTopic
    payload: Optional[dict] = None

class EventBus:
    def __init__(self):
        self._subscribers = {}

    def subscribe(self, topic: EventTopic, handler: Callable):
        self._subscribers.setdefault(topic, []).append(handler)

    async def publish(self, event: Event):
        for handler in self._subscribers.get(event.topic, []):
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                print(f"Error in {event.topic} handler: {e}")

        