#!/bin/bash

# Backend monitoring script
# This script monitors the backend server and restarts it if it goes down

BACKEND_DIR="/home/arpit/Documents/Projects/stocksfafo/backend"
HEALTH_URL="http://localhost:5000/health"
LOG_FILE="/home/arpit/Documents/Projects/stocksfafo/backend/monitor.log"

echo "$(date): Starting backend monitor..." >> "$LOG_FILE"

while true; do
    # Check if backend is responding
    if ! curl -s "$HEALTH_URL" > /dev/null 2>&1; then
        echo "$(date): Backend not responding, restarting..." >> "$LOG_FILE"
        
        # Kill any existing nodemon processes
        pkill -f "nodemon" 2>/dev/null
        sleep 3
        
        # Start backend
        cd "$BACKEND_DIR" && npm run dev >> "$LOG_FILE" 2>&1 &
        
        # Wait for backend to start
        sleep 20
        
        # Check if restart was successful
        if curl -s "$HEALTH_URL" > /dev/null 2>&1; then
            echo "$(date): Backend restarted successfully" >> "$LOG_FILE"
        else
            echo "$(date): Backend restart failed" >> "$LOG_FILE"
        fi
    else
        echo "$(date): Backend is healthy" >> "$LOG_FILE"
    fi
    
    # Wait 30 seconds before next check
    sleep 30
done 