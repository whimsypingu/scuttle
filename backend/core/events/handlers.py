
from .event_bus import EventBus
from .websocket.manager import WebsocketManager
from .websocket.message import WebsocketMessage

from backend.core.models.event import Event

import backend.globals as G
from backend.core.queue.implementations.play_queue import PlayQueueAction as PQA


def register_event_handlers(event_bus: EventBus, websocket_manager: WebsocketManager):
    """
    Register event handlers on the EventBus for PlayQueue-related actions.

    Subscribes handlers to specific (source, action) event topics, so that
    when events occur in the PlayQueue domain, they are broadcasted to all
    connected websocket clients.

    Args:
        event_bus (EventBus): The event bus instance to subscribe handlers to.
        websocket_manager (WebsocketManager): The websocket manager used to broadcast messages.
    """

    #(source, action)
    subscriptions = [
        (G.PLAY_QUEUE_NAME, PQA.SET_FIRST),
        (G.PLAY_QUEUE_NAME, PQA.INSERT_NEXT),
        (G.PLAY_QUEUE_NAME, PQA.PUSH),
        (G.PLAY_QUEUE_NAME, PQA.POP),
        (G.PLAY_QUEUE_NAME, PQA.REMOVE),
    ]

    handler = make_basic_handler(websocket_manager)

    #registration
    for source, action in subscriptions:
        event_bus.subscribe(source=source, action=action, handler=handler)


def make_basic_handler(websocket_manager: WebsocketManager):
    """
    Creates a reusable async handler function that broadcasts an event to websocket clients.

    The returned handler converts the internal Event into a WebsocketMessage, serializes it
    to JSON, and broadcasts it using the provided WebsocketManager.

    Args:
        websocket_manager (WebsocketManager): The websocket manager responsible for broadcasting.

    Returns:
        Callable[[Event], Awaitable[None]]: ? An async handler function suitable for EventBus subscriptions.
    """
    async def handler(event: Event):
        try:
            message = WebsocketMessage.from_event(event).to_json()
            await websocket_manager.broadcast(message)
        except Exception as e:
            print(f"Error broadcasting event {event}: {e}")
    return handler