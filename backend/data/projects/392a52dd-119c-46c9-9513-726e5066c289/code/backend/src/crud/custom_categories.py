from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import uuid

from backend.src.models.custom_categories import CustomCategory as DBCustomCategory
from backend.src.schemas.custom_categories import CustomCategoryCreate


def create_custom_category_db(db: Session, category: CustomCategoryCreate, created_by_user_id: uuid.UUID):
    """
    Creates a new custom category in the database.
    """
    db_category = DBCustomCategory(
        category_id=uuid.uuid4(),
        family_id=category.family_id,
        name=category.name,
        color=category.color,
        created_by=created_by_user_id
    )
    try:
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except IntegrityError:
        db.rollback()
        raise ValueError("A category with this name might already exist for this family.")
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during category creation: {e}")


def get_custom_categories_by_family_db(db: Session, family_id: uuid.UUID):
    """
    Retrieves all custom categories for a given family ID.
    """
    try:
        return db.query(DBCustomCategory).filter(DBCustomCategory.family_id == family_id).all()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching categories: {e}")

def get_custom_category_by_id_db(db: Session, category_id: uuid.UUID):
    """
    Retrieves a single custom category by its ID.
    """
    try:
        return db.query(DBCustomCategory).filter(DBCustomCategory.category_id == category_id).first()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching category by ID: {e}")

def update_custom_category_db(db: Session, category_id: uuid.UUID, category_update: CustomCategoryCreate):
    """
    Updates an existing custom category in the database.
    """
    db_category = get_custom_category_by_id_db(db, category_id)
    if not db_category:
        return None

    # Ensure the category's family_id matches the one provided in the update payload for consistency
    if db_category.family_id != category_update.family_id:
        raise ValueError("Cannot change the family association of an existing category via update.")

    try:
        db_category.name = category_update.name
        db_category.color = category_update.color
        # Add updated_at timestamp logic if your model has it and it's managed by SQLAlchemy
        db.commit()
        db.refresh(db_category)
        return db_category
    except IntegrityError:
        db.rollback()
        raise ValueError("A category with this name might already exist for this family.")
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during category update: {e}")


def delete_custom_category_db(db: Session, category_id: uuid.UUID):
    """
    Deletes a custom category from the database.
    Returns True if successful, False otherwise.
    """
    db_category = get_custom_category_by_id_db(db, category_id)
    if not db_category:
        return False

    try:
        # Before deleting, check if this category is assigned to any events or tasks.
        # If so, you might want to: 
        # 1. Prevent deletion and return an error.
        # 2. Offer to reassign events/tasks to a default category.
        # 3. Automatically assign events/tasks to a default category (e.g., 'Uncategorized').
        # For now, we assume direct deletion is allowed.
        
        # Example check (requires relationships to be defined in models):
        # if db.query(Event).filter(Event.event_category_id == category_id).count() > 0:
        #     raise ValueError("Cannot delete category: It is currently assigned to events.")
        # if db.query(Task).filter(Task.task_category_id == category_id).count() > 0: # Assuming Task has task_category_id
        #     raise ValueError("Cannot delete category: It is currently assigned to tasks.")

        db.delete(db_category)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during category deletion: {e}")
