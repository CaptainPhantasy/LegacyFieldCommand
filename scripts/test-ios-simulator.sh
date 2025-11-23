#!/bin/bash

# iOS Simulator Testing Script for Legacy Field Command
# Tests the app on iPhone 14 simulator with Safari

set -e

echo "🔍 Finding iPhone 14 simulator..."

# Find iPhone 14 simulator UDID
SIMULATOR_UDID=$(xcrun simctl list devices available | grep -i "iPhone 14" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)

if [ -z "$SIMULATOR_UDID" ]; then
    echo "❌ iPhone 14 simulator not found. Available devices:"
    xcrun simctl list devices available | grep -i "iphone"
    exit 1
fi

echo "✅ Found iPhone 14 simulator: $SIMULATOR_UDID"

# Check if simulator is already booted
BOOTED=$(xcrun simctl list devices | grep "$SIMULATOR_UDID" | grep -i "booted" || echo "")

if [ -z "$BOOTED" ]; then
    echo "🚀 Booting simulator..."
    xcrun simctl boot "$SIMULATOR_UDID" 2>/dev/null || echo "Simulator may already be booted"
    sleep 3
else
    echo "✅ Simulator already booted"
fi

# Open Simulator app
echo "📱 Opening Simulator app..."
open -a Simulator

# Wait for simulator to be ready
echo "⏳ Waiting for simulator to be ready..."
sleep 5

# Get the local server URL (default: localhost:8765)
SERVER_URL="${1:-http://localhost:8765}"
echo "🌐 Server URL: $SERVER_URL"

# Check if server is running
if ! curl -s "$SERVER_URL" > /dev/null 2>&1; then
    echo "⚠️  Warning: Server at $SERVER_URL is not accessible"
    echo "   Make sure the dev server is running: npm run dev"
    echo "   Or use ngrok tunnel: npm run tunnel"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Open Safari in simulator with the app URL
echo "🌐 Opening Safari in simulator..."
xcrun simctl openurl "$SIMULATOR_UDID" "$SERVER_URL"

echo ""
echo "✅ Testing setup complete!"
echo ""
echo "📋 Manual Testing Checklist:"
echo "   1. Login with test credentials"
echo "   2. Create a job (if admin) or view assigned jobs (if field tech)"
echo "   3. Complete Arrival gate - take photo"
echo "   4. Complete Intake gate - fill form data"
echo "   5. Close Safari (swipe up or Cmd+Q)"
echo "   6. Reopen Safari and navigate back to the gate"
echo "   7. Verify data persisted (form fields should be filled)"
echo "   8. Complete remaining gates"
echo "   9. Test exception logging"
echo ""
echo "💡 Tips:"
echo "   - Use Safari's developer tools: Safari > Develop > Simulator"
echo "   - Check console for errors"
echo "   - Test camera access (may need to grant permissions)"
echo ""
echo "🛑 To stop: xcrun simctl shutdown $SIMULATOR_UDID"

