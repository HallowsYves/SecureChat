from fastapi import FastAPI
from app.routes import auth, chat

app = FastAPI()

app.include_router(auth.router, prefix="/auth")
app.include_router(chat.router)

@app.get("/")
def home():
    return {"message": "SecureChat FastAPI Server is Running"}