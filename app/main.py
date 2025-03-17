from fastapi import FastAPI

app = FastAPI()  # Ensure this is present

@app.get("/")
def home():
    return {"message": "SecureChat FastAPI Server is Running"}