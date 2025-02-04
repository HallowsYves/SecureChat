import asyncio
import pathlib
import ssl

from websockets.asyncio.server import serve

async def hello(websocket):
    name = await websocket.recv()
    print(f"<<< {name}")

    greeting = f"Hello {name}!"

    await websocket.send(greeting)
    print(f">>> {greeting}")

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
localhost_pem = pathlib.Path(__file__).with_name("localhost.pem")

async def main():
    async with serve(hello, "localhost", 8765):
        await asyncio.get_event_loop().create_future # runs server forever

if __name__ == "__main__":
    asyncio.run(main())