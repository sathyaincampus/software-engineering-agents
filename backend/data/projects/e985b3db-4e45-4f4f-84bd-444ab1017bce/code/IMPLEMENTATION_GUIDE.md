# SparkToShip - Implementation Guide

This guide provides detailed information for developers working on the SparkToShip project, covering development environment setup, coding standards, testing, and deployment practices.

## Table of Contents

1.  [Development Environment Setup](#1-development-environment-setup)
2.  [Backend Development](#2-backend-development)
    *   [Project Structure](#project-structure)
    *   [Coding Standards](#coding-standards)
    *   [Dependencies](#dependencies)
    *   [Database Migrations](#database-migrations)
    *   [Testing](#testing)
    *   [Logging](#logging)
    *   [Configuration](#configuration)
3.  [Frontend Development](#3-frontend-development)
    *   [Project Structure](#frontend-project-structure)
    *   [State Management](#state-management)
    *   [Component Design](#component-design)
    *   [API Integration](#api-integration)
    *   [Testing](#frontend-testing)
4.  [API Design & Documentation](#4-api-design--documentation)
5.  [Containerization](#5-containerization)
6.  [CI/CD Pipeline](#6-ci-cd-pipeline)
7.  [Deployment](#7-deployment)
8.  [Monitoring & Alerting](#8-monitoring--alerting)

---

## 1. Development Environment Setup

Ensure you have the following tools installed:

*   **Docker & Docker Compose:** For containerizing the application and its dependencies.
*   **Python:** Version 3.9+ recommended. Using a virtual environment (like `venv` or `conda`) is highly encouraged.
*   **Poetry:** For managing Python dependencies and packaging (`pip install poetry`).
*   **Node.js & npm/yarn:** For frontend development. Ensure you have a compatible Node.js version (e.g., LTS).
*   **Git:** For version control.

Detailed setup instructions can be found in `HOW_TO_RUN.md`.

---

## 2. Backend Development

### Project Structure

The backend code is located in the `backend/app/` directory.

*   `api/`: Contains API routing definitions and endpoint logic.
    *   `v1/`: Version 1 of the API.
        *   `endpoints/`: Contains the logic for specific resources (tasks, users, etc.).
        *   `deps.py`: Dependency injection definitions (e.g., getting DB sessions).
*   `core/`: Core application components like configuration, logging, security, Redis client.
*   `models/`: SQLAlchemy ORM models representing database tables.
*   `schemas/`: Pydantic models for request/response validation and serialization.
*   `utils/`: Utility functions (e.g., caching, session management, email helpers).
*   `db/`: Database session management and migration scripts (if applicable).
*   `main.py`: FastAPI application instance setup.
*   `tests/`: Unit and integration tests.

### Coding Standards

*   **Language:** Python 3.9+
*   **Formatting:** Adhere to **Black**'s style guide. Run `poetry run black .` to format code.
*   **Linting:** Use **Flake8** for code quality checks. Run `poetry run flake8`.
*   **Type Hinting:** Use type hints extensively for better code clarity and maintainability. MyPy can be used for static type checking (`poetry run mypy .`).
*   **Docstrings:** Write clear and concise docstrings for all modules, classes, and functions following PEP 257.
*   **Security:** Never commit sensitive information (API keys, passwords) directly. Use `.env` files and environment variables. Run Bandit for security vulnerability checks (`poetry run bandit -r . -x tests/`).

### Dependencies

Dependencies are managed using **Poetry**. Install them using:

```bash
poetry install
```

For development with extra tools (like testing dependencies), use:

```bash
poetry install --with dev
```

### Database Migrations

*(Note: This section assumes a migration tool like Alembic is used. If not, manual SQL scripts or ORM-generated schema updates will be used.)*

Migrations should be managed to handle schema changes.

1.  **Create a new migration:**
    ```bash
    poetry run alembic revision -m "Your migration description"
    ```
2.  **Apply migrations:**
    ```bash
    poetry run alembic upgrade head
    ```

*Database connection details should be configured via the `DATABASE_URL` environment variable.*

### Testing

*   **Framework:** Pytest
*   **Location:** `backend/tests/`
*   **Running Tests:**
    ```bash
    poetry run pytest
    ```
*   **Coverage:** Generate a coverage report:
    ```bash
    poetry run pytest --cov=app --cov-report=term-missing
    ```
*   **Environment:** Ensure your test environment (e.g., database connection) is properly configured, potentially using a separate `.env.test` file or environment variables.

### Logging

*   **Configuration:** Configured in `backend/app/core/logging_config.py`.
*   **Format:** Supports JSON (default) and plain text formats, controlled by the `LOG_FORMAT` environment variable.
*   **Levels:** Configurable via the `LOG_LEVEL` environment variable (DEBUG, INFO, WARNING, ERROR, CRITICAL).
*   **Output:** Logs are directed to `stdout`, which is standard practice for containerized applications.

### Configuration

*   Configuration is managed via environment variables, loaded from a `.env` file during local development.
*   The `core/config.py` module uses Pydantic's `BaseSettings` to load and validate settings.
*   Sensitive information (like `SECRET_KEY`, database passwords) should **never** be committed to the repository. Use `.env` files locally and manage secrets securely in production environments (e.g., environment variables on the server, AWS Secrets Manager).

---

## 3. Frontend Development

### Frontend Project Structure

*(Refer to the `README.md` for the general project structure. The frontend code is typically within `frontend/src/`.)*

*   `components/`: Reusable UI components.
*   `pages/`: Components representing application views/pages.
*   `hooks/`: Custom React Hooks (e.g., `useApi`).
*   `services/`: API service layer abstractions.
*   `store/` or `state/`: Redux Toolkit setup (slices, store configuration).
*   `types/`: TypeScript interface definitions.
*   `utils/`: Frontend utility functions.
*   `assets/`: Static assets like images, fonts.

### State Management

*   **Tool:** Redux Toolkit
*   **Usage:** Manage global application state, including user authentication, fetched data, UI state, etc.
*   **Structure:** Organize slices (reducers, actions) logically, often by feature or domain.

### Component Design

*   **Framework:** React
*   **UI Library:** Material UI (MUI)
*   **Standards:**
    *   Use functional components with Hooks.
    *   Follow consistent naming conventions.
    *   Break down complex components into smaller, reusable pieces.
    *   Utilize TypeScript for type safety.
    *   Write PropTypes or use TypeScript interfaces for prop validation.

### API Integration

*   **Library:** Axios (or native `fetch`) is typically used for making API requests.
*   **Structure:** Define API service functions in `src/services/` or use custom hooks like `useApi`.
*   **Authentication:** JWT tokens should be managed (stored, refreshed) and included in API requests.
*   **Error Handling:** Implement consistent error handling for API calls, providing user feedback.

### Frontend Testing

*   **Framework:** Jest, React Testing Library
*   **Location:** Typically co-located with components or in a dedicated `src/__tests__/` directory.
*   **Scope:** Test component rendering, user interactions, and state changes.
*   **Mocking:** Mock API calls and external dependencies.

---

## 4. API Design & Documentation

*   **Framework:** FastAPI
*   **Style:** RESTful principles.
*   **Data Format:** JSON
*   **Documentation:** FastAPI automatically generates OpenAPI (Swagger UI) documentation. Access it at `/docs`.
*   **Key Principles:** Clear resource naming, consistent response structures, proper HTTP status codes, versioning (e.g., `/api/v1/`).

---

## 5. Containerization

*   **Tool:** Docker
*   **Backend:** `Dockerfile` in the `backend/` directory defines the image for the FastAPI application.
*   **Development:** `docker-compose.yml` orchestrates the backend, PostgreSQL, and Redis services for local development.
*   **Configuration:** Environment variables (`.env` file) manage service configurations.

---

## 6. CI/CD Pipeline

*   **Platform:** GitHub Actions
*   **Configuration:** Defined in `.github/workflows/ci.yml`.
*   **Stages:**
    1.  **Checkout:** Get the source code.
    2.  **Backend Setup & Test:** Install dependencies, run linters (Black, Flake8, Bandit), run tests (Pytest), generate coverage report.
    3.  **Frontend Setup & Test:** Setup Node.js, install dependencies, run linters (ESLint), run tests (Jest/RTL), build the frontend artifact.
    4.  **Deploy Staging:** On push to `main`, deploy backend and frontend to the staging environment (e.g., using AWS CLI, `kubectl`).
    5.  **Deploy Production:** (Optional) Triggered manually or by tags/releases, deploys to the production environment.
*   **Secrets:** Sensitive information (AWS credentials, API keys) should be stored in GitHub Secrets.

---

## 7. Deployment

*   **Cloud Provider:** AWS
*   **Core Services:** EC2/ECS (for backend containers), RDS (PostgreSQL), ElastiCache (Redis), S3 (for attachments/static assets).
*   **Infrastructure as Code:** Terraform is used for provisioning and managing AWS resources. See the `terraform/` directory.
*   **Deployment Strategy:** Typically involves building Docker images, pushing them to a container registry (like ECR), and deploying them to ECS/EKS or updating EC2 instances. Frontend static files are often served from S3 via CloudFront.

---

## 8. Monitoring & Alerting

*   **Tools:** Prometheus (metrics collection), Grafana (visualization and dashboards).
*   **Setup:** Docker Compose configuration in `monitoring/`.
*   **Metrics:**
    *   **Backend:** Expose application-level metrics (e.g., request count, latency, error rates) via a `/metrics` endpoint (requires integration with a Prometheus client library like `prometheus-client`).
    *   **System:** Use exporters like `node-exporter` (for EC2 instance metrics), `postgres_exporter`, `redis_exporter`.
*   **Dashboards:** Create Grafana dashboards to visualize key metrics.
*   **Alerting:** Configure Alertmanager (integrated with Prometheus) to set up alerts based on defined rules.

---
