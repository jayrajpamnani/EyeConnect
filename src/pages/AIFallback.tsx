import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage, canvasToBase64, isOpenRouterConfigured } from "@/lib/openrouter";

// OpenRouter AI Vision - Real-time image analysis for blind users
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
    setResult(""); // Clear previous result
    
    try {
      // Check if API is configured
      if (!isOpenRouterConfigured()) {
        throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
      }

      // Check if video and canvas refs are available
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Camera not ready. Please wait a moment and try again.');
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to base64
      const imageBase64 = canvasToBase64(canvas, 0.8);
      
      // Analyze image using OpenRouter API
      const response = await analyzeImage({
        imageBase64,
        prompt: "You are helping a blind person understand their surroundings. " +
                "Describe this image clearly and concisely. Focus on objects, their locations, " +
                "any text visible, colors, and potential hazards. Be specific about spatial relationships " +
                "(left, right, center, near, far). Keep it under 3 sentences but informative."
      });
      
      setResult(response.description);
      
      // Read result aloud
      const speech = new SpeechSynthesisUtterance(response.description);
      speech.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(speech);
      
      toast({
        title: "Analysis complete",
        description: "The description has been read aloud",
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
      
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Read error aloud
      const speech = new SpeechSynthesisUtterance("Sorry, I couldn't analyze the image. " + errorMessage);
      window.speechSynthesis.speak(speech);
    } finally {
      // CRITICAL: Always reset analyzing state to prevent permanently disabled button
      // This runs whether the analysis succeeds, fails, or refs are unavailable
      setIsAnalyzing(false);
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
          {!isOpenRouterConfigured() && (
            <div className="mt-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 p-4 border border-yellow-300 dark:border-yellow-700">
              <p className="text-lg text-yellow-800 dark:text-yellow-200">
                ⚠️ OpenRouter API not configured. Add VITE_OPENROUTER_API_KEY to your .env file.
              </p>
            </div>
          )}
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