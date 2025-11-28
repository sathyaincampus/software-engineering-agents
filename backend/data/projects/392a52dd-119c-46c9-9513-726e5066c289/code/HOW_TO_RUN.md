# How to Run FamilyFlow

This guide provides instructions for setting up and running the FamilyFlow backend and frontend locally.

## Prerequisites

*   **Node.js and npm/yarn:** Ensure you have Node.js and a package manager (npm or yarn) installed.
*   **Docker & Docker Compose:** Required for running PostgreSQL and Redis locally.
*   **Git:** For cloning the repository.

## 1. Project Setup

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Backend Setup (Node.js/Express.js):**
    *   Navigate to the backend directory:
        ```bash
        cd backend
        ```
    *   Install dependencies:
        ```bash
        npm install
        # or
        yarn install
        ```
    *   **Environment Variables:** Create a `.env` file in the `backend` directory based on the `.env.example` file. You'll need to configure:
        *   Database connection details (PostgreSQL)
        *   JWT secret key
        *   Google OAuth client ID and secret
        *   AWS credentials (if using S3 for avatars locally or for testing)
        *   Other service configurations.

3.  **Frontend Setup (React Native):
    *   Navigate to the frontend directory:
        ```bash
        cd ../frontend
        ```
    *   Install dependencies:
        ```bash
        npm install
        # or
        yarn install
        ```
    *   **Environment Variables:** Create an `.env` file in the `frontend` directory based on `.env.example`. Configure:
        *   Backend API base URL (e.g., `http://localhost:3000/api/v1`)
        *   Google OAuth configuration for the client.

## 2. Database Setup (using Docker)

1.  **Navigate to the Docker directory:**
    ```bash
    cd ../docker
    # or create a docker-compose.yml in the root if preferred
    ```

2.  **Start Docker Containers:** Run the following command to start PostgreSQL and Redis:
    ```bash
    docker-compose up -d
    ```

3.  **Database Migrations:** You will need to run database migrations to set up the necessary tables. The specific command depends on your migration tool (e.g., Knex, TypeORM CLI). Execute this from the `backend` directory after starting the database containers:
    ```bash
    # Example using Knex
    npx knex migrate:latest
    # Or using TypeORM CLI
    npx typeorm migration:run
    ```
    *Note: Ensure your `.env` file in the `backend` directory is correctly configured to connect to the Dockerized database.* 

## 3. Running the Application

1.  **Start the Backend Server:**
    *   From the `backend` directory:
        ```bash
        npm run dev
        # or
        yarn dev
        ```
    *   The backend API will typically run on `http://localhost:3000` (or as configured in your `.env` file).

2.  **Start the Frontend Application:**
    *   From the `frontend` directory:
        ```bash
        npm start
        # or
        yarn start
        ```
    *   This command usually launches the React Native packager. You can then run the app on an emulator or a physical device using:
        ```bash
        # For Android
        npm run android
        # or
        yarn android

        # For iOS
        npm run ios
        # or
        yarn ios
        ```

## 4. Stopping the Application

1.  **Stop Backend:** Press `Ctrl + C` in the terminal where the backend server is running.
2.  **Stop Frontend:** Press `Ctrl + C` in the terminal where the React Native packager is running.
3.  **Stop Docker Containers:**
    *   Navigate to the directory containing your `docker-compose.yml` file (if you used a separate one).
    *   Run:
        ```bash
        docker-compose down
        ```

## 5. Key Configurations

*   **Backend `.env`:** Crucial for database connection, JWT secrets, OAuth credentials, and AWS settings.
*   **Frontend `.env`:** Primarily for the backend API URL and client-side OAuth configuration.
*   **Database Migrations:** Ensure these are run after starting the database to set up the schema.

## Troubleshooting

*   **Database Connection Errors:** Verify PostgreSQL credentials in the backend `.env` file and ensure Docker containers are running (`docker-compose ps`).
*   **Authentication Errors:** Check JWT secret key and Google OAuth configurations in both backend and frontend `.env` files.
*   **Port Conflicts:** Ensure no other applications are using the ports configured for the backend (e.g., 3000) or the React Native packager (e.g., 8081).
