import asyncio
import websockets

async def hello(websocket):
    name = await websocket.recv()
    print(f'Server Recieved: {name}')
    greeting = f'Hello {name}!'

    await websocket.send(greeting)
    print(f'Server sent: {greeting}')

async def main():
    async with websockets.serve(hello, "localhost", 8765)