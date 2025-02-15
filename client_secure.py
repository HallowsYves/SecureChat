#!/usr/bin/env python

import asyncio
import pathlib
import ssl
import websockets
import getpass

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
localhost_pem = pathlib.Path(__file__).with_name("localhost.pem")
ssl_context.load_verify_locations(localhost_pem)


async def aysnc_input(prompt=""):
    return await asyncio.to_thread(input, prompt)


async def connect_to_server():
    uri = "wss://localhost:8765"
    exit_flag = False

    while not exit_flag:
        try:
            async with websockets.connect(uri, ssl=ssl_context) as websocket:
                print("Connected to SecureChat. Please log in.")

                username = input("Username: ")
                await websocket.send(username)
                
                password = getpass.getpass("Password: ")
                await websocket.send(password)

                response = await websocket.recv()
                print(f"\n{response}\n")

                if "Login Failed" in response:
                    print("Exiting Client...\n")
                    return  
                
                ascii_banner = await websocket.recv()
                print(ascii_banner)
                print("\nType 'Q' to quit.\n")
                
                recieve_task = asyncio.create_task(receive_messages(websocket))

                while True:
                    message = await aysnc_input("> ")
                    if message.strip().upper() == "Q":
                        print("Closing connection...")
                        await websocket.close()
                        exit_flag = True
                        break
                    await websocket.send(message)
                recieve_task.cancel()

                if exit_flag:
                    break


        except websockets.exceptions.ConnectionClosed:
            if not exit_flag:
                print("\nConnection closed by server. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
        except Exception as e:
            if not exit_flag:
                print(f"\nError: {e}. Reconnecting in 5 seconds..")
                await asyncio.sleep(5)
 

async def receive_messages(websocket):
    """ Continuously listens for messages from the server. """
    try:
        async for message in websocket:
            print(f"\n{message}")
    except websockets.exceptions.ConnectionClosed:
        print("\nLost connection to the server.")

if __name__ == "__main__":
    asyncio.run(connect_to_server())
