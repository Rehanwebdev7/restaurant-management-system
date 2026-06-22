#!/bin/bash
# Script to start both backend and frontend servers

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================="
echo "Restaurant Management System (RMS) Starter"
echo "========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Run Spring Boot backend in background
echo "🚀 Starting Spring Boot Backend (Port 8091)..."
mvn spring-boot:run &
BACKEND_PID=$!

# Function to handle shutdown of backend when script is stopped
cleanup() {
  echo ""
  echo "🛑 Stopping backend server (PID $BACKEND_PID)..."
  kill $BACKEND_PID || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# Run React frontend
echo "🚀 Starting React Frontend (Port 3000)..."
cd frontend
npm start

# Wait for backend to finish (if frontend exits)
wait $BACKEND_PID
