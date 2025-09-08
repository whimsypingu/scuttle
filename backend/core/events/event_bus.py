import asyncio

from typing import Dict, List, Callable

from backend.core.models.event import Event

class EventBus:
    def __init__(self):
        """
        Initialize an EventBus instance.

        _subscribers is a nested dictionary:
        {
            "source_name": {
                "action_name": [handler1, handler2, ...]
            }
        }
        - 'source' is usually the name of the component emitting events.
        - 'action' is the type of event (e.g., "TASKSTART", "DOWNLOAD").
        - 'handler' is a callable that will be called when that event occurs.
        """
        #subscribers: {source: {action: [handlers]}}
        self._subscribers: Dict[str, Dict[str, List[Callable]]] = {}

    def subscribe(self, source: str, action: str, handler: Callable):
        """
        Subscribe a handler function to a specific event.

        Parameters:
        - source: str, the event source/component name
        - action: str, the specific action/event type
        - handler: Callable, a function (can be async or sync) to call when event occurs

        Example:
            bus.subscribe("YouTubeClient", "TASKSTART", handle_task_start)

        Internally:
        - setdefault ensures the nested dictionaries/lists exist.
        - appends the handler to the list of handlers for that (source, action).
        """
        self._subscribers.setdefault(source, {}).setdefault(action, []).append(handler)

    async def publish(self, event: Event):
        """
        Publish an event to all subscribers.

        Parameters:
        - event: Event object containing 'source', 'action', and optional payload.

        Logic:
        1. Look up all handlers registered for event.source and event.action.
        2. Call each handler with the event as argument.
        3. If the handler returns a coroutine (async), await it.
        4. Catch and log any exceptions so one failing handler doesn't break others.

        Example:
            await bus.publish(Event(source="YouTubeClient", action="TASKSTART", payload={}))
        """
        handlers = self._subscribers.get(event.source, {}).get(event.action, [])
        for handler in handlers:
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                print(f"Error in handler for {event.source}.{event.action}: {e}")

        