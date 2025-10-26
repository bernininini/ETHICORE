# Live Transcription UI Changes Summary

## Visual Overview

### Before (Old Speech Mode)
```
┌─────────────────────────────────────┐
│  ⚠️ Microphone unavailable         │
│  Please use Upload Audio           │
└─────────────────────────────────────┘

      [🎤 Record]        [📤 Upload]
    (Disabled/Gray)    (Primary option)
```

### After (New Live Streaming)
```
┌─────────────────────────────────────┐
│  🎙️ Live Transcription Active      │
│  "Patient presents with chest..."  │
│  ▊ (blinking cursor)                │
└─────────────────────────────────────┘

      [📻 Live]          [📤 Upload]
   (Real-time STT)    (Pre-recorded)
   
   ✨ Pulsing red      ✨ Teal/Cyan
   when recording      highlighted
```

## Component Layout

### Speech Tab - Empty State
```
┌──────────────────────────────────────────────┐
│                                              │
│        Record or upload audio                │
│        Choose an option below                │
│                                              │
│   ┌────────┐         ┌────────┐            │
│   │   📻   │   or   │   📤   │            │
│   │  Live  │         │ Upload │            │
│   │ Record │         │ Audio  │            │
│   └────────┘         └────────┘            │
│  Real-time           Pre-recorded           │
│  transcription       file                   │
│                                              │
│  💡 Live Record for real-time or Upload    │
└──────────────────────────────────────────────┘
```

### During Live Recording
```
┌──────────────────────────────────────────────┐
│  ┌────────────────────────────────────────┐ │
│  │ 🎙️ Live Transcription Active          │ │
│  │ "Patient complains of persistent       │ │
│  │  headache for three days..."▊          │ │
│  └─────────���──────────────────────────────┘ │
│                                              │
│  Live transcript:    [🔴 Stop Recording]    │
│  ┌────────────────────────────────────────┐ │
│  │ Patient complains of persistent        │ │
│  │ headache for three days. Denies fever  │ │
│  │ or visual changes. Vital signs are     │ │
│  │ within normal limits.                  │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### After Recording (Finalized)
```
┌──────────────────────────────────────────────┐
│  Transcribed text:   [Clear & try again]    │
│  ┌────────────────────────────────────────┐ │
│  │ Patient complains of persistent        │ │
│  │ headache for three days. Denies fever  │ │
│  │ or visual changes. Vital signs are     │ │
│  │ within normal limits. Physical exam    │ │
│  │ shows no neurological deficits.        │ │
│  │ [Editable textarea]                    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│        [Analyze Fairness ⚡]                 │
└──────────────────────────────────────────────┘
```

## Button States & Icons

### Live Record Button
| State | Icon | Color | Animation | Label |
|-------|------|-------|-----------|-------|
| Idle | 📻 Radio | Teal | hover:scale | "Live Record" |
| Recording | 🔇 MicOff | Red | pulse + ring | "Stop Recording" |
| Processing | ⏳ Loader | Gray | spin | "Live Record" |

### Upload Button
| State | Icon | Color | Animation | Label |
|-------|------|-------|-----------|-------|
| Idle | 📤 Upload | Cyan | hover:scale | "Upload Audio" |
| Highlighted | 📤 Upload | Cyan | ring glow | "Upload Audio 👈" |
| Disabled | 📤 Upload | Gray | none | "Upload Audio" |

## Color Palette

### Live Transcription Colors
- **Active Box**: `bg-gradient-to-r from-teal-50 to-cyan-50`
- **Border**: `border-teal-300` (2px)
- **Text**: `text-gray-700` (main), `text-teal-700` (labels)
- **Cursor**: `bg-teal-600 animate-pulse`

### Recording States
- **Recording**: `bg-red-500` with `ring-4 ring-red-200`
- **Idle**: `bg-teal-600 hover:bg-teal-700`
- **Disabled**: `bg-gray-400 cursor-not-allowed`

## Animations

### 1. Pulsing Record Button
```css
/* When recording */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Ring effect */
.ring-4 {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
}
```

### 2. Live Transcript Fade-In
```css
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 3. Blinking Cursor
```css
.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  50.1%, 100% { opacity: 0; }
}
```

## Responsive Behavior

### Desktop (lg+)
- Full split-screen layout maintained
- Live transcript box: full width
- Buttons: side-by-side with spacing

### Tablet (md)
- Split-screen becomes stacked
- Live transcript box: full width
- Buttons: side-by-side, smaller

### Mobile (sm)
- Vertical stack layout
- Live transcript box: full width
- Buttons: vertical stack, full width

## Accessibility Features

### ARIA Labels
```html
<button aria-label="Start live recording with real-time transcription">
  <Radio className="w-10 h-10" />
</button>

<div role="status" aria-live="polite" aria-atomic="true">
  {interimTranscript}
</div>
```

### Keyboard Navigation
- `Tab`: Navigate between buttons
- `Enter/Space`: Activate button
- `Escape`: Stop recording (when active)

### Screen Reader Support
- Announces when recording starts
- Reads interim transcripts as they update
- Announces when recording stops

## Error States

### 1. Microphone Blocked (iframe)
```
┌────────────────────────────────────────┐
│ ℹ️ Live microphone access unavailable │
│                                        │
│ Due to iframe security restrictions   │
│ in Figma Make, live microphone        │
│ recording is disabled.                 │
│                                        │
│ ✅ Please use "Upload Audio" instead  │
│                                        │
│ Supported: MP3, WAV, M4A, WebM, OGG   │
│                                   [✕]  │
└────────────────────────────────────────┘
```

### 2. No Microphone Found
```
┌────────────────────────────────────────┐
│ ⚠️ No microphone found                 │
│                                        │
│ Please check that a microphone is      │
│ connected to your device.              │
│                                   [✕]  │
└────────────────────────────────────────┘
```

### 3. Microphone In Use
```
┌────────────────────────────────────────┐
│ ⚠️ Microphone already in use           │
│                                        │
│ Please close other apps using the      │
│ microphone (Zoom, Teams, Discord).     │
│                                   [✕]  │
└────────────────────────────────────────┘
```

## Toast Notifications

### Success Messages
```typescript
toast.success("🎙️ Live recording started - speak now!")
toast.success("Recording stopped")
toast.success("Transcription complete!")
```

### Info Messages
```typescript
toast.info("Processing audio...")
toast.info("Finalizing transcript...")
```

### Warning Messages (Demo Mode)
```typescript
toast.warning("⚠️ Demo Mode: Using pattern-based analysis")
```

### Error Messages
```typescript
toast.error("Microphone access denied")
toast.error("Failed to transcribe audio")
```

## State Transitions

```
┌─────────────┐
│    Idle     │
└──────┬──────┘
       │ Click Live Record
       ↓
┌─────────────┐
│  Recording  │ ← Audio chunks sent every 2s
└──────┬──────┘
       │ Click Stop
       ↓
┌─────────────┐
│ Finalizing  │ ← Move interim → inputText
└──────┬──────┘
       │ Complete
       ↓
┌─────────────┐
│   Ready     │ → Can edit or analyze
└─────────────┘
```

## Developer Notes

### Key State Variables
```typescript
const [isRecording, setIsRecording] = useState(false);
const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
const [interimTranscript, setInterimTranscript] = useState("");
const [inputText, setInputText] = useState("");
```

### Conditional Rendering Logic
```typescript
{!inputText && !interimTranscript ? (
  // Show recording buttons
) : (
  // Show transcript area with live updates
)}
```

### Live Update Flow
```typescript
// 1. Collect audio chunks
mediaRecorder.ondataavailable = (event) => {
  streamChunksRef.current.push(event.data);
};

// 2. Send every 2 seconds
setInterval(() => {
  const blob = new Blob(streamChunksRef.current);
  transcribeStreamingAudio(blob);
}, 2000);

// 3. Update interim display
setInterimTranscript(prev => prev + " " + newText);
```

---

**Last Updated**: October 26, 2025  
**Design System**: Glassmorphism + Teal/White palette  
**Accessibility**: WCAG 2.1 AA compliant
