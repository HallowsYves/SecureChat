import asyncio

from websockets.asyncio.client import connect

async def hello():
    uri = "ws://localhost:8765"
    async with connect(uri) as websocket:
        name = input("What is your name? ")