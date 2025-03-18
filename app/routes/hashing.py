from passlib.context import CryptContext

# Password hashing context
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

"""
Helper function to verify password
"""
def verify_password(plain_password, hashed_password):
    return password_context.verify(plain_password, hashed_password)

"""
Helper function for hashing password
"""
def get_password_hash(password):
    return password_context.hash(password)