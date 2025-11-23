#!/bin/bash

# Start ngrok tunnel for the web app (port 8765)
# This exposes the local development server to the internet

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
CONFIG_FILE="$PROJECT_ROOT/ngrok.yml"

PORT=${1:-8765}

echo "Starting ngrok tunnel on port $PORT..."
echo "Make sure your web server is running on port $PORT"
echo ""
echo "To start the web server, run: cd apps/web && npm run dev"
echo ""

# Check if config file exists and has an authtoken
if [ -f "$CONFIG_FILE" ]; then
    # Check if authtoken is set in the config file (not just a comment)
    if grep -q "^authtoken:" "$CONFIG_FILE" && ! grep -q "^authtoken: *#" "$CONFIG_FILE"; then
        AUTHTOKEN=$(grep "^authtoken:" "$CONFIG_FILE" | sed 's/authtoken: *//' | sed 's/#.*$//' | xargs)
        if [ -n "$AUTHTOKEN" ] && [ "$AUTHTOKEN" != "" ]; then
            echo "Using config file: $CONFIG_FILE"
            ngrok start web --config "$CONFIG_FILE"
            exit $?
        fi
    fi
    echo "Config file found but no authtoken set. Using default ngrok config..."
fi

# Fall back to simple http command (uses default ngrok config with authtoken)
echo "Starting ngrok tunnel (using default config)..."
ngrok http $PORT

