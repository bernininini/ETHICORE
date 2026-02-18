import { useState, useRef } from "react";
import { Upload, File, Loader2, X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface FileUploadCardProps {
  onTextExtracted: (text: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  extractedText?: string;
}

export function FileUploadCard({ onTextExtracted, isProcessing, setIsProcessing, extractedText = "" }: FileUploadCardProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, or PNG file');
      return;
    }

    setUploadedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    await processOCR(file);
  };

  const processOCR = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4956c4ca/extract-text`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract text from file');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      onTextExtracted(data.text);
      setShowExtractedText(true);
      toast.success('Text extracted successfully! You can now review and edit it below.');
    } catch (error) {
      console.error('OCR error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`OCR failed: ${errorMessage}`, { duration: 5000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setShowExtractedText(false);
    onTextExtracted('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full bg-background rounded-lg border border-border p-8 flex flex-col gap-4">
      {/* Upload Area */}
      {!uploadedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg cursor-pointer transition-all ${
            isDragging
              ? 'border-foreground bg-muted scale-[1.02]'
              : 'border-border hover:border-foreground hover:bg-muted'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 p-4 rounded-full transition-all ${
              isDragging ? 'bg-foreground' : 'bg-muted'
            }`}>
              <Upload className={`w-12 h-12 transition-colors ${
                isDragging ? 'text-background' : 'text-muted-foreground'
              }`} />
            </div>
            
            <p className="text-foreground mb-2">
              Upload handwritten note (PDF, JPG, or PNG)
            </p>
            
            <p className="text-sm text-muted-foreground">
              Drag file here or click to browse
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center">
                  <File className="w-6 h-6 text-foreground" />
                </div>
              )}
              
              <div className="flex-1">
                <p className="text-sm text-foreground break-all">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <Button
              onClick={clearFile}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg">
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 text-foreground animate-spin" />
                <p className="text-xs text-foreground">
                  Extracting text using OCR...
                </p>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-foreground" />
                <p className="text-xs text-foreground">
                  Text extracted successfully
                </p>
              </>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-foreground hover:underline"
              disabled={isProcessing}
            >
              Upload a different file
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Extracted Text Area */}
      {showExtractedText && extractedText && (
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-sm text-foreground">
            Extracted Text (editable):
          </label>
          <Textarea
            value={extractedText}
            onChange={(e) => onTextExtracted(e.target.value)}
            placeholder="Extracted text will appear here..."
            className="flex-1 min-h-[200px] resize-none bg-background border-border"
            disabled={isProcessing}
          />
        </div>
      )}
    </div>
  );
}
