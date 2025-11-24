# Migration Notes: Expo to Next.js

## What Changed

### Framework
- **Before**: Expo/React Native
- **After**: Next.js (Web-based)

### Dependencies Removed
- `expo` and all Expo packages
- `react-native` and React Native packages
- `@react-navigation/native` (replaced with Next.js routing)
- `@nozbe/watermelondb` (replaced with IndexedDB via `idb`)
- `@react-native-async-storage/async-storage` (replaced with browser storage)

### Dependencies Added
- `next` - Next.js framework
- `@supabase/ssr` - Supabase SSR support
- `idb` - IndexedDB wrapper

### Component Changes

#### React Native → Web
- `View` → `div`
- `Text` → `p`, `h1`, `h2`, etc.
- `StyleSheet` → CSS Modules
- `TouchableOpacity` → `button`
- `FlatList` → `div` with `map()`
- `ScrollView` → `div` with CSS overflow

#### Navigation
- React Navigation → Next.js App Router
- `navigation.navigate()` → `router.push()`
- Stack Navigator → File-based routing

#### Storage
- WatermelonDB → IndexedDB (via `idb` library)
- AsyncStorage → Browser localStorage/IndexedDB
- Database models → TypeScript interfaces

#### Camera/Media
- `expo-camera` → Web `getUserMedia` API
- `expo-image-picker` → HTML file input with `capture` attribute

### File Structure Changes

```
Before (Expo):
├── App.tsx
├── index.ts
├── screens/
├── components/
└── db/

After (Next.js):
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── jobs/[jobId]/page.tsx
│   └── gates/
├── components/
├── lib/
│   ├── storage.ts (IndexedDB)
│   ├── sync.ts
│   └── supabase.ts
└── public/
```

### Configuration Files

- `app.json` → No longer needed (Expo config)
- `babel.config.js` → No longer needed
- `next.config.ts` → Added
- `tsconfig.json` → Updated for Next.js

### Assets

- Assets moved to `public/` directory
- `manifest.json` created for PWA
- Icons configured in `app/layout.tsx`

## Benefits of Migration

1. **True Cross-Platform**: One codebase works everywhere
2. **No App Store**: Instant deployment and updates
3. **Better Performance**: Web optimizations
4. **Easier Deployment**: Standard web hosting
5. **No Build Complexity**: No native builds needed
6. **Instant Updates**: No app store approval process

## Remaining Work

- [ ] Test all features on mobile browsers
- [ ] Optimize images and assets
- [ ] Add service worker for offline support
- [ ] Test PWA installation on iOS/Android
- [ ] Add error boundaries
- [ ] Implement photo upload to Supabase Storage

