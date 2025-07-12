import asyncio
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/websocket")

@router.websocket("")
async def websocket(websocket: WebSocket):
    """
    WebSocket endpoint that registers a connection with the WebsocketManager
    and keeps it alive by sleeping. Does not expect messages from client.
    """
    websocket_manager = websocket.app.state.websocket_manager
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Just keep connection alive, do not expect messages from client
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)