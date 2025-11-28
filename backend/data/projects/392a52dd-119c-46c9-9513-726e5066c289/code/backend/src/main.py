from fastapi import FastAPI
from backend.src.routes import auth, users # Import other routers as needed
from backend.src.database import engine, Base

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ZeroToOne AI FamilyFlow API",
    description="API for managing family schedules, tasks, and rewards.",
    version="0.1.0",
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1") # Assuming users router will handle user profile operations

# Add health check endpoint
@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok"}

# TODO: Add JWT dependency to protect routes
# TODO: Implement Google Sign-In callback endpoint
