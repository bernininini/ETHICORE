import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Camera, CameraOff, Video } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface FaceDetectorProps {
  onCuesDetected: (cues: string[], analysis: string) => void;
  isRecording: boolean;
}

export function FaceDetector({ onCuesDetected, isRecording }: FaceDetectorProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [allDetectedCues, setAllDetectedCues] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Stop camera when recording stops
  useEffect(() => {
    if (!isRecording && isCameraActive) {
      stopCamera();
    }
  }, [isRecording]);

  const startCamera = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsCameraActive(true);
      toast.success("Camera activated for non-verbal analysis");
      
      // Start analyzing frames every 3 seconds
      intervalRef.current = window.setInterval(() => {
        captureAndAnalyzeFrame();
      }, 3000);
      
    } catch (error: any) {
      console.error("📹 Camera access denied:", error.name || error.message);
      
      // Show appropriate error message
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Camera access denied. Please allow camera access in your browser settings.", {
          duration: 5000
        });
      } else if (error.name === "NotFoundError") {
        toast.error("No camera found. Please connect a camera to use this feature.", {
          duration: 5000
        });
      } else {
        toast.error(`Camera error: ${error.message}`, {
          duration: 5000
        });
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsCameraActive(false);
    setAllDetectedCues([]);
    toast.info("Camera stopped");
  };

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    // Capture frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      setIsAnalyzing(true);
      
      try {
        const formData = new FormData();
        formData.append("frame", blob, "frame.jpg");
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4956c4ca/analyze-video-frame`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: formData,
          }
        );
        
        if (!response.ok) {
          console.warn("Video analysis failed - skipping frame");
          return;
        }
        
        const data = await response.json();
        
        if (data.detectedCues && data.detectedCues.length > 0) {
          // Accumulate unique cues
          setAllDetectedCues(prev => {
            const combined = [...prev, ...data.detectedCues];
            const unique = Array.from(new Set(combined));
            return unique;
          });
          
          // Notify parent with all accumulated cues
          onCuesDetected(data.detectedCues, data.analysis);
          
          // Show subtle notification
          toast.warning(`⚠️ Non-verbal cue detected: ${data.detectedCues[0]}`, {
            duration: 3000,
          });
        }
        
      } catch (error) {
        console.warn("Frame analysis error (will retry on next frame):", error instanceof Error ? error.message : error);
      } finally {
        setIsAnalyzing(false);
      }
    }, "image/jpeg", 0.8);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Camera Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          onClick={isCameraActive ? stopCamera : startCamera}
          disabled={!isRecording}
          variant={isCameraActive ? "destructive" : "outline"}
          size="sm"
          className="flex-1"
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Enable Camera Analysis
            </>
          )}
        </Button>
        
        {isAnalyzing && (
          <div className="flex items-center gap-1 text-xs text-teal-600">
            <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
            Analyzing...
          </div>
        )}
      </div>
      
      {/* Camera Preview */}
      {isCameraActive && (
        <div className="relative rounded-lg overflow-hidden border-2 border-teal-300 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          
          {/* Live indicator */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
            <Video className="w-3 h-3" />
            LIVE
          </div>
          
          {/* Accumulated cues display */}
          {allDetectedCues.length > 0 && (
            <div className="absolute bottom-2 left-2 right-2 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg">
              <p className="text-xs text-white mb-1">Detected this session:</p>
              <div className="flex flex-wrap gap-1">
                {allDetectedCues.map((cue, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full"
                  >
                    {cue}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Info text */}
      <p className="text-xs text-gray-500 italic">
        {isCameraActive 
          ? "📹 Analyzing for non-verbal bias indicators every 3 seconds"
          : "Enable camera to detect non-verbal cues during recording"
        }
      </p>
    </div>
  );
}
