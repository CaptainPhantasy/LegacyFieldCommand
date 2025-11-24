# Legacy Field Command - Mobile Web App

This is the mobile web application for field technicians. It's built as a Progressive Web App (PWA) using Next.js for true cross-platform utilization across all devices and browsers.

## Tech Stack
- **Framework**: Next.js 16 (Web-based)
- **Language**: TypeScript
- **Local Storage**: IndexedDB (via idb library)
- **Backend**: Supabase
- **Deployment**: Web-based (works on iOS, Android, Desktop)

## Key Features
- ✅ Offline-first architecture with IndexedDB
- ✅ Progressive Web App (PWA) support
- ✅ Responsive mobile-first design
- ✅ Guided Workflows (Gates)
- ✅ Photo Capture & Annotation (using web camera APIs)
- ✅ Sync with Supabase
- ✅ Works on all platforms (iOS, Android, Desktop browsers)

## Running Locally

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
npm start
```

## Architecture

### Offline-First Design
- Uses IndexedDB for local data storage
- Syncs with Supabase when online
- Works completely offline after initial sync

### Routing
- Uses Next.js App Router
- Client-side navigation for fast transitions
- Dynamic routes for jobs and gates

### Storage
- **IndexedDB**: Primary local database (jobs, gates, photos metadata)
- **Supabase**: Cloud backend for sync
- **File API**: For photo capture and storage

## Mobile Features

### Camera Integration
- Uses native web camera APIs (`getUserMedia`)
- Supports both camera capture and file selection
- Works on mobile browsers (iOS Safari, Chrome, etc.)

### PWA Support
- Installable on mobile devices
- Works offline after initial load
- Native app-like experience

## Deployment

This web app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any static hosting** (after build)
- **Self-hosted** server

## Migration from Expo

This app was migrated from Expo/React Native to Next.js for:
- ✅ True cross-platform support (one codebase for all platforms)
- ✅ Easier deployment and hosting
- ✅ Better web performance
- ✅ No app store requirements
- ✅ Instant updates without app store approval

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox
- ✅ Samsung Internet

## Notes

- Camera access requires HTTPS in production (or localhost for development)
- IndexedDB is supported in all modern browsers
- PWA features work best on mobile devices
