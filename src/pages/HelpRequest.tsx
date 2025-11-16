import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateRoomId } from "@/lib/signaling";
import { supabase } from "@/integrations/supabase/client";

const HelpRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

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

  const handleStartRequest = async () => {
    setIsSearching(true);
    setTimeLeft(30);

    // Generate identifiers
    const roomId = generateRoomId();
    const helperId = `helper_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    try {
      // Insert the call request into database
      const { error } = await (supabase as any)
        .from('calls')
        .insert({
          room_id: roomId,
          status: 'waiting',
          helper_id: helperId,
        });

      if (error) {
        console.error('Error creating call:', error);
        toast({
          title: 'Connection error',
          description: 'Failed to create call request. Please check your Supabase configuration.',
          variant: 'destructive',
        });
        setIsSearching(false);
        return;
      }

      // Listen for when a volunteer accepts
      const channel = supabase
        .channel(`call-updates-${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'calls',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const updatedCall = payload.new as any;
            if (updatedCall.status === 'accepted') {
              channel.unsubscribe();
              toast({
                title: 'Volunteer found!',
                description: 'Connecting to video call...',
              });
              navigate(`/video-call?room=${updatedCall.room_id}&role=helper`);
            }
          }
        )
        .subscribe();

      toast({
        title: 'Searching for volunteers',
        description: 'Please wait while we connect you...',
      });

      // Store channel for cleanup
      (window as any).__callChannel = channel;
    } catch (error) {
      console.error('Error starting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to start help request',
        variant: 'destructive',
      });
      setIsSearching(false);
    }
  };

  const handleCancel = async () => {
    setIsSearching(false);
    setTimeLeft(30);
    
    // Cleanup subscription
    const channel = (window as any).__callChannel;
    if (channel) {
      await channel.unsubscribe();
      delete (window as any).__callChannel;
    }
    
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