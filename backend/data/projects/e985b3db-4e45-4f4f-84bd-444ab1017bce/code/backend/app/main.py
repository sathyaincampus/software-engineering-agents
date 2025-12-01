import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException

from core.config import settings
from core.redis_client import redis_client # Import the global redis client
from core.logging_config import setup_logging # Import logging setup function
from utils.session_manager import get_session_manager # Import session manager factory

# Setup logging early
logger = setup_logging()

# --- Lifespan management (for FastAPI >= 0.100.0) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Application starting up...")
    logger.info(f"Database URL: {settings.DATABASE_URL}") # Log DB URL (be careful with sensitive info)
    logger.info(f"Redis host: {settings.REDIS_HOST}, port: {settings.REDIS_PORT}")
    
    # Initialize Redis client connection (if not already done globally)
    # The global `redis_client` instance should be sufficient if initialized on import.
    # You can perform a quick check here to ensure connectivity:
    try:
        if not redis_client.client.ping():
            logger.error("Failed to connect to Redis.")
            # Depending on requirements, you might want to raise an exception to prevent startup
            # raise RuntimeError("Could not connect to Redis")
        else:
            logger.info("Successfully connected to Redis.")
    except Exception as e:
        logger.error(f"Error during Redis connection check: {e}")
        # raise RuntimeError(f"Could not connect to Redis: {e}")

    yield
    # Shutdown
    logger.info("Application shutting down...")
    redis_client.close() # Close the Redis connection pool
    logger.info("Redis connection closed.")


# --- FastAPI Application Setup ---
app = FastAPI(
    title="SparkToShip API",
    description="API for the SparkToShip collaboration platform.",
    version="0.1.0",
    lifespan=lifespan # Use the lifespan manager
)

# --- Health Check Endpoint ---
@app.get("/health", tags=["Monitoring"], summary="Health Check")
async def health_check(request: Request):
    """Basic health check endpoint."""
    logger.info("Health check endpoint called.")
    try:
        # Attempt to ping Redis to check its availability
        if not redis_client.client.ping():
            logger.error("Redis is not available.")
            raise HTTPException(status_code=503, detail="Redis is unavailable")
        
        # Add more checks here, e.g., database connectivity
        # try:
        #     async with asyncpg.create_pool(settings.DATABASE_URL) as pool:
        #         async with pool.acquire() as connection:
        #             await connection.execute("SELECT 1")
        # except Exception as db_err:
        #     logger.error(f"Database connection failed: {db_err}")
        #     raise HTTPException(status_code=503, detail="Database is unavailable")

        return {"status": "ok", "message": "Service is healthy"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service is unavailable")

# --- Root Endpoint ---
@app.get("/", tags=["General"], summary="Root Endpoint")
async def read_root():
    """Welcome message for the root endpoint."""
    logger.info("Root endpoint accessed.")
    return {"message": "Welcome to the SparkToShip API!"}

# --- Include Routers --- 
# Example: Import and include routers for different API modules
# from api.v1.endpoints.users import router as user_router
# from api.v1.endpoints.tasks import router as task_router

# app.include_router(user_router, prefix="/api/v1/users")
# app.include_router(task_router, prefix="/api/v1/tasks")

# --- Prometheus Metrics Endpoint (Requires Prometheus client integration) ---
# async def metrics():
#     # This needs to be implemented using a library like prometheus-fastapi-exporter
#     # Example:
#     # from prometheus_fastapi_exporter import PrometheusFastAPIContainer
#     # metrics_app = FastAPI()
#     # PrometheusFastAPIContainer(metrics_app, ...) 
#     pass

# @app.get("/metrics")
# async def get_metrics():
#     # return metrics()
#     return {"message": "Metrics endpoint not yet implemented"}

# --- Middleware Examples ---

# Example: Add a simple request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("x-request-id") # Assuming a request ID is passed
    if not request_id:
        request_id = str(uuid.uuid4()) # Generate one if not present
    
    logger.info(
        f"Request received: {{method}} {{url}}",
        extra={"request_id": request_id, "method": request.method, "url": str(request.url)},
    )
    
    response = await call_next(request)
    
    response_extra_data = {
        "request_id": request_id,
        "status_code": response.status_code,
        "duration_ms": round((time.perf_counter() - request.state.start_time) * 1000) if hasattr(request.state, 'start_time') else 0
    }
    logger.info(
        f"Request processed: {{method}} {{url}} - Status: {{status_code}}",
        extra=response_extra_data
    )
    return response

# --- Add UUID and time for middleware ---
import uuid
import time

# Note: The middleware above needs to capture start time. A simpler version:
@app.middleware("http")
async def log_requests_simple(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = (time.perf_counter() - start_time) * 1000
    logger.info(f"Processed {request.method} {request.url.path} in {process_time:.2f}ms", extra={"method": request.method, "path": request.url.path, "status_code": response.status_code, "duration_ms": process_time})
    return response

# Re-registering the middleware after defining logger correctly
app.middleware_stack.clear()
app.add_middleware(log_requests_simple)

# You would typically have routers defined in separate files (e.g., api/v1/endpoints/)
# and include them here.

# Example of adding routers if they exist:
# from api.v1.endpoints.items import router as items_router
# app.include_router(items_router, prefix="/api/v1/items")

# --- Startup Event for Logging Setup (if not using lifespan) ---
# @app.on_event("startup")
# async def startup_event():
#     setup_logging() # Ensure logging is set up on startup
#     logger.info("Application starting up...")
#     # Initialize other services like Redis connection pool here if needed

# --- Shutdown Event for Cleanup (if not using lifespan) ---
# @app.on_event("shutdown")
# async def shutdown_event():
#     logger.info("Application shutting down...")
#     redis_client.close() # Close Redis connection
