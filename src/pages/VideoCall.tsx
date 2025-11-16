import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WebRTCService } from "@/lib/webrtc";
import { SignalingService } from "@/lib/signaling";

const VideoCall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const signalingServiceRef = useRef<SignalingService | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitiatedOfferRef = useRef(false);

  useEffect(() => {
    const roomId = searchParams.get("room");
    const role = searchParams.get("role") as "helper" | "volunteer";
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    if (!roomId || !role) {
      toast({
        title: "Invalid call parameters",
        description: "Missing room or role information",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const initializeCall = async () => {
      try {
        // Initialize WebRTC service
        const webrtcService = new WebRTCService();
        webrtcServiceRef.current = webrtcService;

        // Initialize local stream
        const localStream = await webrtcService.initializeLocalStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Initialize signaling service
        const signalingService = new SignalingService({ roomId, userId, userRole: role });
        signalingServiceRef.current = signalingService;

        // Set up WebRTC event handlers
        webrtcService.onRemoteStream = (stream) => {
          console.log("Received remote stream");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setIsConnecting(false);
          setConnectionState("connected");
          
          // Clear connection timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          
          const speech = new SpeechSynthesisUtterance("Video call connected");
          window.speechSynthesis.speak(speech);
          
          toast({
            title: "Connected",
            description: "You are now connected",
          });
        };

        webrtcService.onConnectionStateChange = (state) => {
          console.log("Connection state:", state);
          setConnectionState(state);
          
          if (state === "failed" || state === "disconnected") {
            toast({
              title: "Connection issue",
              description: "The call connection has been interrupted",
              variant: "destructive",
            });
          }
        };

        webrtcService.onIceCandidate = (candidate) => {
          console.log('Sending ICE candidate');
          signalingService.sendIceCandidate(candidate);
        };

        // Set up signaling event handlers
        signalingService.onOffer = async (offer) => {
          console.log("📥 Received offer from peer, creating answer");
          
          // Create peer connection if not already created
          if (!webrtcService.getLocalStream()) {
            console.error('❌ Local stream not ready');
            return;
          }
          
          try {
            webrtcService.createPeerConnection();
            console.log("✅ Peer connection created for answer");
            const answer = await webrtcService.createAnswer(offer);
            console.log("✅ Answer created:", answer);
            await signalingService.sendAnswer(answer);
            console.log('✅ Answer sent successfully');
          } catch (error) {
            console.error('❌ Error handling offer:', error);
          }
        };

        signalingService.onAnswer = async (answer) => {
          console.log("📥 Received answer from peer, setting remote description");
          try {
            await webrtcService.setRemoteAnswer(answer);
            console.log('✅ Remote answer set successfully');
          } catch (error) {
            console.error('❌ Error setting remote answer:', error);
          }
        };

        signalingService.onIceCandidate = async (candidate) => {
          console.log("Received ICE candidate, adding to peer connection");
          await webrtcService.addIceCandidate(candidate);
        };

        signalingService.onUserJoined = async (joinedUserId) => {
          console.log("🎯 onUserJoined callback fired!", {
            joinedUserId,
            myRole: role,
            myUserId: userId,
            willInitiateOffer: role === "volunteer"
          });
          
          // Wait a moment to ensure both peers are ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // The volunteer (who accepted the call) initiates the offer
          if (role === "volunteer" && !hasInitiatedOfferRef.current) {
            try {
              hasInitiatedOfferRef.current = true;
              console.log("✅ I'm the volunteer, creating peer connection and sending offer");
              console.log("🔍 WebRTC service exists:", !!webrtcService);
              console.log("🔍 Local stream exists:", !!webrtcService.getLocalStream());
              
              const pc = webrtcService.createPeerConnection();
              console.log("✅ Peer connection created:", pc);
              console.log("✅ Peer connection state:", pc.connectionState);
              
              // Small delay to ensure peer connection is fully set up
              await new Promise(resolve => setTimeout(resolve, 100));
              
              console.log("🔍 About to create offer...");
              const offer = await webrtcService.createOffer();
              console.log('✅ Offer created:', offer);
              
              console.log("🔍 About to send offer...");
              await signalingService.sendOffer(offer);
              console.log('✅ Offer sent successfully');
            } catch (error) {
              console.error("❌ Error creating/sending offer:", error);
              console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack');
            }
          } else {
            console.log("⏳ I'm the helper, waiting for offer from volunteer");
          }
        };

        signalingService.onUserLeft = () => {
          toast({
            title: "User left",
            description: "The other user has left the call",
          });
          setTimeout(() => navigate("/"), 2000);
        };

        // Join the room
        await signalingService.joinRoom();
        
        toast({
          title: "Waiting for connection",
          description: "Connecting to the other user...",
        });

        // Set a timeout for connection (30 seconds)
        connectionTimeoutRef.current = setTimeout(() => {
          console.warn('Connection timeout - taking too long to connect');
          toast({
            title: "Connection taking too long",
            description: "Please check your internet connection and try again",
            variant: "destructive",
          });
          // The timeout will be cleared if connection succeeds
        }, 30000);

      } catch (error) {
        console.error("Error initializing call:", error);
        toast({
          title: "Connection failed",
          description: error instanceof Error ? error.message : "Failed to start the call",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    initializeCall();

    return () => {
      // Cleanup
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      webrtcServiceRef.current?.close();
      signalingServiceRef.current?.leaveRoom();
    };
  }, [searchParams, toast, navigate]);

  const handleEndCall = async () => {
    const speech = new SpeechSynthesisUtterance("Call ended");
    window.speechSynthesis.speak(speech);
    
    // Cleanup connections
    await signalingServiceRef.current?.leaveRoom();
    webrtcServiceRef.current?.close();
    
    toast({
      title: "Call ended",
      description: "Thank you for using EyeConnect",
    });
    navigate("/");
  };

  const toggleMute = () => {
    if (webrtcServiceRef.current) {
      const isEnabled = webrtcServiceRef.current.toggleAudio();
      setIsMuted(!isEnabled);
      
      const speech = new SpeechSynthesisUtterance(
        isEnabled ? "Microphone on" : "Microphone off"
      );
      window.speechSynthesis.speak(speech);
    }
  };

  const toggleVideo = () => {
    if (webrtcServiceRef.current) {
      const isEnabled = webrtcServiceRef.current.toggleVideo();
      setIsVideoOff(!isEnabled);
      
      const speech = new SpeechSynthesisUtterance(
        isEnabled ? "Camera on" : "Camera off"
      );
      window.speechSynthesis.speak(speech);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      {/* Connection status overlay */}
      {isConnecting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
          <Loader2 className="h-16 w-16 animate-spin text-white mb-4" />
          <p className="text-2xl text-white font-semibold">
            {connectionState === "connecting" ? "Connecting..." : "Waiting for other user..."}
          </p>
        </div>
      )}

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
