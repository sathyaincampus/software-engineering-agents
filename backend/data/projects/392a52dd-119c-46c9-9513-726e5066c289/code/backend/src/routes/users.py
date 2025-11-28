from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import uuid

from backend.src.database import get_db
from backend.src.models import User
from backend.src.schemas import UserSchema, UserCreateSchema # Assuming UserCreateSchema can be used for updates too, or a new schema is created
from backend.src.security import verify_access_token

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserSchema)
def read_users_me(db: Session = Depends(get_db), token_data: dict = Depends(verify_access_token)):
    """
    Get the current logged-in user's profile.
    Requires JWT authentication.
    """
    email = token_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing email claim",
        )
        
    db_user = db.query(User).filter(User.email == email).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user

@router.get("/{user_id}", response_model=UserSchema)
def read_user(user_id: uuid.UUID, db: Session = Depends(get_db), token_data: dict = Depends(verify_access_token)):
    """
    Get a specific user's profile by user_id.
    Requires JWT authentication.
    (Note: Depending on authorization rules, only admins or users within the same family might be able to access other users' profiles).
    """
    # Basic check: Ensure the token is valid. More complex authorization could be added here.
    
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user

# Endpoint to update the current user's profile
# We can use UserCreateSchema for updates if we allow changing password too, 
# or define a specific UpdateUserSchema.
# For now, let's assume we can update display_name and avatar_url.
class UpdateUserSchema(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=100)
    avatar_url: str | None = None

@router.put("/me", response_model=UserSchema)
def update_current_user(user_update: UpdateUserSchema, db: Session = Depends(get_db), token_data: dict = Depends(verify_access_token)):
    """
    Update the current logged-in user's profile.
    Supports updating display_name and avatar_url.
    Requires JWT authentication.
    """
    email = token_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing email claim",
        )
        
    db_user = db.query(User).filter(User.email == email).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update fields if they are provided in the request body
    if user_update.display_name:
        db_user.display_name = user_update.display_name
    if user_update.avatar_url:
        db_user.avatar_url = user_update.avatar_url
        
    db.commit()
    db.refresh(db_user)
    return db_user

# TODO: Implement endpoints for managing family members (adding children, inviting co-parents)
# @router.post("/family")
def add_family_member(...):
#     ...

