from typing import Set
from fastapi import WebSocket

#handles all websockets, singleton
class WebsocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    def connect(self, websocket: WebSocket):
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
    
        #handle broken connection    
        for connection in disconnected:
            self.disconnect(connection)

        print(f"[WS BROADCAST] to {len(self.active_connections)} clients: {message}")
