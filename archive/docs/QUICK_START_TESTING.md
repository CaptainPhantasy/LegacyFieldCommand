# Quick Start - iOS Testing

## Current Situation

✅ **Dev server is already running on port 8765** - You can use it directly!

## Run iOS Simulator Test

Since you're currently in `apps/web`, run the script from the project root:

```bash
# From apps/web directory (where you are now):
../../scripts/test-ios-simulator.sh

# OR navigate to project root first:
cd ../..
./scripts/test-ios-simulator.sh
```

## Alternative: Use Existing Server

If the server is already running, you can skip starting it and just launch the simulator:

```bash
# Find iPhone 14 simulator UDID
xcrun simctl list devices | grep "iPhone 14"

# Boot simulator (replace UDID with actual value)
xcrun simctl boot 4550CD01-5B0A-489A-8F48-A83DB9227EB7

# Open Simulator app
open -a Simulator

# Open Safari with your app (server is already running on 8765)
xcrun simctl openurl 4550CD01-5B0A-489A-8F48-A83DB9227EB7 http://localhost:8765
```

## If You Need to Restart Server

If you want to restart the dev server:

```bash
# Kill the existing process
kill 51604

# Or find and kill by port
lsof -ti:8765 | xargs kill

# Then start fresh
npm run dev
```

## Quick Test Commands

```bash
# Test data persistence
../../scripts/test-data-persistence.sh

# Or from project root:
cd ../..
./scripts/test-data-persistence.sh
```

