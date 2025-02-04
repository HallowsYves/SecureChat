import asyncio
import websockets

async def hello(websocket):
    name = await websocket.recv()
    print(f'Server Recieved:' {name})