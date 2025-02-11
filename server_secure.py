#!/usr/bin/env python

import asyncio
import pathlib
import ssl
import sqlite3
import hashlib
import websockets
import pyfiglet  # For ASCII banner

def generate_ascii_banner():
    return pyfiglet.figlet_format("SecureChat")

async def authenticate(websocket):
    username = await websocket.recv()
    password = await websocket.recv()

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    connection = sqlite3.connect("userdata.db")
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM userdata WHERE username = ? AND password = ?", (username, hashed_password))
    user = cursor.fetchone()
    connection.close()

    if user:
        await websocket.send("Login Successful!")
        
        ascii_banner = generate_ascii_banner()
        await websocket.send(f"\n{ascii_banner}\nWelcome to SecureChat! Type your message below.")

        return username  
    else:
        await websocket.send("Login Failed. Disconnecting...")
        await websocket.close()
        return None

connected_users = {}

async def chat_handler(websocket):
    username = await authenticate(websocket)
    if not username:
        return  
    print(f"User '{username}' joined the chat.")

    connected_users[websocket] = username

    try:
        async for message in websocket:
            print(f"{username}: {message}")
            
            for user_ws in connected_users:
                if user_ws != websocket:  # Don't send the message back to the sender
                    await user_ws.send(f"{username}: {message}")

    except websockets.exceptions.ConnectionClosed:
        print(f"User '{username}' disconnected.")
    finally:
        if websocket in connected_users:
            del connected_users[websocket]

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
localhost_pem = pathlib.Path(__file__).with_name("localhost.pem")
ssl_context.load_cert_chain(localhost_pem)

async def main():
    print("SecureChat Server Started...")
    async with websockets.serve(chat_handler, "localhost", 8765, ssl=ssl_context):
        await asyncio.get_running_loop().create_future()  # Keep running

asyncio.run(main())
