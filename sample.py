import sqlite3
import hashlib
"""
PUT USERNAMES AND PASSWORDS HERE
"""
credentials = [("username1","password1"),
               ("username2","password2")
               # add more as needed
]

connection_ = sqlite3.connect("userdata.db")
cur = connection_.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS userdata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)
""")

# Load users
for username, password in credentials:
  cur.execute("INSERT OR IGNORE INTO userdata (username, password) VALUES (?,?)", (username, hashlib.sha256(password.encode()).hexdigest()))
connection_.commit()
connection_.close()