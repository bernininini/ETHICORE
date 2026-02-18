import { useState, useRef, useEffect } from "react";
import { FairnessScoreMeter } from "./components/FairnessScoreMeter";
import { BiasChip } from "./components/BiasChip";
import { FileUploadCard } from "./components/FileUploadCard";
import { FaceDetector } from "./components/FaceDetector";
import { StreamVision } from "./components/StreamVision";
import { LiveTranscriptionDisplay } from "./components/LiveTranscriptionDisplay";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { Save, Mic, MicOff, Loader2, Upload, Radio, Brain, Pencil, FileText, Lock, Info, AlertTriangle, Video as VideoIcon } from "lucide-react";
import { projectId, publicAnonKey } from "./utils/supabase/info";
import { toast } from "sonner@2.0.3";

type InputMode = "notes" | "plaintext" | "speech" | "stream";

interface AnalysisResult {
  fairnessScore: number;
  detectedBiases: string[];
  explanation: string;
  suggestedRewrite: string;
  timestamp: string;
  nonVerbalCues?: string[];
  nonVerbalAnalysis?: string;
  sceneSummary?: string;
}

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>("notes");
  const [inputText, setInputText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [nonVerbalCues, setNonVerbalCues] = useState<string[]>([]);
  const [nonVerbalAnalysis, setNonVerbalAnalysis] = useState<string>("");
  const [sceneSummary, setSceneSummary] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamIntervalRef = useRef<number | null>(null);

  const analyzeText = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4956c4ca/analyze-bias`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ text: inputText, mode: inputMode }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze text");
      }

      const result = await response.json();
      const analysisWithTimestamp = {
        ...result,
        timestamp: new Date().toISOString(),
        nonVerbalCues: nonVerbalCues.length > 0 ? nonVerbalCues : undefined,
        nonVerbalAnalysis: nonVerbalAnalysis || undefined,
        sceneSummary: sceneSummary || undefined,
      };
      
      setAnalysisResult(analysisWithTimestamp);
      toast.success("Analysis complete!");
      
      // Save to local storage
      saveToLocalStorage(analysisWithTimestamp);
    } catch (error) {
      console.error("Error analyzing text:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze text");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Check if running in iframe (Figma Make) on mount
  useEffect(() => {
    const inIframe = window.self !== window.top;
    if (inIframe && inputMode === "speech") {
      console.log("Detected iframe environment - microphone access may be restricted");
      setTimeout(() => {
        toast.info("Note: Live recording unavailable in Figma Make", {
          description: "Use 'Upload Audio' to upload pre-recorded files",
          duration: 6000,
        });
      }, 1000);
    }
  }, [inputMode]);

  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  // Check if we're in an iframe environment
  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };

  const startLiveRecording = async () => {
    try {
      // Reset states
      setMicPermissionDenied(false);
      setInterimTranscript("");
      setNonVerbalCues([]);
      setNonVerbalAnalysis("");
      streamChunksRef.current = [];
      
      // Proactive check for iframe environment
      if (isInIframe()) {
        setMicPermissionDenied(true);
        toast.error("Live recording unavailable in Figma Make", {
          description: "Please use 'Upload Audio' button to upload a pre-recorded file instead.",
          duration: 5000,
        });
        return;
      }
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicPermissionDenied(true);
        toast.error("Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus"
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Collect chunks for streaming
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          streamChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop streaming interval
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        
        // Finalize transcript
        setIsLiveTranscribing(false);
        if (interimTranscript) {
          setInputText(prev => prev + " " + interimTranscript);
          setInterimTranscript("");
        }
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        
        toast.success("Recording stopped");
      };

      // Start recording with timeslices for streaming
      mediaRecorder.start(1000); // Get data every 1 second
      setIsRecording(true);
      setIsLiveTranscribing(true);
      
      toast.success("Live recording started - speak now!", {
        duration: 2000
      });
      
      // Send audio chunks for transcription every 2 seconds
      streamIntervalRef.current = window.setInterval(async () => {
        if (streamChunksRef.current.length > 0) {
          const chunksToSend = [...streamChunksRef.current];
          streamChunksRef.current = [];
          
          const audioBlob = new Blob(chunksToSend, { type: "audio/webm" });
          console.log(`Sending audio chunk for transcription (${audioBlob.size} bytes)`);
          await transcribeStreamingAudio(audioBlob);
        } else {
          console.log("No audio chunks collected in this interval");
        }
      }, 2000);
      
    } catch (error) {
      const domError = error as DOMException;
      console.info("Microphone access unavailable:", domError.name || "Unknown error");
      
      // Handle different types of microphone errors
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setMicPermissionDenied(true);
          
          // Check if likely iframe issue
          if (isInIframe()) {
            toast.error("Microphone blocked by Figma Make", {
              description: "Use the 'Upload Audio' button to upload a pre-recorded file instead.",
              duration: 8000,
            });
          } else {
            toast.error("Microphone access denied", {
              description: "Click the lock icon in your browser's address bar to allow microphone access, then try again.",
              duration: 8000,
            });
          }
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setMicPermissionDenied(true);
          toast.error("No microphone found. Please check that a microphone is connected to your device.", {
            duration: 5000,
          });
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          setMicPermissionDenied(true);
          toast.error("Microphone is already in use by another application. Please close other apps using the microphone.", {
            duration: 6000,
          });
        } else {
          setMicPermissionDenied(true);
          toast.error(`Microphone error: ${error.name} - ${error.message}`, {
            duration: 6000,
          });
        }
      } else {
        setMicPermissionDenied(true);
        toast.error("Unable to access microphone. Please check your browser settings.");
      }
    }
  };

  const stopLiveRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Finalizing transcript...");
    }
  };

  const handleFaceCuesDetected = (cues: string[], analysis: string) => {
    // Accumulate unique cues
    setNonVerbalCues(prev => {
      const combined = [...prev, ...cues];
      const unique = Array.from(new Set(combined));
      return unique;
    });
    
    // Update analysis (keep most recent)
    setNonVerbalAnalysis(analysis);
  };

  const handleSceneAnalyzed = (description: string) => {
    // Update scene summary (keep most recent)
    setSceneSummary(description);
  };

  const transcribeStreamingAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "stream.webm");

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4956c4ca/stream-speech-to-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Stream transcription API error:", response.status, errorData);
        
        // Show error on first failure
        if (!interimTranscript && !inputText) {
          toast.error("Transcription service unavailable. Please check ElevenLabs API configuration.", {
            duration: 5000
          });
          stopLiveRecording();
        }
        return;
      }

      const data = await response.json();
      
      console.log("Stream transcription response:", data);
      
      // Check for warnings or demo mode
      if (data.warning || data.isDemoMode) {
        console.warn("Transcription warning:", data.warning);
        if (!interimTranscript && !inputText) {
          toast.warning(data.warning || "Using demo mode - configure ElevenLabs API for real transcription", {
            duration: 6000
          });
        }
      }
      
      if (data.text && data.text.trim()) {
        // Update interim transcript
        setInterimTranscript(prev => {
          const newText = prev + " " + data.text;
          return newText.trim();
        });
        
        // If final, move to inputText
        if (data.is_final) {
          setInputText(prev => {
            const combined = prev + " " + data.text;
            return combined.trim();
          });
          setInterimTranscript("");
        }
      } else if (data.error) {
        console.error("Transcription error from API:", data.error);
      }
    } catch (error) {
      console.error("Error in streaming transcription:", error);
      if (!interimTranscript && !inputText) {
        toast.error("Transcription failed. Please check your internet connection.", {
          duration: 4000
        });
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4956c4ca/speech-to-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const data = await response.json();
      setInputText(data.text);
      toast.success("Transcription complete!");
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is audio
    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }

    setIsTranscribing(true);
    toast.info("Processing audio file...");

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4956c4ca/speech-to-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const data = await response.json();
      setInputText(data.text);
      toast.success("Audio file transcribed successfully!");
    } catch (error) {
      console.error("Error transcribing audio file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transcribe audio file");
    } finally {
      setIsTranscribing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const saveToLocalStorage = (result: AnalysisResult) => {
    const existingAnalyses = localStorage.getItem("biasAnalyses");
    const analyses = existingAnalyses ? JSON.parse(existingAnalyses) : [];
    analyses.push({
      inputText,
      result,
      mode: inputMode,
    });
    localStorage.setItem("biasAnalyses", JSON.stringify(analyses));
  };

  const saveCurrentAnalysis = () => {
    if (analysisResult) {
      toast.success("Analysis saved to local storage!");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center">
      <div className="w-full max-w-7xl h-screen flex flex-col lg:flex-row mx-auto">
        {/* Left Half - Input Area */}
        <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col items-center">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3 w-full">
            <img src="/images/logo.png" alt="ETHICORE logo" className="w-10 h-10" />
            <div>
              <h1 className="text-foreground text-xl font-bold tracking-tight">ETHICORE</h1>
              <p className="text-xs text-muted-foreground">AI-powered medical note fairness analysis</p>
            </div>
          </div>

          {/* Mode Toggle Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6 w-full">
            <button
              onClick={() => setInputMode("notes")}
              className={`px-4 py-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                inputMode === "notes"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span>Notes</span>
            </button>
            <button
              onClick={() => setInputMode("plaintext")}
              className={`px-4 py-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                inputMode === "plaintext"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Plain Text</span>
            </button>
            <button
              onClick={() => setInputMode("speech")}
              className={`px-4 py-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                inputMode === "speech"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Speech</span>
            </button>
            <button
              onClick={() => setInputMode("stream")}
              className={`px-4 py-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                inputMode === "stream"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>Stream</span>
            </button>
          </div>

          {/* Input Area */}
          <div className="flex-1 mb-6 w-full">
            {inputMode === "notes" ? (
              <FileUploadCard
                onTextExtracted={setInputText}
                isProcessing={isProcessingOCR}
                setIsProcessing={setIsProcessingOCR}
                extractedText={inputText}
              />
            ) : inputMode === "stream" ? (
              <StreamVision onSceneAnalyzed={handleSceneAnalyzed} />
            ) : inputMode === "speech" ? (
              <div className="h-full bg-background rounded-lg border border-border p-8 flex flex-col items-center justify-center gap-6">
                {!inputText && !interimTranscript ? (
                  <>
                    {/* Warning if mic permission denied */}
                    {micPermissionDenied && (
                      <div className="w-full max-w-md px-4 py-3 bg-muted border border-border rounded-lg flex items-start gap-3 animate-fade-in">
                        <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-foreground mb-2">
                            <strong>Microphone Access Denied</strong>
                          </p>
                          {isInIframe() ? (
                            <>
                              <p className="text-xs text-muted-foreground mb-2">
                                Live recording unavailable in Figma Make -- allow in site settings.
                              </p>
                              <p className="text-xs text-foreground font-semibold mb-1">
                                Use <span className="underline">Upload Audio</span> button below instead
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground mb-2">
                                Microphone access denied -- allow in site settings.
                              </p>
                              <p className="text-xs text-foreground font-semibold mb-1">
                                Click the lock icon in address bar to allow microphone, then refresh.
                              </p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Supported formats: MP3, WAV, M4A, WebM, OGG
                          </p>
                        </div>
                        <button
                          onClick={() => setMicPermissionDenied(false)}
                          className="text-muted-foreground hover:text-foreground text-sm font-bold"
                        >
                          {"x"}
                        </button>
                      </div>
                    )}

                    <div className="text-center">
                      {isRecording ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg mb-2 animate-pulse">
                          <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
                          <p className="text-foreground font-semibold">
                            Listening...
                          </p>
                        </div>
                      ) : isTranscribing ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg mb-2">
                          <Loader2 className="w-4 h-4 text-foreground animate-spin" />
                          <p className="text-foreground font-semibold">
                            Transcribing...
                          </p>
                        </div>
                      ) : (
                        <p className="text-foreground mb-2">Record or upload audio</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {isRecording ? "Speak clearly into your microphone" : isTranscribing ? "Please wait..." : "Choose an option below"}
                      </p>
                    </div>
                    
                    <div className="flex gap-4 items-center justify-center">
                      {/* Live Record Button */}
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={isRecording ? stopLiveRecording : startLiveRecording}
                          disabled={isTranscribing}
                          className={`p-6 rounded-full transition-all ${
                            isRecording
                              ? "bg-foreground hover:bg-foreground/90 animate-pulse ring-4 ring-border"
                              : isTranscribing
                              ? "bg-muted cursor-not-allowed"
                              : "bg-foreground hover:bg-foreground/90 hover:scale-105"
                          }`}
                        >
                          {isTranscribing ? (
                            <Loader2 className="w-10 h-10 text-background animate-spin" />
                          ) : isRecording ? (
                            <MicOff className="w-10 h-10 text-background" />
                          ) : (
                            <Radio className="w-10 h-10 text-background" />
                          )}
                        </button>
                        <p className="text-xs text-foreground font-medium">
                          {isRecording ? "Stop Recording" : "Live Record"}
                        </p>
                        {!isRecording && (
                          <p className="text-xs text-muted-foreground italic">Real-time transcription</p>
                        )}
                      </div>

                      <div className="text-muted-foreground">or</div>

                      {/* Upload Button */}
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isRecording || isTranscribing}
                          className={`p-6 rounded-full transition-all ${
                            isRecording || isTranscribing
                              ? "bg-muted cursor-not-allowed"
                              : micPermissionDenied
                              ? "bg-foreground ring-4 ring-border"
                              : "bg-foreground hover:bg-foreground/90 hover:scale-105"
                          }`}
                        >
                          <Upload className="w-10 h-10 text-background" />
                        </button>
                        <p className={`text-xs ${micPermissionDenied ? "text-foreground font-semibold" : "text-foreground"}`}>
                          Upload Audio
                        </p>
                        {!isRecording && (
                          <p className="text-xs text-muted-foreground italic">Pre-recorded file</p>
                        )}
                      </div>
                      
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {!isRecording && !isTranscribing && (
                      <div className="mt-2 px-4 py-2 bg-muted border border-border rounded-lg">
                        <p className="text-xs text-muted-foreground text-center">
                          <strong>Live Record</strong> for real-time transcription or <strong>Upload Audio</strong> for pre-recorded files
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    {/* Live transcription display */}
                    {isLiveTranscribing && (
                      <div className="mb-4 p-4 bg-muted border border-border rounded-lg animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                          <Radio className="w-4 h-4 text-foreground animate-pulse" />
                          <p className="text-xs text-foreground font-semibold">LIVE TRANSCRIPTION ACTIVE</p>
                        </div>
                        {interimTranscript ? (
                          <p className="text-sm text-foreground italic leading-relaxed">
                            {interimTranscript}
                            <span className="inline-block w-1 h-4 bg-foreground ml-1 animate-pulse"></span>
                          </p>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground italic mb-2">
                              Listening...
                              <span className="inline-block w-1 h-4 bg-muted-foreground ml-1 animate-pulse"></span>
                            </p>
                            <p className="text-xs text-muted-foreground bg-background rounded px-2 py-1">
                              Speak clearly. Transcription updates every 2 seconds. Open console (F12) for diagnostic info.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm text-muted-foreground">
                        {isLiveTranscribing ? "Live transcript:" : "Transcribed text:"}
                      </p>
                      {!isRecording && (
                        <Button
                          onClick={() => {
                            setInputText("");
                            setInterimTranscript("");
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          Clear & try again
                        </Button>
                      )}
                      {isRecording && (
                        <Button
                          onClick={stopLiveRecording}
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                        >
                          <MicOff className="w-3 h-3 mr-1" />
                          Stop Recording
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full flex-1 bg-background rounded-lg border-border resize-none transition-all mb-4"
                      placeholder="Your transcribed text will appear here..."
                    />
                    
                    {/* Face Detector Component */}
                    <FaceDetector 
                      onCuesDetected={handleFaceCuesDetected}
                      isRecording={isRecording}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-full bg-background rounded-lg border border-border p-6 resize-none"
                placeholder={
                  inputMode === "notes"
                    ? "Paste or type your medical notes here...\n\nExample: Patient is a 45-year-old female presenting with complaints of..."
                    : "Enter plain text to analyze for potential biases..."
                }
              />
            )}
          </div>

          {/* Analyze Button - Hide in Stream mode */}
          {inputMode !== "stream" && (
            <div className="w-full">
              <Button
                onClick={analyzeText}
                disabled={isAnalyzing || isProcessingOCR || !inputText.trim()}
                className="w-full bg-foreground hover:bg-foreground/90 text-background py-6 rounded-lg mb-4"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : isProcessingOCR ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  "Analyze Fairness"
                )}
              </Button>

              {/* Caption */}
              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Offline Safe Mode -- Results saved locally
              </p>
            </div>
          )}
        </div>

        {/* Right Half - Results Area */}
        <div className="w-full lg:w-1/2 bg-muted p-6 lg:p-10 flex flex-col items-center border-t lg:border-t-0 lg:border-l border-border">
          {inputMode === "stream" ? (
            <div className="flex-1 flex flex-col w-full">
              <h2 className="text-foreground mb-4">Stream Analysis</h2>
              
              {sceneSummary ? (
                <div className="flex-1 flex flex-col gap-6">
                  {/* Latest Scene Description */}
                  <div>
                    <h3 className="text-foreground mb-3">Latest Scene Description</h3>
                    <div className="bg-background rounded-lg border border-border p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-foreground rounded-full mt-2 animate-pulse"></div>
                        <p className="text-foreground leading-relaxed flex-1">
                          {sceneSummary}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Info Box */}
                  <div className="bg-background rounded-lg border border-border p-4">
                    <h4 className="text-sm text-foreground mb-2">About Stream Mode</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Stream mode uses AI vision to analyze live video in real-time. 
                      The AI observes facial expressions, gestures, body language, and interactions 
                      to provide contextual descriptions of the consultation.
                    </p>
                  </div>
                  
                  {/* Suggestions for next steps */}
                  <div className="bg-background border border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">
                      <strong>Next Steps:</strong> After streaming, switch to Speech or Plain Text mode 
                      to analyze your consultation notes for potential biases.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Brain className="w-20 h-20 mb-4 opacity-30" />
                  <p className="text-lg mb-2">No Stream Data Yet</p>
                  <p className="text-sm max-w-sm">
                    Start the camera on the left to see AI-generated real-time scene descriptions
                  </p>
                </div>
              )}
            </div>
          ) : analysisResult ? (
            <>
              {/* Fairness Score Meter */}
              <div className="mb-8 flex justify-center">
                <FairnessScoreMeter score={analysisResult.fairnessScore} />
              </div>

              {/* Detected Biases */}
              <div className="mb-6">
                <h3 className="text-foreground mb-3">Detected Biases (Text)</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.detectedBiases.length > 0 ? (
                    analysisResult.detectedBiases.map((bias, index) => (
                      <BiasChip key={index} label={bias} />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No significant biases detected</p>
                  )}
                </div>
              </div>

              {/* Non-Verbal Cues (if any) */}
              {analysisResult.nonVerbalCues && analysisResult.nonVerbalCues.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-foreground mb-3">Non-Verbal Cues (Video)</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.nonVerbalCues.map((cue, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-muted text-foreground rounded-full text-sm border border-border"
                      >
                        {cue}
                      </span>
                    ))}
                  </div>
                  {analysisResult.nonVerbalAnalysis && (
                    <div className="mt-3 bg-muted border border-border rounded-lg p-3">
                      <p className="text-xs text-foreground">
                        <strong>Video Analysis:</strong> {analysisResult.nonVerbalAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Explanation */}
              <div className="mb-6">
                <h3 className="text-foreground mb-3">AI Explanation</h3>
                <div className="bg-background rounded-lg border border-border p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {analysisResult.explanation}
                  </p>
                </div>
              </div>

              {/* Suggested Rewrite */}
              <div className="flex-1 mb-6">
                <h3 className="text-foreground mb-3">Suggested Rewrite</h3>
                <div className="bg-background rounded-lg border border-border p-4 h-full overflow-auto">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {analysisResult.suggestedRewrite}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={saveCurrentAnalysis}
                variant="outline"
                className="w-full py-6 rounded-lg border border-foreground text-foreground hover:bg-muted"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Locally
              </Button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
              <div className="mb-4">
                <svg
                  className="w-24 h-24 mx-auto opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-lg mb-2">No Analysis Yet</p>
              <p className="text-sm max-w-xs">
                Enter your medical notes or text on the left and click "Analyze Fairness" to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
