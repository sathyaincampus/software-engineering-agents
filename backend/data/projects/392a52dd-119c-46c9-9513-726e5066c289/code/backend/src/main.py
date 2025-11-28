from fastapi import FastAPI
from backend.src.routes.v1 import auth, users, events, tasks, rewards, categories, messages
from fastapi.middleware.cors import CORSMiddleware


# Create database tables if they don't exist
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FamilyFlow API",
    description="API for the FamilyFlow application.",
    version="1.0.0",
)


# CORS Configuration
origins = [
    "http://localhost:3000",  # Allow frontend development server
    "http://localhost:8081",  # Allow Expo development client
    # Add your deployed frontend URLs here
    # "https://your-frontend-domain.com", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],   # Allow all headers
)


# API Versioning: Mount routers under /api/v1
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(events.router, prefix="/api/v1/events")
app.include_router(tasks.router, prefix="/api/v1/tasks")
app.include_router(rewards.router, prefix="/api/v1/rewards")
app.include_router(categories.router, prefix="/api/v1/custom-categories")
app.include_router(messages.router, prefix="/api/v1/messages") # Include messages router


@app.get("/", tags=["Health Check"])
def read_root():
    return {"message": "Welcome to the FamilyFlow API!"}


# Example of setting up SQLAlchemy tables (ensure this runs only once or when needed)
# It's often better to use Alembic for migrations in production
@app.on_event("startup")
def startup_event():
    # This will create tables if they don't exist. Use with caution in production.
    # Consider using a migration tool like Alembic for managing schema changes.
    # Base.metadata.create_all(bind=engine)
    print("FastAPI application started.")

@app.on_event("shutdown")
def shutdown_event():
    print("FastAPI application shut down.")

# To run this application:
# 1. Make sure you have a PostgreSQL database running.
# 2. Install dependencies: pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart passlib[bcrypt] python-jose[cryptography] PyJWT
# 3. Run the server: uvicorn backend.src.main:app --reload
