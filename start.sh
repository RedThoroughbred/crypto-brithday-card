#!/bin/bash

# GeoGift Development Start Script
# This script starts all services needed for local development

echo "🚀 Starting GeoGift Development Environment..."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Start PostgreSQL with Docker
echo -e "\n${YELLOW}Starting PostgreSQL database...${NC}"
docker-compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PostgreSQL started${NC}"
else
    echo -e "${RED}✗ Failed to start PostgreSQL${NC}"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Activate Python virtual environment and start backend
echo -e "\n${YELLOW}Starting backend server...${NC}"
cd backend
if [ -f "../venv/bin/activate" ]; then
    source ../venv/bin/activate
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ Backend server started on port 8000 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Python virtual environment not found. Please run setup first.${NC}"
    exit 1
fi
cd ..

# Start frontend
echo -e "\n${YELLOW}Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend server started on port 3000 (PID: $FRONTEND_PID)${NC}"
cd ..

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping GeoGift Development Environment..."

# Stop frontend and backend
echo "Stopping services..."
pkill -f "uvicorn app.main:app"
pkill -f "next dev"

# Stop PostgreSQL
docker-compose down

echo "✓ All services stopped"
EOF
chmod +x stop.sh

# Display status
echo -e "\n${GREEN}==============================================
✨ GeoGift Development Environment Started! ✨
==============================================${NC}"
echo -e "
${YELLOW}Services running:${NC}
  • PostgreSQL:  http://localhost:5432
  • Backend API: http://localhost:8000
  • Frontend:    http://localhost:3000

${YELLOW}API Documentation:${NC}
  • Swagger UI:  http://localhost:8000/docs
  • ReDoc:       http://localhost:8000/redoc

${YELLOW}To stop all services:${NC}
  ./stop.sh

${YELLOW}To view logs:${NC}
  • Backend:  tail -f backend/logs/app.log
  • Database: docker-compose logs -f

${YELLOW}Note:${NC}
  Make sure to update your .env files with actual values!
"

# Keep script running and handle shutdown
trap 'echo -e "\n${YELLOW}Shutting down services...${NC}"; ./stop.sh; exit' INT TERM

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID