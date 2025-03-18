from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.models.user import User
from app.routes.hashing import verify_password, get_password_hash
from app.routes.jwt_handler import create_access_token, oauth2_scheme

router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = 30

class RegisterRequest(BaseModel):
    username: str
    password: str

"""
    User Registration:
    - Stores a new user in the database with a hashed password.
    - Uses `RegisterRequest` model for validation.
"""
@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(request.password)
    user = User(username=request.username, hashed_password=hashed_password)
    
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}

"""
    User Login:
    - Validates user credentials.
    - Returns a JWT token if successful.
"""
@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid Credentials")
    
    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

"""
    Protected Route:
    - Requires authentication via JWT.
    - Returns a success message if valid.
"""
@router.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    return {"message": "Hello, you are authenticated!"}