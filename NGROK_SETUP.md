# Ngrok Tunnel Setup

This project includes ngrok tunnel configuration to expose the local development server to the internet.

## Quick Start

### Option 1: Using npm script (from web app directory)
```bash
cd apps/web
npm run tunnel
```

### Option 2: Using the script directly
```bash
./scripts/start-ngrok.sh
```

### Option 3: Using ngrok config file (from project root)
```bash
cd /Volumes/Storage/Custom\ Restore/legacy-field-command
ngrok start web --config ngrok.yml
```

### Stop existing ngrok tunnel
```bash
cd apps/web
npm run tunnel:stop
# or
./scripts/stop-ngrok.sh
```

## Prerequisites

1. **Install ngrok** (if not already installed):
   ```bash
   brew install ngrok/ngrok/ngrok
   # or download from https://ngrok.com/download
   ```

2. **Get your ngrok authtoken** (optional but recommended):
   - Sign up at https://dashboard.ngrok.com
   - Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
   - Add it to `ngrok.yml` or run: `ngrok config add-authtoken YOUR_TOKEN`

## Usage

1. **Start your web server** (in a separate terminal):
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Start the ngrok tunnel** (in another terminal):
   ```bash
   cd apps/web
   npm run tunnel
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`) and use it to:
   - Test webhooks
   - Access your local server from mobile devices
   - Share your local development environment

## Configuration

The ngrok configuration is in `ngrok.yml`:
- **Port**: 8765 (matches the web app's dev server)
- **Protocol**: HTTP with TLS (HTTPS)
- **Inspection**: Enabled (view requests at http://127.0.0.1:4040)

## Ngrok Web Interface

While ngrok is running, you can view all requests and responses at:
- http://127.0.0.1:4040

## Notes

- The tunnel URL changes each time you restart ngrok (unless you have a paid plan with static domains)
- Make sure your web server is running before starting the tunnel
- For production-like testing, consider using ngrok's static domains feature

