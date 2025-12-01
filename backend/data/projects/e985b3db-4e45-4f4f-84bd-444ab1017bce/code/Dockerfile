# Use an official Python runtime as a parent image
FROM python:3.11-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the pyproject.toml and poetry.lock file into the container
# Use poetry for dependency management
COPY pyproject.toml poetry.lock* ./ 

# Install dependencies using poetry
# Use a multi-stage build or install production dependencies only for smaller image size
# For development, 'poetry install' includes dev dependencies. For production, consider 'poetry install --no-dev'
# Ensure build tools are available if needed for dependency compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies, excluding development ones for production image
RUN poetry config virtualenvs.create false && poetry install --no-dev --no-interaction --no-ansi

# Copy the rest of the application code into the container at /app
# This is done after installing dependencies to leverage Docker cache more effectively
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Run the application using uvicorn (FastAPI's ASGI server)
# For production, it's recommended to use a production-grade ASGI server like gunicorn with uvicorn workers
# Example using gunicorn:
# CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]

# For development and simpler deployments, uvicorn is sufficient
# The --reload flag is useful for development to automatically restart on code changes
# Remove --reload for production builds.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 
