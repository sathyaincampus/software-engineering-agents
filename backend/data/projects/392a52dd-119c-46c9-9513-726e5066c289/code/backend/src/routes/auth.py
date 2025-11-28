from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import uuid

from backend.src.database import get_db
from backend.src.models import User
from backend.src.schemas import UserCreateSchema, UserSchema, LoginSchema
from backend.src.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext.from_settings(
    CryptContext(
        schemes=["bcrypt"],
        deprecated="auto",
    )
)

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/signup", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreateSchema, db: Session = Depends(get_db)):
    """
    User signup with email and password.
    
    - **email**: User's email address (must be unique).
    - **password**: User's desired password.
    - **display_name**: User's display name.
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = pwd_context.hash(user.password)
    
    # Default role is 'child' as per schema, can be modified if needed
    db_user = User(
        user_id=uuid.uuid4(),
        email=user.email,
        password_hash=hashed_password,
        display_name=user.display_name,
        role='child' # Default role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(user_login: LoginSchema, db: Session = Depends(get_db)):
    """
    User login with email and password.
    
    - **email**: User's email address.
    - **password**: User's password.
    """
    db_user = db.query(User).filter(User.email == user_login.email).first()
    if not db_user or not verify_password(user_login.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"email": db_user.email, "user_id": str(db_user.user_id), "role": db_user.role})
    return Token(access_token=access_token, token_type="bearer")

# TODO: Implement Google Sign-In endpoint
# @router.post("/google-login")
def google_login():
    # This will involve redirecting to Google's OAuth endpoint and handling the callback
    pass

# TODO: Implement logout endpoint (e.g., token invalidation if using a blacklist)
# @router.post("/logout")
def logout():
    pass
