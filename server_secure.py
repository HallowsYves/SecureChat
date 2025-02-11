#!/usr/bin/env python

import asyncio
import pathlib
import ssl
import websockets
from websockets.asyncio.server import serve

async def hello(websocket):
    try:
        client_info = websocket.remote_address

        if isinstance(client_info, tuple) and len(client_info) >= 2:
            client_ip, client_port = client_info[:2]  # Extract first two values safely
        else:
            client_ip, client_port = "UNKNOWN", "UNKNOWN"

        print(f"Client Connected: IP {client_ip}, PORT {client_port}")

        async for message in websocket:
            print(f"Received from {client_ip}: {message}")
            await websocket.send(f"Echo: {message}")
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection with {client_ip} closed.")

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
localhost_pem = pathlib.Path(__file__).with_name("localhost.pem")
ssl_context.load_cert_chain(localhost_pem)

async def main():
    print("Server Started...")
    async with serve(hello, "localhost", 8765, ssl=ssl_context):
        await asyncio.get_running_loop().create_future()  # run forever

asyncio.run(main())
