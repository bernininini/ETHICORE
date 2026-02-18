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
    <div className="mb-4 p-5 bg-muted border border-border rounded-lg animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-foreground" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-foreground rounded-full animate-pulse"></span>
          </div>
          <div>
            <p className="text-sm text-foreground font-bold">LIVE RECORDING</p>
            <p className="text-xs text-muted-foreground">Real-time transcription active</p>
          </div>
        </div>
        <Button
          onClick={onStop}
          variant="destructive"
          size="sm"
        >
          <MicOff className="w-4 h-4 mr-1" />
          Stop
        </Button>
      </div>
      
      {/* Interim transcript preview */}
      {interimTranscript ? (
        <div className="bg-background rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground font-semibold mb-1">Latest words detected:</p>
          <p className="text-sm text-foreground leading-relaxed">
            {interimTranscript}
            <span className="inline-block w-0.5 h-4 bg-foreground ml-1 animate-pulse"></span>
          </p>
        </div>
      ) : (
        <div className="bg-background rounded-lg p-3 border border-border">
          <p className="text-sm text-muted-foreground italic flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
              <span className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
              <span className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
            </span>
            Listening for speech...
          </p>
        </div>
      )}
    </div>
  );
}
