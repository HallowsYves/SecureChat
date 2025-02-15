
## HOW TO USE
* Run `source install.sh` to install needed packages
* Modify `sample.py`, insert your credentials of user's that are going to use the program, Once inserted run `python sample.py` to setup the database
* Run `./server_secure.py` to start the server.
* Clients can connect by running `./client_secure.py` and inserting their credentials, Happy Chatting!

## `client_secure.py`
client application that connects the SecureChat server allowing users to:
* Log in with their credentials(defined in sample.py)
* Send messages in real-time
* Recieve messages from other users
* Handle rate limiting messages from the server.

## `server_secure.py`
Backend WebSocket Server
* Authenticates users via local SQLite (userdata.db).
* Sends messages between connected clients in real time.
* Prevents spam/abuse with rate limiting.
* Checks connection helth with "ping/pong" checks.
* Notifies when client's join and disconnect.


## LIBRARIES USED
* asyncio - Handling of asynchronus event loops and concurrency
* pathlib - Manages file paths for SSL and other files
* ssl - Secures the WebSocket server with TLS encryption
* sqlite3 - retrieves user credentials
* hashlib - Used for hashing passwords and secure storage 
* websockets - Implementation of the actual WebSocket protocol allowing for real time communication
* pyfiglet - Used for ASCII banner
* getpass - Used for hiding the password from being physically veiwed on display

