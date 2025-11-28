from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Define JWT settings
SECRET_KEY = "your-secret-key"  # !! IMPORTANT: Change this to a strong, random key in production !!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Increased token expiry for better UX

# Password hashing
pwd_context = CryptContext.from_settings(
    CryptContext(
        schemes=["bcrypt"],
        deprecated="auto",
    )
)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# TODO: Implement OAuth2 flows for Google Sign-In
def get_google_oauth_url():
    # This would return the URL to redirect the user to Google for authentication
    # Requires client ID and redirect URI configuration
    pass

def get_google_user_info(code):
    # This function would exchange the authorization code for an access token
    # and then fetch user information from Google API
    pass
