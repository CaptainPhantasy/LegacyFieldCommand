# Mobile Assets Optimization Guide

## Current Asset Status

The mobile app assets are currently very large:
- **icon.png**: 9.1MB (4096x4096)
- **adaptive-icon.png**: 11MB (4096x4096)
- **splash-icon.png**: 9.1MB (4096x4096)
- **favicon.png**: 9.1MB (4096x4096)

## Recommended Sizes

For optimal performance and app store requirements:

### iOS
- **App Icon**: 1024x1024 (required for App Store)
- **Splash Screen**: Various sizes (Expo handles automatically)

### Android
- **Adaptive Icon**: 1024x1024 foreground (background is solid color)
- **App Icon**: 512x512 minimum

### Web
- **Favicon**: 32x32 to 512x512 (multiple sizes recommended)
- **PWA Icons**: 192x192 and 512x512

## Optimization Recommendations

### Option 1: Use Expo's Asset Generation
Expo can automatically generate optimized assets from source images:

```bash
npx expo-optimize
```

Or configure in `app.json` to let Expo handle resizing automatically.

### Option 2: Manual Optimization
Use image optimization tools to create properly sized versions:

```bash
# Using sips (macOS)
sips -z 1024 1024 assets/icon.png --out assets/icon-1024.png

# Using ImageMagick
convert assets/icon.png -resize 1024x1024 assets/icon-1024.png

# Using sharp (Node.js)
npx sharp-cli -i assets/icon.png -o assets/icon-1024.png --resize 1024 1024
```

### Option 3: Use Online Tools
- [TinyPNG](https://tinypng.com/) - Compress PNG files
- [Squoosh](https://squoosh.app/) - Optimize and resize images
- [ImageOptim](https://imageoptim.com/) - Batch optimization

## Current Configuration

The assets are currently configured in `app.json`:
- ✅ Icon paths are correctly set
- ✅ Splash screen configured
- ✅ Android adaptive icon configured
- ✅ Web favicon configured

## Next Steps

1. **Optimize source assets** to reduce file size (target: <500KB per icon)
2. **Create multiple sizes** if needed for different platforms
3. **Test on devices** to ensure icons display correctly
4. **Update app.json** if using optimized versions with different names

## Notes

- Expo will automatically resize icons for different platforms during build
- Large source files (4096x4096) are acceptable if they're high quality
- Consider using vector graphics (SVG) converted to PNG for better scalability
- The current 4096x4096 size is actually good for source files - Expo will optimize during build

