#!/bin/bash

# Stop all ngrok processes or a specific one

if [ -z "$1" ]; then
    echo "Stopping all ngrok processes..."
    pkill -f ngrok || echo "No ngrok processes found"
else
    PORT=$1
    echo "Stopping ngrok tunnel on port $PORT..."
    pkill -f "ngrok http $PORT" || echo "No ngrok process found for port $PORT"
fi

