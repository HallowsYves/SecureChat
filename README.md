 ____                            ____ _           _
/ ___|  ___  ___ _   _ _ __ ___ / ___| |__   __ _| |_
\___ \ / _ \/ __| | | | '__/ _ \ |   | '_ \ / _` | __|
 ___) |  __/ (__| |_| | | |  __/ |___| | | | (_| | |_
|____/ \___|\___|\__,_|_|  \___|\____|_| |_|\__,_|\__|


## HOW TO USE
* Run `soruce install.sh` to install needed packages
* Modify `sample.py`, insert your credentials of user's that are going to use the program, Once inserted run `python sample.py` to setup the database
* Run `python server_secure.py` to start the server.
* Clients can connect by running `python client_secure.py` and inserting their credentials, Happy Chatting!

## server_secure.py


## LIBRARIES USED
* asyncio - Handling of asynchronus event loops and concurrency
* pathlib - Manages file paths for SSL and other files
* ssl - Secures the WebSocket server with TLS encryption
* sqlite3 - retrieves user credentials
* hashlib - Used for hashing passwords and secure storage 
* websockets - Implementation of the actual WebSocket protocol allowing for real time communication
* pyfiglet - Used for ASCII banner

