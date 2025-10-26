import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Camera, CameraOff, Video, AlertCircle, Brain, Sparkles } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface StreamVisionProps {
  onSceneAnalyzed: (description: string) => void;
}

export function StreamVision({ onSceneAnalyzed }: StreamVisionProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [latestDescription, setLatestDescription] = useState<string>("");
  const [descriptionHistory, setDescriptionHistory] = useState<Array<{time: string, text: string}>>([]);
  const [statusMessage, setStatusMessage] = useState<string>("Camera inactive");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      // Check if running in iframe without camera permissions
      const isInIframe = window.self !== window.top;
      
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
      setIsDemoMode(false);
      setCameraBlocked(false);
      setStatusMessage("🟢 Live Camera Active");
      setDescriptionHistory([]);
      toast.success("🎥 Stream mode activated - AI analyzing in real-time!");
      
      // Start analyzing frames every 2 seconds
      intervalRef.current = window.setInterval(() => {
        captureAndAnalyzeFrame();
      }, 2000);
      
    } catch (error: any) {
      console.info("📹 Camera access unavailable - activating demo mode:", error.name || error.message);
      setCameraBlocked(true);
      
      // Enable demo mode instead
      startDemoMode();
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setIsCameraActive(true);
    setStatusMessage("🟡 Demo Mode (Camera unavailable)");
    setDescriptionHistory([]);
    
    toast.info(
      "Camera access blocked. Running in demo mode with simulated scene analysis.",
      { duration: 5000 }
    );
    
    // Simulate scene descriptions in demo mode
    const demoScenes = [
      "Doctor reviewing medical charts while maintaining eye contact with patient",
      "Healthcare provider listening attentively, nodding occasionally during patient consultation",
      "Medical professional explaining diagnosis using clear hand gestures",
      "Physician taking notes while patient describes symptoms, showing engaged body language",
      "Doctor leaning forward slightly, demonstrating active listening posture",
      "Doctor smiled warmly and picked up a stethoscope to begin examination",
      "Medical professional typing patient notes while asking clarifying questions",
      "Doctor gesturing toward anatomical chart while explaining treatment options"
    ];
    
    let sceneIndex = 0;
    intervalRef.current = window.setInterval(() => {
      const description = demoScenes[sceneIndex % demoScenes.length];
      const timestamp = new Date().toLocaleTimeString();
      setLatestDescription(description);
      setDescriptionHistory(prev => [...prev.slice(-4), { time: timestamp, text: description }]);
      onSceneAnalyzed(description);
      sceneIndex++;
    }, 4000);
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
    setIsDemoMode(false);
    setStatusMessage("🔴 Stopped");
    setLatestDescription("");
    setDescriptionHistory([]);
    toast.info("Stream stopped");
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
          `https://${projectId}.supabase.co/functions/v1/make-server-4956c4ca/analyze-scene`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: formData,
          }
        );
        
        if (!response.ok) {
          console.warn("Scene analysis failed - skipping frame");
          return;
        }
        
        const data = await response.json();
        
        if (data.description) {
          const timestamp = new Date().toLocaleTimeString();
          setLatestDescription(data.description);
          setDescriptionHistory(prev => [...prev.slice(-4), { time: timestamp, text: data.description }]);
          onSceneAnalyzed(data.description);
        }
        
        if (data.isDemoMode) {
          console.log("Scene analysis running in demo mode");
        }
        
      } catch (error) {
        console.warn("Scene analysis error (will retry on next frame):", error instanceof Error ? error.message : error);
      } finally {
        setIsAnalyzing(false);
      }
    }, "image/jpeg", 0.8);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6">
      {/* Left: Camera Feed */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-700">Live Camera Feed</h3>
          <Button
            onClick={isCameraActive ? stopCamera : startCamera}
            variant={isCameraActive ? "destructive" : "default"}
            size="sm"
            className={!isCameraActive ? "bg-teal-600 hover:bg-teal-700" : ""}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>
        </div>
        
        {/* Camera Preview */}
        <div className="relative rounded-xl overflow-hidden border-2 border-teal-300 bg-black aspect-video shadow-lg">
          {isCameraActive ? (
            <>
              {!isDemoMode ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center text-white px-8">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-60" />
                    <p className="text-lg mb-2">Demo Mode</p>
                    <p className="text-sm opacity-75">Camera unavailable in this environment</p>
                    <p className="text-xs opacity-60 mt-3">Simulating scene analysis...</p>
                  </div>
                </div>
              )}
              
              {/* Live indicator */}
              <div className={`absolute top-3 right-3 px-3 py-1.5 ${isDemoMode ? 'bg-amber-500' : 'bg-red-500'} text-white rounded-full flex items-center gap-2 shadow-lg`}>
                <Video className="w-4 h-4" />
                <span className="text-xs font-semibold">{isDemoMode ? 'DEMO' : 'LIVE'}</span>
              </div>
              
              {/* Analyzing indicator */}
              {isAnalyzing && !isDemoMode && (
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-teal-600 text-white rounded-full flex items-center gap-2 shadow-lg">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-semibold">Analyzing...</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Camera className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click \"Start Camera\" to begin streaming</p>
                {cameraBlocked && (
                  <p className="text-xs mt-2 text-amber-400">Demo mode available if camera is blocked</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className={`px-4 py-2 rounded-lg border-2 ${
          isCameraActive 
            ? 'bg-green-50 border-green-300 text-green-700' 
            : 'bg-gray-50 border-gray-300 text-gray-600'
        }`}>
          <p className="text-sm font-semibold text-center">{statusMessage}</p>
        </div>
        
        {/* Info text */}
        <p className="text-xs text-gray-500 italic">
          📹 AI analyzes the scene every 2 seconds to detect actions, expressions, and objects
        </p>
      </div>
      
      {/* Right: AI Description */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-700">🧠 AI Scene Analysis</h3>
          {isCameraActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-teal-100 rounded-full">
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
              <span className="text-xs text-teal-700 font-semibold">
                {isAnalyzing ? "Analyzing..." : "Active"}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 p-6 overflow-auto min-h-[250px]">
          {latestDescription ? (
            <div className="space-y-4">
              {/* Latest description */}
              <div className="animate-fade-in">
                <div className="mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Latest Scene</span>
                  <span className="text-xs text-gray-500 italic">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border-2 border-teal-300 shadow-sm">
                  <p className="text-gray-800 leading-relaxed">
                    {latestDescription}
                  </p>
                </div>
              </div>
              
              {/* Previous descriptions */}
              {descriptionHistory.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-semibold">Previous Updates</span>
                    <div className="h-px flex-1 bg-gray-300"></div>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {descriptionHistory.slice(0, -1).reverse().map((item, idx) => (
                      <div key={idx} className="bg-white/40 rounded-lg p-3 border border-gray-200 opacity-75">
                        <p className="text-xs text-gray-500 mb-1">{item.time}</p>
                        <p className="text-sm text-gray-700">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isCameraActive && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/40 rounded-lg p-3 border border-teal-100">
                  <Brain className="w-4 h-4 text-teal-600" />
                  <span>Updates every 2 seconds while camera is active</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-gray-400">
              <div className="max-w-xs">
                <Brain className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm mb-2">Waiting for camera to start</p>
                <p className="text-xs opacity-75">Click \"Start Camera\" to begin real-time AI analysis</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-teal-800 mb-2">
            <strong>🧠 Real-Time Vision Analysis</strong>
          </p>
          <p className="text-xs text-teal-700 leading-relaxed">
            Detects: Facial expressions • Hand gestures • Objects (pencil, stethoscope, etc.) • Body language • Interaction patterns • Environmental context
          </p>
          {isDemoMode && (
            <p className="text-xs text-amber-700 mt-2 italic font-semibold">
              ⚠️ Demo mode active - showing simulated descriptions (camera unavailable)
            </p>
          )}
        </div>
      </div>
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
