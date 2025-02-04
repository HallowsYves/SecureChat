import asyncio

from websockets.asyncio.client import connect

async def hello():
    uri = "ws://localhost:8765"