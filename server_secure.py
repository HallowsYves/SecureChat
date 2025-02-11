#!/usr/bin/env python

import asyncio
import pathlib
import ssl
import websockets
from websockets.asyncio.server import serve

async def hello(websocket):
    try:
        client_info = websocket.remote_address
        client_message = await websocket.recv()

        print(f"Client:{client_message} joined.")

    except:
        pass
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
localhost_pem = pathlib.Path(__file__).with_name("localhost.pem")
ssl_context.load_cert_chain(localhost_pem)

async def main():
    print("Server Started...")
    async with serve(hello, "localhost", 8765, ssl=ssl_context):
        await asyncio.get_running_loop().create_future()  # run forever

asyncio.run(main())
