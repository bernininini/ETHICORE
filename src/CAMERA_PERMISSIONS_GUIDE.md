# Camera Permissions Troubleshooting Guide

## The Error You're Seeing
**NotAllowedError: Permission denied** means your browser is blocking camera access.

## ✅ Good News: Demo Mode Available!

**The app now automatically switches to DEMO MODE when camera access is blocked.** You can still test all features with simulated data:

- **Stream 🧠 tab**: Simulated scene descriptions every 4 seconds
- **Speech 🎙️ tab**: Simulated non-verbal cue detection every 5 seconds
- **All features work**: You can still analyze bias, just without real camera input

Look for the **amber "DEMO" indicator** instead of red "LIVE" when demo mode is active.

## Want to Use Real Camera? Quick Fix Steps

### 1. **Grant Camera Permissions** (Most Common Solution)

#### Chrome/Edge:
1. Look for the camera icon in the address bar (left side, near the URL)
2. Click it
3. Change "Camera" from "Block" to "Allow"
4. Refresh the page
5. Click "Start Camera" again

#### Firefox:
1. Look for the camera icon with a red slash in the address bar
2. Click it
3. Click "Clear This Permission"
4. Refresh the page
5. When prompted, click "Allow" for camera access

#### Safari:
1. Go to Safari menu → Settings → Websites → Camera
2. Find your site in the list
3. Change permission to "Allow"
4. Refresh the page

### 2. **Check System Permissions** (macOS/Windows)

#### macOS:
1. Open System Settings
2. Go to Privacy & Security → Camera
3. Make sure your browser (Chrome, Firefox, Safari) is checked/enabled
4. Restart browser

#### Windows:
1. Open Settings → Privacy & Security → Camera
2. Make sure "Camera access" is ON
3. Make sure "Let apps access your camera" is ON
4. Make sure your browser is allowed
5. Restart browser

### 3. **Camera Already In Use**
If you see "NotReadableError":
- Close other applications using the camera (Zoom, Teams, Skype, etc.)
- Close other browser tabs using the camera
- Try again

### 4. **No Camera Detected**
If you see "NotFoundError":
- Make sure a camera is connected (built-in or USB)
- Try unplugging and reconnecting USB cameras
- Check Device Manager (Windows) or System Information (macOS) to verify camera is detected

### 5. **HTTPS Requirement**
Modern browsers require HTTPS for camera access:
- If testing locally, some browsers allow `localhost`
- For deployed apps, ensure you're using HTTPS
- Check if your preview URL starts with `https://`

## Still Not Working?

### Try a Different Browser
Test with:
- Chrome (usually most compatible)
- Firefox
- Edge
- Safari (on macOS)

### Check Browser Version
Make sure you're using an up-to-date browser version.

### Incognito/Private Mode
Sometimes extensions block camera access. Try:
1. Open an incognito/private window
2. Navigate to your app
3. Grant camera permission when prompted

## Technical Details

The app uses the standard Web APIs:
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
```

This is supported by all modern browsers but requires:
✅ User permission (granted via browser prompt)
✅ HTTPS connection (or localhost)
✅ Camera not in use by another app
✅ System-level camera permissions enabled

## API Keys Status

Your API keys are already configured:
- ✅ REKA_API_KEY (for vision analysis)
- ✅ ELEVENLABS_API_KEY (for speech-to-text)
- ✅ CLAUDE_API_KEY (for bias detection)

The camera permission error is **not** related to API keys - it's a browser security feature.
