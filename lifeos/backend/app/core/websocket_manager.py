from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        # user_id -> list of active connections
        self.connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(websocket)
        logger.info(f"WS connected: user {user_id} ({len(self.connections[user_id])} connections)")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.connections:
            self.connections[user_id] = [
                ws for ws in self.connections[user_id] if ws != websocket
            ]
            if not self.connections[user_id]:
                del self.connections[user_id]
        logger.info(f"WS disconnected: user {user_id}")

    async def send_to_user(self, user_id: int, event: str, data: dict):
        """Send a real-time event to all connections of a specific user."""
        payload = json.dumps({"event": event, "data": data})
        dead = []
        for ws in self.connections.get(user_id, []):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        # clean up dead connections
        for ws in dead:
            self.connections[user_id] = [w for w in self.connections[user_id] if w != ws]

    async def broadcast(self, event: str, data: dict):
        """Broadcast an event to ALL connected users."""
        payload = json.dumps({"event": event, "data": data})
        for user_id, sockets in list(self.connections.items()):
            dead = []
            for ws in sockets:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.connections[user_id] = [w for w in sockets if w != ws]


ws_manager = WebSocketManager()
