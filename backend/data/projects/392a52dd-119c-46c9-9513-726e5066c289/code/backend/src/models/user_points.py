from sqlalchemy import Column, Integer, UUID, ForeignKey
from backend.src.database import Base


class UserPoints(Base):
    __tablename__ = "user_points"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), primary_key=True)
    current_points = Column(Integer, nullable=False, default=0)

    # Add relationship if needed, e.g., backref from User model
    # user = relationship("User", back_populates="points")
