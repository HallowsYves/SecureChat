import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.message import Message

router = APIRouter()

connected_clients = []

"""
    WebSocket Endpoint:
    - Accepts incoming WebSocket connections
    - Receives messages from clients and validates them.
    - Stores messages in the database.
    - Broadcasts messages to all connected clients.
"""
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            #  Receive raw text message
            raw_data = await websocket.receive_text()
            print(f"Received raw message: {raw_data}")

            #  Parse JSON message
            try:
                data = json.loads(raw_data)  # Converts string to dict
                sender_id = data.get("sender_id")
                receiver_id = data.get("receiver_id")
                content = data.get("content")  # Ensure this is a string
            
            except json.JSONDecodeError:
                print("Invalid JSON format received.")
                await websocket.send_text("Error: Invalid JSON format.")
                continue

            # Check if sender_id, receiver_id, and content are valid
            if not sender_id or not receiver_id or not isinstance(content, str):
                await websocket.send_text("Error: Missing or invalid sender_id, receiver_id, or content.")
                continue

            #  Store message in the database (Ensure `content` is a string)
            message = Message(sender_id=sender_id, receiver_id=receiver_id, content=str(content))
            db.add(message)
            db.commit()
            print(f"Message stored in database: {content}")

            #  Send message to all connected clients
            for client in connected_clients:
                await client.send_text(json.dumps({"sender_id": sender_id, "content": content}))

    except WebSocketDisconnect:
        connected_clients.remove(websocket)