#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd backend
# Check if venv exists, else create it (optional, assuming user manages env)
# python3 -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt
uvicorn app.main:app --reload --port 8050 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT

wait
