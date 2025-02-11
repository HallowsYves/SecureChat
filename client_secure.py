#!/usr/bin/env python

import asyncio
import pathlib
import ssl

from websockets.asyncio.client import connect

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
localhost_pem = pathlib.Path(__file__).with_name("localhost.pem")
ssl_context.load_verify_locations(localhost_pem)

async def connectToServer():
    uri = "wss://localhost:8765"

    try:
        async with connect(uri, ssl=ssl_context) as websocket:
            
            print("Connected to server. Type 'Q' to quit")
            
            while True:
                # Authentication function or something like that
                message = input("Enter message: ")

                if message == "Q":
                    print("Closing connection...")
                    await websocket.close()
                    break
                await websocket.send(message)
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(connectToServer())