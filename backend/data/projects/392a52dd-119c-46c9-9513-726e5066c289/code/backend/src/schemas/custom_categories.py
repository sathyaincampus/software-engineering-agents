from pydantic import BaseModel, Field, validator
import uuid
from datetime import datetime
from typing import Optional


class CustomCategoryBase(BaseModel):
    name: str = Field(..., example="Sports")
    color: str = Field(..., example="#FF5733")


class CustomCategoryCreate(CustomCategoryBase):
    family_id: uuid.UUID

    @validator('color')
    def validate_color_format(cls, v):
        if not (v.startswith('#') and len(v) == 7 and all(c in '0123456789abcdefABCDEF' for c in v[1:])):
            raise ValueError('Color must be a valid hex code (e.g., #RRGGBB)')
        return v


class CustomCategory(CustomCategoryBase):
    category_id: uuid.UUID
    family_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
