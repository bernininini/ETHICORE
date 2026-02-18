# ETHICORE

**Cal Hacks 12.0 Submission**

ETHICORE is an AI-powered medical note fairness analysis tool that detects implicit bias in clinical documentation, speech transcriptions, and live video consultations. It helps healthcare professionals identify and correct language that may reflect racial, gender, age, or socioeconomic biases in patient records.

---

## Features

### Multi-Modal Input

- **Notes** -- Upload handwritten medical notes (PDF, JPG, PNG) with OCR-powered text extraction
- **Plain Text** -- Paste or type clinical documentation directly for analysis
- **Speech** -- Live microphone recording with real-time transcription, or upload pre-recorded audio files (MP3, WAV, M4A, WebM, OGG)
- **Stream** -- Real-time video analysis using AI vision to observe facial expressions, gestures, body language, and interaction patterns during consultations

### Bias Detection and Analysis

- Fairness score (0-100%) with visual meter
- Tagged bias categories (e.g., racial bias, gender bias, age bias, socioeconomic bias)
- AI-generated explanation of detected biases
- Suggested rewrite of the original text with biased language removed
- Non-verbal cue detection from video (body language, facial expressions, gestures)

### Additional Capabilities

- Real-time streaming transcription via ElevenLabs API
- Scene-by-scene AI descriptions during live video consultations
- Downloadable stream analysis reports (TXT)
- Local storage for saving analysis history
- Demo mode fallback when camera access is unavailable

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI Components | shadcn/ui, Radix UI, Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase Edge Functions (Hono) |
| AI / ML | OpenAI GPT (bias analysis, scene analysis, OCR), ElevenLabs (speech-to-text) |
| Notifications | Sonner |

---

## Architecture

```
src/
  App.tsx                          -- Main application with input mode switching and analysis display
  components/
    FileUploadCard.tsx             -- Drag-and-drop file upload with OCR text extraction
    StreamVision.tsx               -- Live camera feed with AI scene analysis (with demo mode fallback)
    StreamVisionEnhanced.tsx       -- Extended stream vision with report saving
    FaceDetector.tsx               -- Non-verbal cue detection from video frames
    LiveTranscriptionDisplay.tsx   -- Real-time transcription overlay during speech recording
    FairnessScoreMeter.tsx         -- Circular SVG progress meter for fairness score
    BiasChip.tsx                   -- Tag-style chip for displaying detected bias categories
    ui/                            -- shadcn/ui base components
  utils/
    supabase/
      info.ts                      -- Supabase project credentials
```

### API Endpoints (Supabase Edge Functions)

| Endpoint | Purpose |
|----------|---------|
| `/analyze-bias` | Analyzes text for implicit biases and returns fairness score, detected biases, explanation, and suggested rewrite |
| `/speech-to-text` | Transcribes uploaded audio files to text |
| `/stream-speech-to-text` | Processes audio chunks in real-time for live transcription |
| `/analyze-scene` | Analyzes a video frame and returns a natural language description of the scene |
| `/analyze-video-frame` | Detects non-verbal cues from video frames during speech recording |
| `/extract-text` | Performs OCR on uploaded documents (PDF, JPG, PNG) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

### Build

```bash
npm run build
```

Output is written to the `build/` directory.

---

## Configuration

The app connects to Supabase Edge Functions for all AI processing. The Supabase project ID and anonymous key are configured in `src/utils/supabase/info.ts`.

---

## Team

Built at Cal Hacks 12.0.

---

## License

MIT
