# SparkToShip - How to Run Locally

This guide explains how to set up and run the SparkToShip application locally using Docker and Docker Compose.

## Prerequisites

*   **Docker:** Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).
*   **Docker Compose:** Included with Docker Desktop.
*   **Python:** Version 3.9+ recommended.
*   **Poetry:** Install Poetry for Python dependency management: `pip install poetry`.
*   **Node.js & npm:** Install Node.js (LTS recommended) and npm from [nodejs.org](https://nodejs.org/).
*   **Git:** For cloning the repository.

## Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/sparktoship.git
cd sparktoship
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory of the project based on the example provided.

```bash
cp .env.example .env
```

Edit the `.env` file and update the following settings:

*   **`SECRET_KEY`**: Generate a strong, unique secret key for your local environment.
*   **`DATABASE_URL`**: Ensure it points to the PostgreSQL service within Docker Compose (default: `postgresql://postgres:password@localhost:5432/sparktoship_db`).
*   **`REDIS_HOST`**: Ensure it points to the Redis service (default: `redis`).
*   **`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`**: These are primarily for cloud deployments but might be needed if certain backend features are enabled locally. You can often leave them blank or use placeholder values for local development unless specifically required.
*   **`LOG_LEVEL`**: Set to `DEBUG` for more verbose logs during development.

### 3. Install Backend Dependencies

Navigate to the `backend/` directory and install dependencies using Poetry:

```bash
cd backend
poetry install
cd ..
```

*(Note: If `poetry install` fails due to missing build tools for certain packages, you might need to install `build-essential` on Debian/Ubuntu systems: `sudo apt-get update && sudo apt-get install build-essential`)*

### 4. Install Frontend Dependencies

Navigate to the `frontend/` directory and install dependencies using npm (or yarn):

```bash
cd frontend
npm install
# or yarn install
cd ..
```

### 5. Start Services with Docker Compose

Run the following command from the root directory to start the backend, database, and Redis services:

```bash
docker compose up -d
```

*   `-d` runs the containers in detached mode (in the background).
*   This command builds the Docker images if they don't exist and starts the containers defined in `docker-compose.yml`.

### 6. Run Backend Migrations (If applicable)

If your backend uses a database migration tool (like Alembic), apply the migrations:

```bash
# Ensure you are in the backend/ directory or adjust the path
cd backend
poetry run alembic upgrade head
cd ..
```

*(This step assumes migrations are set up. If not, the initial schema might be created automatically or require manual SQL execution.)*

### 7. Start the Backend Development Server

FastAPI runs using Uvicorn. The `Dockerfile` and `docker-compose.yml` are configured to start it automatically. If you need to start it manually (e.g., if not using `docker compose up`), you can run:

```bash
# From the backend/ directory
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API should be accessible at `http://localhost:8000`.

### 8. Start the Frontend Development Server

Navigate to the `frontend/` directory and start the React development server:

```bash
cd frontend
npm start
# or yarn start
```

The frontend application should be accessible at `http://localhost:3000` (or another port if 3000 is in use).

### 9. Accessing Services

*   **Backend API:** `http://localhost:8000`
*   **Frontend:** `http://localhost:3000`
*   **PostgreSQL:** Accessible via the `DATABASE_URL` in your `.env` file (connecting to the `db` service container). Use tools like `psql` or DBeaver.
*   **Redis:** Accessible via the `REDIS_HOST` and `REDIS_PORT` in your `.env` file (connecting to the `redis` service container). Use `redis-cli`.
*   **Prometheus:** `http://localhost:9090` (if monitoring is running)
*   **Grafana:** `http://localhost:3000` (default login: admin / admin_password_change_me - change this in `monitoring/docker-compose.yml`)

### Stopping Services

To stop the Docker containers:

```bash
docker compose down
```

To stop and remove the containers, networks, and volumes:

```bash
docker compose down -v
```

## Troubleshooting

*   **Container Issues:** Check Docker logs using `docker compose logs <service_name>` (e.g., `docker compose logs backend`).
*   **Port Conflicts:** Ensure no other applications are using ports 8000, 5432, 6379, 9090, or 3000 locally.
*   **Dependency Errors:** Double-check that all prerequisites are installed and that you ran `poetry install` and `npm install` correctly.
*   **`.env` File:** Ensure the `.env` file is correctly configured and located in the project root.
