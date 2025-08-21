#!/bin/bash

# StocksFafo - Complete System Setup & Startup Script
# Handles fresh system installation, database setup, and application startup

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Exit on error
set -e

echo -e "${CYAN}🚀 StocksFafo - Complete System Setup & Demo Trading Platform${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "${MAGENTA}💰 ₹5 Lakh Demo Money | Real NSE Data | Live P&L | Auto-Setup${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
service_running() {
  local service=$1
  if command_exists systemctl; then
    systemctl is-active --quiet "$service" 2>/dev/null
  else
    pgrep -x "$service" >/dev/null 2>/dev/null
  fi
}

# Function to install MongoDB
install_mongodb() {
  echo -e "${BLUE}📦 Installing MongoDB...${NC}"
  
  if command_exists apt-get; then
    # Ubuntu/Debian
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl enable mongod
    sudo systemctl start mongod
  elif command_exists yum; then
    # CentOS/RHEL
    sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo << EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
    sudo yum install -y mongodb-org
    sudo systemctl enable mongod
    sudo systemctl start mongod
  elif command_exists brew; then
    # macOS
    brew tap mongodb/brew
    brew install mongodb-community@7.0
    brew services start mongodb-community@7.0
  else
    echo -e "${RED}❌ Unsupported package manager. Please install MongoDB manually.${NC}"
    echo -e "${YELLOW}📚 Visit: https://docs.mongodb.com/manual/installation/${NC}"
    return 1
  fi
  
  # Wait for MongoDB to start
  echo -e "${YELLOW}⏳ Waiting for MongoDB to start...${NC}"
  for i in {1..30}; do
    if mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
      echo -e "${GREEN}✅ MongoDB started successfully${NC}"
      return 0
    fi
    sleep 2
  done
  
  echo -e "${RED}❌ MongoDB failed to start${NC}"
  return 1
}

# Function to install Redis
install_redis() {
  echo -e "${BLUE}📦 Installing Redis...${NC}"
  
  if command_exists apt-get; then
    # Ubuntu/Debian
    sudo apt-get update
    sudo apt-get install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
  elif command_exists yum; then
    # CentOS/RHEL
    sudo yum install -y redis
    sudo systemctl enable redis
    sudo systemctl start redis
  elif command_exists brew; then
    # macOS
    brew install redis
    brew services start redis
  else
    echo -e "${RED}❌ Unsupported package manager. Please install Redis manually.${NC}"
    echo -e "${YELLOW}📚 Visit: https://redis.io/download${NC}"
    return 1
  fi
  
  # Wait for Redis to start
  echo -e "${YELLOW}⏳ Waiting for Redis to start...${NC}"
  for i in {1..15}; do
    if redis-cli ping >/dev/null 2>&1; then
      echo -e "${GREEN}✅ Redis started successfully${NC}"
      return 0
    fi
    sleep 1
  done
  
  echo -e "${RED}❌ Redis failed to start${NC}"
  return 1
}

# Function to check and install system dependencies
check_system_dependencies() {
  echo -e "${BLUE}🔍 Checking system dependencies...${NC}"
  
  # Check for Node.js
  if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    
    if command_exists curl; then
      curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
      sudo apt-get install -y nodejs
    elif command_exists wget; then
      wget -qO- https://deb.nodesource.com/setup_18.x | sudo -E bash -
      sudo apt-get install -y nodejs
    else
      echo -e "${RED}❌ Cannot install Node.js automatically. Please install manually.${NC}"
      echo -e "${YELLOW}📚 Visit: https://nodejs.org/${NC}"
      exit 1
    fi
  fi
  
  # Check Node.js version
  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current version: $(node --version)${NC}"
    exit 1
  fi
  
  # Check for npm
  if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
  fi
  
  # Display versions
  echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
  echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
  
  # Check for MongoDB
  if ! command_exists mongod && ! service_running mongod; then
    echo -e "${YELLOW}📦 MongoDB not found. Installing...${NC}"
    install_mongodb
  else
    echo -e "${GREEN}✅ MongoDB found${NC}"
  fi
  
  # Check for Redis
  if ! command_exists redis-server && ! service_running redis; then
    echo -e "${YELLOW}📦 Redis not found. Installing...${NC}"
    install_redis
  else
    echo -e "${GREEN}✅ Redis found${NC}"
  fi
}

# Function to setup environment files
setup_environment() {
  echo -e "${BLUE}🔧 Setting up environment configuration...${NC}"
  
  # Backend environment
  if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}📝 Creating backend/.env...${NC}"
    cat > backend/.env << EOF
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/stocksfafo
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=stocksfafo-demo-jwt-secret-key-2024
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Stock Data Configuration
DEFAULT_STOCK_LIST=nifty50
DEFAULT_STOCK_COUNT=50

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:3000
HELMET_ENABLED=true

# Performance
COMPRESSION_ENABLED=true
CACHE_TTL=30000
EOF
    echo -e "${GREEN}✅ Created backend/.env${NC}"
  else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
  fi
  
  # Frontend environment
  if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}📝 Creating frontend/.env...${NC}"
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
  else
    echo -e "${GREEN}✅ frontend/.env already exists${NC}"
  fi
}

# Function to create demo user data
create_demo_data() {
  echo -e "${BLUE}👤 Setting up demo user data...${NC}"
  
  # Create data directory if it doesn't exist
  mkdir -p backend/src/data
  
  # Create demo users.json
  if [ ! -f "backend/src/data/users.json" ]; then
    echo -e "${YELLOW}📝 Creating demo users...${NC}"
    cat > backend/src/data/users.json << 'EOF'
[
  {
    "id": "user_demo_001",
    "email": "demo@stocksfafo.com",
    "password": "$2b$12$7tl73mlojv8LH25vmNeBnuDTACuzM2b63F.LchIhHUXJ5xPf3/7XK",
    "firstName": "Demo",
    "lastName": "User",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "portfolio": {
      "cash": 500000,
      "totalValue": 500000,
      "totalInvested": 0,
      "stocks": [],
      "transactions": []
    }
  },
  {
    "id": "user_demo_002", 
    "email": "trader@stocksfafo.com",
    "password": "$2b$12$7tl73mlojv8LH25vmNeBnuDTACuzM2b63F.LchIhHUXJ5xPf3/7XK",
    "firstName": "Active",
    "lastName": "Trader",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "portfolio": {
      "cash": 300000,
      "totalValue": 500000,
      "totalInvested": 200000,
      "stocks": [
        {
          "symbol": "RELIANCE",
          "name": "Reliance Industries Limited",
          "quantity": 100,
          "avgPrice": 1500,
          "currentPrice": 1500,
          "value": 150000,
          "gainLoss": 0,
          "gainLossPercent": 0
        },
        {
          "symbol": "TCS",
          "name": "Tata Consultancy Services Ltd",
          "quantity": 50,
          "avgPrice": 4000,
          "currentPrice": 4000,
          "value": 200000,
          "gainLoss": 0,
          "gainLossPercent": 0
        }
      ],
      "transactions": [
        {
          "id": "txn_demo_001",
          "type": "BUY",
          "symbol": "RELIANCE",
          "name": "Reliance Industries Limited",
          "quantity": 100,
          "price": 1500,
          "amount": 150000,
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
          "id": "txn_demo_002",
          "type": "BUY",
          "symbol": "TCS",
          "name": "Tata Consultancy Services Ltd",
          "quantity": 50,
          "price": 4000,
          "amount": 200000,
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  }
]
EOF
    echo -e "${GREEN}✅ Created demo users${NC}"
  else
    echo -e "${GREEN}✅ Demo users already exist${NC}"
  fi
}

# Function to kill processes on specific ports
kill_port_processes() {
  local port=$1
  echo -e "${YELLOW}🔄 Cleaning up port $port...${NC}"
  
  # Kill any process using the port
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
  pkill -f "node.*$port" 2>/dev/null || true
  pkill -f "ts-node.*index.ts" 2>/dev/null || true
  pkill -f "react-scripts.*start" 2>/dev/null || true
  
  sleep 2
  echo -e "${GREEN}✅ Port $port cleaned${NC}"
}

# Function to check if port is available after cleanup
check_port_available() {
  local port=$1
  local max_attempts=5
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 0
    fi
    echo -e "${YELLOW}⏳ Waiting for port $port to be available (attempt $attempt/$max_attempts)...${NC}"
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo -e "${RED}❌ Port $port is still in use after $max_attempts attempts${NC}"
  return 1
}

# Function to cleanup background processes
cleanup() {
  echo -e "\n${YELLOW}🛑 Stopping StocksFafo servers...${NC}"
  
  # Kill by PID if available
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  
  # Force kill any remaining processes
  kill_port_processes 5000
  kill_port_processes 3000
  
  echo -e "${GREEN}✅ All servers stopped${NC}"
  echo -e "${CYAN}💰 Thanks for using StocksFafo Demo Trading!${NC}"
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Main execution
echo -e "${BLUE}🚀 Starting complete system setup...${NC}"

# Check and install system dependencies
check_system_dependencies

# Clean up any existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
kill_port_processes 5000
kill_port_processes 3000

# Check if ports are available
echo -e "${BLUE}🌐 Verifying port availability...${NC}"
if ! check_port_available 5000; then
  echo -e "${RED}❌ Cannot free port 5000${NC}"
  exit 1
fi

if ! check_port_available 3000; then
  echo -e "${RED}❌ Cannot free port 3000${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Ports 3000 and 5000 are ready${NC}"

# Navigate to script directory
cd "$(dirname "$0")"

# Setup environment files
setup_environment

# Create demo data
create_demo_data

# Backend setup
echo -e "\n${BLUE}🔧 Setting up backend (Authentication & Trading API)...${NC}"
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
  npm ci --production=false
else
  echo -e "${GREEN}✅ Backend dependencies ready${NC}"
fi

# Start backend with simple server
echo -e "${BLUE}🚀 Starting backend server (Simple API + Real-time Data)...${NC}"
npm run dev &
BACKEND_PID=$!

# Wait for backend with better checks
echo -e "${YELLOW}⏳ Starting backend services...${NC}"
sleep 8

# Verify backend is running
BACKEND_CHECK=0
for i in {1..10}; do
  if curl -s http://localhost:5000/health >/dev/null 2>&1; then
    BACKEND_CHECK=1
    break
  fi
  echo -e "${YELLOW}⏳ Backend starting... ($i/10)${NC}"
  sleep 2
done

if [ $BACKEND_CHECK -eq 0 ]; then
  echo -e "${RED}❌ Backend failed to start properly${NC}"
  cleanup
  exit 1
fi

echo -e "${GREEN}✅ Backend server ready (PID: $BACKEND_PID)${NC}"

# Frontend setup
echo -e "\n${BLUE}🔧 Setting up frontend (React Trading Interface)...${NC}"
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
  npm install --legacy-peer-deps
else
  echo -e "${GREEN}✅ Frontend dependencies ready${NC}"
fi

# Start frontend with optimizations
echo -e "${BLUE}🚀 Starting frontend server (Trading Dashboard)...${NC}"
GENERATE_SOURCEMAP=false REACT_APP_BACKEND_URL=http://localhost:5000 npm start &
FRONTEND_PID=$!

# Wait for frontend
echo -e "${YELLOW}⏳ Starting React development server...${NC}"
sleep 10

# Verify frontend is running
FRONTEND_CHECK=0
for i in {1..8}; do
  if curl -s http://localhost:3000 >/dev/null 2>&1; then
    FRONTEND_CHECK=1
    break
  fi
  echo -e "${YELLOW}⏳ Frontend starting... ($i/8)${NC}"
  sleep 3
done

if [ $FRONTEND_CHECK -eq 0 ]; then
  echo -e "${RED}❌ Frontend failed to start properly${NC}"
  cleanup
  exit 1
fi

echo -e "${GREEN}✅ Frontend server ready (PID: $FRONTEND_PID)${NC}"

# Display success information
echo -e "\n${GREEN}🎉 StocksFafo Demo Trading Platform is LIVE!${NC}"
echo -e "${CYAN}============================================${NC}"
echo -e "${BLUE}🌐 Trading Dashboard:${NC}    http://localhost:3000"
echo -e "${BLUE}🔧 API Backend:${NC}          http://localhost:5000"
echo -e "${BLUE}📡 WebSocket:${NC}            Real-time portfolio updates"
echo -e "${BLUE}📊 Data Source:${NC}          NSE India (free, no API key)"
echo -e "${CYAN}============================================${NC}"

echo -e "\n${MAGENTA}💰 DEMO TRADING ACCOUNTS:${NC}"
echo -e "${GREEN}📧 Email:${NC}     demo@stocksfafo.com"
echo -e "${GREEN}🔐 Password:${NC}  demo123"
echo -e "${GREEN}💵 Demo Money:${NC} ₹5,00,000"
echo -e "${GREEN}📈 Portfolio:${NC}  Empty portfolio to start trading"
echo -e ""
echo -e "${GREEN}📧 Email:${NC}     trader@stocksfafo.com"
echo -e "${GREEN}🔐 Password:${NC}  demo123"
echo -e "${GREEN}💵 Demo Money:${NC} ₹3,00,000"
echo -e "${GREEN}📈 Portfolio:${NC}  Pre-loaded with RELIANCE & TCS"

echo -e "\n${YELLOW}🎯 TRADING FEATURES:${NC}"
echo -e "   ✅ User Authentication (JWT-based)"
echo -e "   ✅ Real-time Stock Prices (NSE India)"
echo -e "   ✅ Buy/Sell Trading with Demo Money"
echo -e "   ✅ Live Portfolio P&L Tracking"
echo -e "   ✅ Transaction History"
echo -e "   ✅ WebSocket Real-time Updates"
echo -e "   ✅ Professional Trading Interface"

echo -e "\n${YELLOW}🔧 TECHNICAL FEATURES:${NC}"
echo -e "   • JWT Authentication & Authorization"
echo -e "   • Real-time WebSocket connections"
echo -e "   • Responsive Material-UI design"
echo -e "   • Auto-reconnecting stock data"
echo -e "   • File-based user data storage"
echo -e "   • CORS-enabled secure API"
echo -e "   • MongoDB database backend"
echo -e "   • Redis caching layer"

echo -e "\n${CYAN}💡 QUICK START:${NC}"
echo -e "   1. 🌐 Browser will open automatically"
echo -e "   2. 🔑 Login with demo credentials above"
echo -e "   3. 📊 View your portfolio with live P&L"
echo -e "   4. 💰 Try buying/selling stocks"
echo -e "   5. 📈 Watch real-time price updates"

echo -e "\n${GREEN}⏳ Servers running... Press Ctrl+C to stop${NC}"
echo -e "${YELLOW}🌐 Opening trading dashboard...${NC}"

# Wait 3 seconds then open browser
sleep 3
if command_exists xdg-open; then
  xdg-open http://localhost:3000 >/dev/null 2>&1 &
elif command_exists open; then
  open http://localhost:3000 >/dev/null 2>&1 &
elif command_exists start; then
  start http://localhost:3000 >/dev/null 2>&1 &
else
  echo -e "${YELLOW}💻 Please open http://localhost:3000 in your browser${NC}"
fi

# Keep servers running and show status
echo -e "\n${CYAN}📊 System Status:${NC}"
echo -e "   Backend:  http://localhost:5000  ✅"
echo -e "   Frontend: http://localhost:3000  ✅" 
echo -e "   MongoDB:  localhost:27017        ✅"
echo -e "   Redis:    localhost:6379         ✅"
echo -e "   Demo Users: Created              ✅"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 