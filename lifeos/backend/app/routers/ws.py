from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.websocket_manager import ws_manager
from app.core.security import decode_token
from app.database import SessionLocal
from app.models import User
import logging

router = APIRouter(tags=["websocket"])
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint. Client connects with:
    ws://host/ws?token=<access_token>
    """
    # Validate JWT before accepting
    db = SessionLocal()
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = int(payload.get("sub", 0))
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    finally:
        db.close()

    await ws_manager.connect(websocket, user_id)
    try:
        # Send a welcome ping
        import json
        await websocket.send_text(json.dumps({"event": "connected", "data": {"user_id": user_id}}))
        # Keep alive — listen for pings from client
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
        logger.info(f"WS client disconnected: user {user_id}")
    except Exception as e:
        ws_manager.disconnect(websocket, user_id)
        logger.error(f"WS error for user {user_id}: {e}")
