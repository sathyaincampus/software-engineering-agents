from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Retrieve database URL from environment variables
# Example: DATABASE_URL="postgresql://user:password@host:port/dbname"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/familyflow_db") 


# Create database engine
engine = create_engine(DATABASE_URL)


# Create a base class for declarative models
Base = declarative_base()


# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# NOTE: Ensure your DATABASE_URL environment variable is set correctly.
# Example for PostgreSQL: export DATABASE_URL="postgresql://postgres:your_password@localhost:5432/your_database_name"
