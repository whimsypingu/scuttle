import asyncio

from typing import Dict, List, Callable

from backend.core.models.event import Event

class EventBus:
    def __init__(self):
        #subscribers: {source: {action: [handlers]}}
        self._subscribers: Dict[str, Dict[str, List[Callable]]] = {}

    def subscribe(self, source: str, action: str, handler: Callable):
        self._subscribers.setdefault(source, {}).setdefault(action, []).append(handler)

    async def publish(self, event: Event):
        handlers = self._subscribers.get(event.source, {}).get(event.action, [])
        for handler in handlers:
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                print(f"Error in handler for {event.source}.{event.action}: {e}")

        