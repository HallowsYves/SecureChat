import sqlite3
import hashlib

connection_ = sqlite3.connect("userdata.db")
cur = connection_.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS userdata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)
""")

# Sample users
username1, password1 = "", hashlib.sha256("".encode()).hexdigest()
username2, password2 = "", hashlib.sha256("".encode()).hexdigest()

cur.execute("INSERT OR IGNORE INTO userdata (username, password) VALUES (?,?)", (username1, password1))
cur.execute("INSERT OR IGNORE INTO userdata (username, password) VALUES (?,?)", (username2, password2))

# Save changes and close connection
connection_.commit()
connection_.close()

print("Database setup complete. Users added.")
