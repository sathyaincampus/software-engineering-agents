from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from backend.src.schemas.custom_categories import CustomCategoryCreate, CustomCategory
from backend.src.crud.custom_categories import (create_custom_category_db, get_custom_categories_by_family_db,
                                                get_custom_category_by_id_db, update_custom_category_db, delete_custom_category_db)
from backend.src.dependencies import get_db, get_current_user
from backend.src.models.users import User

router = APIRouter(
    prefix="/custom-categories",
    tags=["Custom Categories"]
)

@router.post("/", response_model=CustomCategory, status_code=status.HTTP_201_CREATED)
def create_custom_category(
    category: CustomCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new custom category for events or tasks.

    - **family_id**: The ID of the family to which the category belongs.
    - **name**: The name of the category (e.g., "Sports", "Chores", "Study Time").
    - **color**: A hex color code for the category (e.g., "#FF5733").
    """
    # Basic authorization check: ensure the user belongs to the family they are creating a category for.
    # In a more complex system, we might check if the user has permissions to manage categories.
    if current_user.family_id != category.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create categories for this family."
        )

    try:
        return create_custom_category_db(db, category, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/", response_model=List[CustomCategory])
def read_custom_categories(
    family_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a list of all custom categories associated with a specific family.

    - **family_id**: The ID of the family whose categories to retrieve.
    """
    # Authorization check: ensure the user belongs to the family they are requesting categories for.
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view categories for this family."
        )

    custom_categories = get_custom_categories_by_family_db(db, family_id)
    return custom_categories


@router.get("/{category_id}", response_model=CustomCategory)
def read_custom_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a specific custom category by its ID.

    - **category_id**: The unique identifier of the custom category.
    """
    db_category = get_custom_category_by_id_db(db, category_id)
    if db_category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom category not found.")

    # Authorization check: ensure the user belongs to the family of the category.
    if current_user.family_id != db_category.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this custom category."
        )

    return db_category


@router.put("/{category_id}", response_model=CustomCategory)
def update_custom_category(
    category_id: uuid.UUID,
    category_update: CustomCategoryCreate, # Using Create schema for update, assuming all fields can be updated
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates an existing custom category.

    - **category_id**: The unique identifier of the custom category to update.
    - **name**: The new name of the category.
    - **color**: The new hex color code for the category.
    """
    db_category = get_custom_category_by_id_db(db, category_id)
    if db_category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom category not found.")

    # Authorization check: ensure the user belongs to the family of the category being updated.
    if current_user.family_id != db_category.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this custom category."
        )

    # Additionally, ensure the user is trying to update a category within their own family
    if current_user.family_id != category_update.family_id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot change the family association of a category."
        )

    try:
        updated_category = update_custom_category_db(db, category_id, category_update)
        return updated_category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_category_endpoint(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a custom category by its ID.

    - **category_id**: The unique identifier of the custom category to delete.
    """
    db_category = get_custom_category_by_id_db(db, category_id)
    if db_category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom category not found.")

    # Authorization check: ensure the user belongs to the family of the category being deleted.
    if current_user.family_id != db_category.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this custom category."
        )

    try:
        delete_custom_category_db(db, category_id)
        return
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")
