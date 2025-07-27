#!/bin/bash

# GeoGift Development Start Script (Terminal Version)
# This script opens services in separate terminal windows/tabs

echo "🚀 Starting GeoGift Development Environment..."

# Start PostgreSQL
echo "Starting PostgreSQL database..."
docker-compose up -d

# Wait for PostgreSQL
sleep 3

# Open Backend in new terminal
echo "Starting backend server in new terminal..."
osascript -e 'tell app "Terminal" to do script "cd '"$PWD"' && source venv/bin/activate && cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"'

# Open Frontend in new terminal
echo "Starting frontend server in new terminal..."
osascript -e 'tell app "Terminal" to do script "cd '"$PWD"'/frontend && npm run dev"'

# Display status
echo "
==============================================
✨ GeoGift Development Environment Started! ✨
==============================================

Services starting in separate terminals:
  • PostgreSQL:  http://localhost:5432
  • Backend API: http://localhost:8000
  • Frontend:    http://localhost:3000

API Documentation:
  • Swagger UI:  http://localhost:8000/docs
  • ReDoc:       http://localhost:8000/redoc

To stop all services:
  • Close the terminal windows
  • Run: docker-compose down

Note: Make sure to update your .env files with actual values!
"