import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VideoCall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Request camera and microphone access
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        const speech = new SpeechSynthesisUtterance("Video call connected");
        window.speechSynthesis.speak(speech);
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
        toast({
          title: "Camera access denied",
          description: "Please allow camera and microphone access",
          variant: "destructive",
        });
      });

    return () => {
      // Cleanup: stop all tracks
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [toast]);

  const handleEndCall = () => {
    const speech = new SpeechSynthesisUtterance("Call ended");
    window.speechSynthesis.speak(speech);
    
    toast({
      title: "Call ended",
      description: "Thank you for using EyeConnect",
    });
    navigate("/");
  };

  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      
      const speech = new SpeechSynthesisUtterance(
        isMuted ? "Microphone on" : "Microphone off"
      );
      window.speechSynthesis.speak(speech);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
      
      const speech = new SpeechSynthesisUtterance(
        isVideoOff ? "Camera on" : "Camera off"
      );
      window.speechSynthesis.speak(speech);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      {/* Remote video (full screen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="h-full w-full object-cover"
        aria-label="Remote video feed"
      />

      {/* Local video (small thumbnail) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute right-4 top-4 h-48 w-32 rounded-lg border-4 border-white object-cover"
        aria-label="Your video feed"
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-8">
        <Button
          onClick={toggleMute}
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="h-20 w-20 rounded-full"
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>

        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="lg"
          className="h-24 w-24 rounded-full"
          aria-label="End call"
        >
          <PhoneOff className="h-10 w-10" />
        </Button>

        <Button
          onClick={toggleVideo}
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="h-20 w-20 rounded-full"
          aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
        >
          {isVideoOff ? <VideoOff className="h-8 w-8" /> : <Video className="h-8 w-8" />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
