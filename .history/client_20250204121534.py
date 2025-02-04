import asyncio
import pathlib
import ssl

from websockets.asyncio.client import connect

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

async def hello():
    uri = "ws://localhost:8765"
    async with connect(uri) as websocket:
        name = input("What is your name? ")

        await websocket.send(name)
        print(f">>> {name}")

        greeting = await websocket.recv()
        print(f"<<< {greeting}")

if __name__ == "__main__":
    asyncio.run(hello())