from functools import partial

from backend.data_structures.events import Event, EventTopic, EventBus
from backend.data_structures.schemas.websocket_schemas import WebsocketMessage
from backend.data_structures.websocket_manager import WebsocketManager


def register_event_handlers(event_bus: EventBus, websocket_manager: WebsocketManager):
    """
    Registers event handlers to the event bus for specific event topics.

    Args:
        event_bus (EventBus): The global event bus instance responsible for managing event subscriptions and publishing.
        websocket_manager (WebsocketManager): The manager responsible for broadcasting messages to websocket clients.

    Returns:
        None
    """
    event_bus.subscribe(
        EventTopic.TRACK_ADDED,
        lambda event: on_track_added(event, websocket_manager)
    )
    event_bus.subscribe(
        EventTopic.TRACK_REMOVED,
        lambda event: on_track_removed(event, websocket_manager)
    )
    return


async def on_track_added(event: Event, websocket_manager: WebsocketManager):
    """
    Event handler for when a track is added to the queue.

    Constructs and sends a websocket message to all connected clients,
    notifying them that a track has been added.

    Args:
        event (Event): The event object containing the topic and payload (expects 'source' and 'track').
        websocket_manager (WebsocketManager): The websocket manager to broadcast messages through.

    Returns:
        None
    """
    track_queue = event.payload.get("source") #must have source and track fields for this call
    track = event.payload.get("track")

    context = f"{track_queue.get_name()}.{event.topic.value}" #ex. play_queue.track_added
    next = track_queue.peek_at(1)

    message = WebsocketMessage(
        context=context,
        data={
            "content": track_queue,
            "next": next,
            "track": track
        }
    )
    await websocket_manager.broadcast(message.to_json())
    return



async def on_track_removed(event: Event, websocket_manager: WebsocketManager):
    """
    Event handler for when a track is removed from the queue.

    Constructs and sends a websocket message to all connected clients,
    notifying them that a track has been removed.

    Args:
        event (Event): The event object containing the topic and payload (expects 'source' and 'track').
        websocket_manager (WebsocketManager): The websocket manager to broadcast messages through.

    Returns:
        None
    """
    track_queue = event.payload.get("source") #must have source and track fields for this call
    track = event.payload.get("track")

    context = f"{track_queue.get_name()}.{event.topic.value}" #ex. play_queue.track_removed
    next = track_queue.peek_at(1)

    message = WebsocketMessage(
        context=context,
        data={
            "content": track_queue,
            "next": next,
            "track": track
        }
    )
    await websocket_manager.broadcast(message.to_json())
    return