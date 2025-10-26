import { Radio, MicOff } from "lucide-react";
import { Button } from "./ui/button";

interface LiveTranscriptionDisplayProps {
  isActive: boolean;
  interimTranscript: string;
  onStop: () => void;
}

export function LiveTranscriptionDisplay({ 
  isActive, 
  interimTranscript, 
  onStop 
}: LiveTranscriptionDisplayProps) {
  if (!isActive) return null;

  return (
    <div className="mb-4 p-5 bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-2 border-teal-400 rounded-xl shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-teal-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          </div>
          <div>
            <p className="text-sm text-teal-800 font-bold">🎙️ LIVE RECORDING</p>
            <p className="text-xs text-teal-600">Real-time transcription active</p>
          </div>
        </div>
        <Button
          onClick={onStop}
          variant="destructive"
          size="sm"
          className="bg-red-500 hover:bg-red-600"
        >
          <MicOff className="w-4 h-4 mr-1" />
          Stop
        </Button>
      </div>
      
      {/* Interim transcript preview */}
      {interimTranscript ? (
        <div className="bg-white/70 rounded-lg p-3 border border-teal-200">
          <p className="text-xs text-teal-700 font-semibold mb-1">Latest words detected:</p>
          <p className="text-sm text-gray-800 leading-relaxed">
            {interimTranscript}
            <span className="inline-block w-0.5 h-4 bg-teal-600 ml-1 animate-pulse"></span>
          </p>
        </div>
      ) : (
        <div className="bg-white/50 rounded-lg p-3 border border-teal-200">
          <p className="text-sm text-gray-500 italic flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
            </span>
            Listening for speech...
          </p>
        </div>
      )}
    </div>
  );
}
