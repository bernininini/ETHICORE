# Quick Start Guide - Live Speech Transcription

## 🚀 Getting Started in 3 Steps

### 1️⃣ Set Up Environment Variables
```bash
# Add to your .env file or Supabase environment
ELEVENLABS_API_KEY=your_actual_api_key_here
```

### 2️⃣ Test in Browser
```
1. Open the app in a NEW BROWSER TAB (not in Figma iframe)
2. Click the "🎙️ Speech" tab
3. Click the "Live Record" button (📻 icon)
4. Allow microphone access when prompted
5. Start speaking!
```

### 3️⃣ Watch the Magic Happen
```
✨ Your words appear in real-time as you speak
✨ Interim transcript shows in a teal box with blinking cursor
✨ Click "Stop Recording" to finalize
✨ Edit if needed, then click "Analyze Fairness"
```

---

## 🎤 How to Use Live Recording

### Step-by-Step
1. **Select Mode**: Click "🎙️ Speech" tab
2. **Start Recording**: Click the Radio button (📻)
3. **Grant Permission**: Allow microphone access (first time only)
4. **Speak Clearly**: Talk into your microphone at normal speed
5. **See Live Updates**: Watch text appear every 2 seconds
6. **Stop When Done**: Click the red "Stop Recording" button
7. **Review & Edit**: Check the transcript, make corrections if needed
8. **Analyze**: Click "Analyze Fairness" to check for bias

### Pro Tips 💡
- Speak clearly and at a moderate pace
- Avoid background noise for better accuracy
- Pause briefly between sentences
- The transcript updates every 2 seconds
- You can edit the final transcript before analyzing

---

## 🔧 Troubleshooting

### Problem: "Microphone access denied"
**Solution 1**: Click the 🔒 lock icon in your browser address bar
- Find "Microphone" in the dropdown
- Change from "Block" to "Allow"
- Refresh the page
- Try again

**Solution 2**: If in Figma Make (iframe)
- Live recording won't work due to browser security
- This is expected behavior
- Use the "Upload Audio" button instead
- Upload a pre-recorded audio file

### Problem: "No microphone found"
**Check**:
- Microphone is plugged in (for external mics)
- Microphone is not muted in system settings
- No other app is using the microphone (Zoom, Teams, etc.)
- Browser has permission to access microphone

### Problem: "Nothing is transcribing"
**Solutions**:
1. Check microphone volume in system settings
2. Test microphone in another app
3. Try stopping and starting recording again
4. Refresh the page and grant permission again
5. Check browser console for error messages

### Problem: "Demo mode active"
**Cause**: ElevenLabs API key is missing or invalid

**Fix**:
```bash
# Add your API key
ELEVENLABS_API_KEY=sk-your-key-here

# Restart the server
# Refresh the page
```

---

## 🌐 Environment Compatibility

### ✅ Works Perfectly
- Chrome (desktop) - **Recommended**
- Edge (desktop)
- Firefox (desktop)
- Safari (desktop/mobile)
- Any browser in standalone tab

### ⚠️ Limited Functionality
- Figma Make (iframe) - **Upload only**
- Embedded iframes - **Upload only**
- Older browsers - **May not support**

### ❌ Not Supported
- Internet Explorer
- Very old mobile browsers

---

## 📊 API Usage & Costs

### ElevenLabs Pricing (as of 2025)
- **Free Tier**: 10,000 characters/month
- **Paid Plans**: Starting at $5/month

### Cost Estimation
```
Average speaking rate: ~150 words/minute
Average word length: ~5 characters
1 minute of speech ≈ 750 characters

Free tier supports: ~13 minutes of recording/month
```

### Optimizing Costs
1. **Use Upload Mode** for longer recordings (batch processing)
2. **Stop Early** if you make a mistake (don't waste API calls)
3. **Monitor Usage** in ElevenLabs dashboard
4. **Test in Demo Mode** first (no API calls)

---

## 🎨 Understanding the UI

### Visual Indicators

| Icon | Meaning |
|------|---------|
| 📻 Radio (Teal) | Ready to record |
| 📻 Radio (Red, Pulsing) | Recording in progress |
| ⏳ Spinner | Processing audio |
| 📤 Upload (Cyan) | Upload audio file |
| 🎙️ Microphone | Live transcription active |
| ▊ Blinking cursor | Waiting for speech |

### Color Codes
- **Teal/Cyan**: Primary actions, live mode
- **Red**: Recording active, stop button
- **Gray**: Disabled/unavailable
- **Purple**: Information messages
- **Green**: Success states
- **Amber**: Warnings

---

## 📱 Mobile Usage

### On Mobile Devices
1. Open in mobile Safari or Chrome
2. Tap "🎙️ Speech" tab
3. Tap "Live Record" button
4. Allow microphone access
5. Hold phone ~6 inches from mouth
6. Speak clearly and loudly
7. Tap "Stop Recording" when done

### Mobile Tips
- Use in quiet environment
- Speak louder than normal
- Hold phone steady
- Avoid wind/background noise

---

## 🔐 Privacy & Security

### What Gets Sent to ElevenLabs
- Audio chunks (every 2 seconds)
- No personal identifiable information
- No stored transcripts on their servers

### What Stays Local
- Final transcripts (localStorage)
- Bias analysis results (localStorage)
- User preferences
- All metadata

### Data Flow
```
Your Voice → Browser → Supabase Server → ElevenLabs API
                ↓
          Transcript Text
                ↓
    Browser localStorage (saved)
```

---

## ⚡ Performance Tips

### For Best Results
1. **Close Unused Apps** that might use microphone
2. **Use Wired Mic** for better quality (if available)
3. **Reduce Background Noise** (close windows, turn off fans)
4. **Speak in Chunks** (pause between sentences)
5. **Monitor Network** (stable internet required)

### If Experiencing Lag
1. Reduce chunk send frequency (edit code: 2s → 3s)
2. Close other browser tabs
3. Check internet speed (need >1 Mbps upload)
4. Try uploading pre-recorded file instead

---

## 🧪 Testing the Feature

### Manual Test Checklist
```
□ Click "Speech" tab
□ Click "Live Record" button
□ Allow microphone permission
□ Speak a test phrase
□ Verify text appears in teal box
□ Wait 2-3 seconds for update
□ Speak another phrase
□ Verify new text is added
□ Click "Stop Recording"
□ Verify text moves to textarea
□ Edit the text manually
□ Click "Analyze Fairness"
□ Verify bias analysis appears
```

### Test Phrases
Use these medical note samples:
```
"Patient presents with chief complaint of chest pain 
for the past two hours. Denies shortness of breath. 
Vital signs are stable. Physical exam unremarkable."

"The patient is a 45-year-old presenting with 
persistent headache. Denies visual changes or nausea. 
Blood pressure 120 over 80. Plan to prescribe 
acetaminophen and follow up in one week."
```

---

## 🆘 Getting Help

### Check Browser Console
1. Press `F12` or `Cmd+Option+I`
2. Click "Console" tab
3. Look for error messages
4. Share errors when asking for help

### Common Error Messages
```javascript
// Permission denied
"Error name: NotAllowedError"
→ Grant microphone permission

// No microphone
"Error name: NotFoundError"  
→ Check microphone is connected

// Microphone in use
"Error name: NotReadableError"
→ Close other apps using mic

// Network error
"Failed to fetch"
→ Check internet connection
```

### Support Resources
- Check `/LIVE_TRANSCRIPTION_README.md` for details
- Review `/UI_CHANGES_SUMMARY.md` for UI guide
- See browser console for technical errors
- Test in demo mode to isolate API issues

---

## 📚 Next Steps

### After Recording
1. **Review Transcript** - Check for accuracy
2. **Edit as Needed** - Fix any transcription errors
3. **Analyze for Bias** - Click "Analyze Fairness"
4. **Review Results** - Check fairness score
5. **Use Suggested Rewrite** - Apply recommendations
6. **Save Analysis** - Stored automatically in localStorage

### Advanced Usage
- Combine live recording with manual edits
- Use upload mode for longer recordings
- Compare different phrasing approaches
- Track improvements over time via saved analyses

---

**Version**: 2.0.0  
**Last Updated**: October 26, 2025  
**Status**: Production Ready ✅

**Happy Recording! 🎙️✨**
