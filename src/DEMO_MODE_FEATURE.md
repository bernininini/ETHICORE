# Demo Mode Feature - Camera Fallback

## Overview

The Doctor Bias Detector now includes an **automatic demo mode** that activates when camera permissions are blocked or unavailable. This ensures the app remains fully functional even in restricted environments like Figma Make's preview iframe.

## How It Works

### Automatic Activation

When you click "Start Camera" (in either the Stream 🧠 or Speech 🎙️ tabs), the app will:

1. **Try to access your camera** first
2. **If blocked**: Automatically switch to Demo Mode
3. **Show notification**: "Camera access blocked. Running in demo mode..."

### Visual Indicators

**Demo Mode Active:**
- 🟡 **Amber "DEMO" badge** (instead of red "LIVE")
- Gray placeholder screen with info message
- Status text indicates "Demo Mode"

**Real Camera Active:**
- 🔴 **Red "LIVE" badge**
- Live video feed visible
- Real-time analysis running

## Features in Demo Mode

### Stream 🧠 Tab (StreamVision)
- **Simulated scene descriptions** every 4 seconds
- Realistic medical consultation scenarios:
  - "Doctor reviewing medical charts while maintaining eye contact with patient"
  - "Healthcare provider listening attentively, nodding occasionally during patient consultation"
  - "Medical professional explaining diagnosis using clear hand gestures"
  - "Physician taking notes while patient describes symptoms, showing engaged body language"
  - "Doctor leaning forward slightly, demonstrating active listening posture"

### Speech 🎙️ Tab (FaceDetector)
- **Simulated non-verbal cues** every 5 seconds
- Professional behavior indicators:
  - "Maintaining eye contact"
  - "Neutral facial expression"
  - "Open body posture"
  - "Active listening gestures"
  - "Professional demeanor"
- Cues accumulate during session (shown at bottom of video preview)
- Realistic analysis descriptions

## Why Demo Mode?

### Common Scenarios Where Camera is Blocked:

1. **Figma Make Preview** - Runs in iframe without camera permissions
2. **Corporate Networks** - Some organizations block camera access
3. **Browser Security** - User denied permission or browser policy restricts access
4. **HTTPS Requirements** - Some browsers require secure connection
5. **Device Issues** - Camera already in use, not connected, or disabled

### Benefits:

✅ **Always functional** - Test all features without camera access  
✅ **No errors** - Graceful fallback instead of broken UI  
✅ **Realistic data** - Simulated content matches real-world scenarios  
✅ **Educational** - Shows what the feature would detect  
✅ **Seamless UX** - Clear visual indicators of mode  

## Technical Implementation

### Error Detection
```typescript
catch (error: any) {
  console.error("Camera error:", error);
  setCameraBlocked(true);
  startDemoMode(); // Automatic fallback
}
```

### Demo Data Generation
- **Timed intervals**: Simulates periodic analysis
- **Varied content**: Rotates through different scenarios
- **Realistic format**: Matches actual API response structure
- **State management**: Properly tracks demo vs. live mode

## User Experience Flow

```
User clicks "Start Camera"
         ↓
   Try camera access
         ↓
    ┌────┴────┐
    │         │
Success   Blocked
    │         │
    ↓         ↓
 LIVE     DEMO
 Mode     Mode
```

### In LIVE Mode:
- Real video feed displayed
- Actual frames sent to Reka Vision API
- Red "LIVE" indicator
- Analysis every 2-3 seconds

### In DEMO Mode:
- Placeholder screen shown
- Pre-defined scenarios used
- Amber "DEMO" indicator
- Simulated updates every 4-5 seconds

## Top Banner Alert

When running in an iframe (detected via `window.self !== window.top`), a blue info banner appears:

> 💡 **Running in preview mode:** Camera/microphone features use demo mode if blocked. Use "Upload Audio" or "Written Notes" for full functionality.

This proactively informs users about the environment restrictions.

## Stopping Demo Mode

Clicking "Stop" works the same way:
- Stops simulation interval
- Clears current descriptions
- Resets UI to inactive state
- Can be restarted anytime

## No Configuration Needed

Demo mode is **automatic** - no setup required:
- No flags to set
- No special URLs
- No configuration files
- Just works™

## Real Camera Still Preferred

While demo mode is functional, encourage users to grant camera access when possible:
- More accurate analysis
- Real-time feedback on actual behavior
- Personalized insights
- Actual frame-by-frame detection

See `CAMERA_PERMISSIONS_GUIDE.md` for instructions on enabling camera access.
