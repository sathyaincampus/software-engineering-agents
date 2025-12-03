# Use Python 3.12 (3.14 not yet available in official Docker images)
# Note: Your local environment uses Python 3.14, but we'll use 3.12 for Docker
# as it's the latest stable version available in official images
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Cloud Run uses PORT env var, defaults to 8080)
EXPOSE 8080

# Run the application
# Cloud Run will set PORT env var, but we default to 8080
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
