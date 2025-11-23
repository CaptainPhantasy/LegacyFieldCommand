#!/bin/bash

# Data Persistence Testing Script
# Tests that form data persists when browser is closed and reopened

set -e

echo "🧪 Data Persistence Test"
echo "========================"
echo ""

# Find iPhone 14 simulator
SIMULATOR_UDID=$(xcrun simctl list devices available | grep -i "iPhone 14" | head -1 | grep -oE '[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}' | head -1)

if [ -z "$SIMULATOR_UDID" ]; then
    echo "❌ iPhone 14 simulator not found"
    exit 1
fi

SERVER_URL="${1:-http://localhost:8765}"

echo "📋 Test Steps:"
echo "   1. Open app in Safari on iPhone 14 simulator"
echo "   2. Login and navigate to a gate (e.g., Intake)"
echo "   3. Fill in form fields (customer name, phone, loss type, etc.)"
echo "   4. Wait for autosave indicator to show '✓ Draft saved'"
echo "   5. Close Safari completely"
echo "   6. Reopen Safari and navigate back to the same gate"
echo "   7. Verify all form data is still present"
echo ""
echo "🚀 Opening Safari..."
xcrun simctl openurl "$SIMULATOR_UDID" "$SERVER_URL"

echo ""
echo "✅ Safari opened. Please follow the test steps above."
echo "   The autosave should trigger after 2.5 seconds of inactivity."
echo ""
echo "🔍 To verify autosave is working:"
echo "   - Watch for 'Saving...' message in top-right"
echo "   - Should change to '✓ Draft saved' after save completes"
echo ""

