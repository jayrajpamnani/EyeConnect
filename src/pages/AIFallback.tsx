import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AIFallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Start camera
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to use AI assistance",
          variant: "destructive",
        });
      });

    return () => {
      // Cleanup: stop camera
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [toast]);

  const analyzeFrame = async () => {
    setIsAnalyzing(true);
    
    // Capture frame from video
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      
      // In production, this would call OpenAI Vision API
      // For now, simulate AI response
      setTimeout(() => {
        const mockResponse = "I can see a room with a door on the left and a window straight ahead. There's a table with some objects on it in the center of the view.";
        setResult(mockResponse);
        setIsAnalyzing(false);
        
        // Read result aloud
        const speech = new SpeechSynthesisUtterance(mockResponse);
        window.speechSynthesis.speak(speech);
        
        toast({
          title: "Analysis complete",
          description: "The description has been read aloud",
        });
      }, 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
      <Button
        onClick={() => navigate("/")}
        variant="ghost"
        className="absolute left-8 top-8 text-2xl"
        aria-label="Go back to home"
      >
        <ArrowLeft className="mr-2 h-8 w-8" />
        Back
      </Button>

      <Card className="w-full max-w-4xl border-4">
        <CardHeader>
          <CardTitle className="text-5xl font-bold">AI Visual Assistance</CardTitle>
          <CardDescription className="text-2xl">
            Point your camera and tap to hear what's in view
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Camera preview */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
              aria-label="Camera preview"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Capture button */}
          <Button
            onClick={analyzeFrame}
            disabled={isAnalyzing}
            className="h-32 w-full text-3xl font-bold"
            aria-label="Capture and analyze what the camera sees - Tap to take a photo and hear AI describe what's in the image"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-4 h-12 w-12 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Camera className="mr-4 h-12 w-12" />
                Capture & Analyze
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-6">
                <p className="text-2xl leading-relaxed" role="status" aria-live="polite">
                  {result}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIFallback;
