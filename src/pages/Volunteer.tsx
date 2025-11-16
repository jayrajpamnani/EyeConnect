import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Volunteer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(false);

  const handleStartVolunteering = () => {
    setIsListening(true);
    toast({
      title: "Ready to help",
      description: "Waiting for incoming help requests...",
    });

    // Simulate incoming request after 5 seconds
    setTimeout(() => {
      setIncomingRequest(true);
      const speech = new SpeechSynthesisUtterance("Incoming help request");
      window.speechSynthesis.speak(speech);
    }, 5000);
  };

  const handleAccept = () => {
    toast({
      title: "Request accepted",
      description: "Connecting to video call...",
    });
    navigate("/video-call");
  };

  const handleStopVolunteering = () => {
    setIsListening(false);
    setIncomingRequest(false);
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
          <CardTitle className="text-5xl font-bold">Volunteer</CardTitle>
          <CardDescription className="text-2xl">
            Help blind users by answering their video calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {!isListening ? (
            <Button
              onClick={handleStartVolunteering}
              className="h-32 w-full text-3xl font-bold"
              aria-label="Start volunteering - Tap to start listening for help requests"
            >
              Start Volunteering
            </Button>
          ) : incomingRequest ? (
            <div className="space-y-8 text-center">
              <Phone className="mx-auto h-24 w-24 animate-pulse text-primary" aria-hidden="true" />
              <p className="text-4xl font-bold text-primary" role="alert" aria-live="assertive">
                Incoming Help Request!
              </p>
              <p className="text-2xl text-muted-foreground">
                Someone needs your assistance
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={handleAccept}
                  className="h-24 flex-1 text-2xl"
                  aria-label="Accept help request and start video call"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => setIncomingRequest(false)}
                  variant="destructive"
                  className="h-24 flex-1 text-2xl"
                  aria-label="Decline help request"
                >
                  Decline
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 text-center">
              <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-primary" aria-hidden="true" />
              <p className="text-3xl font-semibold" role="status" aria-live="polite">
                Listening for requests...
              </p>
              <p className="text-2xl text-muted-foreground">
                You'll be notified when someone needs help
              </p>
              <Button
                onClick={handleStopVolunteering}
                variant="secondary"
                className="h-24 w-full text-2xl"
                aria-label="Stop volunteering"
              >
                Stop Volunteering
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Volunteer;
