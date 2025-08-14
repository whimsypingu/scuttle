import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/websocket")

@router.websocket("")
async def websocket(websocket: WebSocket):
    """
    WebSocket endpoint that registers a connection with the WebsocketManager
    and keeps it alive by sleeping. Does not expect messages from client.
    """
    await websocket.accept()

    websocket_manager = websocket.app.state.websocket_manager
    websocket_manager.connect(websocket)
    try: 
        while True:
            # Just keep connection alive, do not expect messages from client
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        pass
    finally:
        websocket_manager.disconnect(websocket) 

