import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateRoomId } from "@/lib/signaling";

const HelpRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (isSearching && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isSearching && timeLeft === 0) {
      // No volunteer found, redirect to AI fallback
      toast({
        title: "No volunteers available",
        description: "Switching to AI assistance",
      });
      navigate("/ai-fallback");
    }
  }, [isSearching, timeLeft, navigate, toast]);

  const handleStartRequest = () => {
    setIsSearching(true);
    setTimeLeft(10);
    
    // Generate a unique room ID for this call
    const roomId = generateRoomId();
    
    // Store room ID in sessionStorage so volunteer page can find it
    sessionStorage.setItem("pendingCall", JSON.stringify({
      roomId,
      timestamp: Date.now(),
      status: "waiting"
    }));
    
    toast({
      title: "Searching for volunteers",
      description: "Please wait while we connect you...",
    });

    // Simulate finding a volunteer after 3 seconds
    setTimeout(() => {
      const pendingCall = sessionStorage.getItem("pendingCall");
      if (pendingCall) {
        const callData = JSON.parse(pendingCall);
        
        toast({
          title: "Volunteer found!",
          description: "Connecting to video call...",
        });
        
        // Navigate to video call with room ID
        navigate(`/video-call?room=${callData.roomId}&role=helper`);
      }
    }, 3000);
  };

  const handleCancel = () => {
    setIsSearching(false);
    setTimeLeft(10);
    sessionStorage.removeItem("pendingCall");
    navigate("/");
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

      <Card className="w-full max-w-2xl border-4">
        <CardHeader>
          <CardTitle className="text-5xl font-bold">Request Help</CardTitle>
          <CardDescription className="text-2xl">
            We'll connect you with a sighted volunteer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {!isSearching ? (
            <Button
              onClick={handleStartRequest}
              className="h-32 w-full text-3xl font-bold"
              aria-label="Start help request - Tap to search for an available volunteer"
            >
              Start Request
            </Button>
          ) : (
            <div className="space-y-8 text-center">
              <Loader2 className="mx-auto h-24 w-24 animate-spin text-primary" aria-hidden="true" />
              <p className="text-3xl font-semibold" role="status" aria-live="polite">
                Searching for volunteers...
              </p>
              <p className="text-2xl text-muted-foreground" aria-live="polite">
                Time remaining: {timeLeft} seconds
              </p>
              <Button
                onClick={handleCancel}
                variant="destructive"
                className="h-24 w-full text-2xl"
                aria-label="Cancel help request"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpRequest;
