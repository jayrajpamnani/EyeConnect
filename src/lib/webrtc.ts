// WebRTC Video Call Service
// This handles peer-to-peer video connections between users

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const FALLBACK_TURN_SERVERS: RTCIceServer[] = [
  { urls: 'turn:openrelay.metered.ca:80?transport=udp' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp' },
  { urls: 'turn:openrelay.metered.ca:443?transport=udp' },
];

function buildTurnServers(): RTCIceServer[] {
  const urlsEnv = import.meta.env.VITE_TURN_URLS;
  const username = import.meta.env.VITE_TURN_USERNAME;
  const credential = import.meta.env.VITE_TURN_CREDENTIAL;

  const envUrls = urlsEnv
    ? urlsEnv
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    : [];

  // If developer hasn't provided TURN credentials, skip TURN servers entirely
  if (envUrls.length === 0 || !username || !credential) {
    console.warn(
      '⚠️ No TURN credentials found (VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL). Using STUN only.'
    );
    return [];
  }

  return envUrls.map((url) => ({
    urls: url,
    username,
    credential,
  }));
}

const ICE_SERVERS: RTCIceServer[] = [...STUN_SERVERS, ...buildTurnServers()];

// Free STUN/TURN configuration
const DEFAULT_CONFIG: WebRTCConfig = {
  iceServers: ICE_SERVERS,
};

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  
  // Callbacks
  public onRemoteStream?: (stream: MediaStream) => void;
  public onIceCandidate?: (candidate: RTCIceCandidate) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  constructor(config: WebRTCConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Initialize local media stream (camera and microphone)
   */
  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  /**
   * Create a new peer connection
   */
  createPeerConnection(): RTCPeerConnection {
    console.log('🔧 Creating RTCPeerConnection with config:', this.config);
    console.log('🔧 Local stream available:', !!this.localStream);
    console.log('🔧 Local stream tracks:', this.localStream?.getTracks().length);
    
    this.peerConnection = new RTCPeerConnection(this.config);
    console.log('🔧 RTCPeerConnection instance created');

    // Create empty remote stream
    this.remoteStream = new MediaStream();

    // Handle incoming tracks from remote peer
    this.peerConnection.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      
      if (this.onRemoteStream && this.remoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        console.log('🧊 New ICE candidate:', event.candidate.type);
        this.onIceCandidate(event.candidate);
      }
    };

    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔄 Connection state changed:', state);
      if (this.onConnectionStateChange && state) {
        this.onConnectionStateChange(state);
      }
    };

    // Add local stream tracks to peer connection
    if (this.localStream) {
      console.log('🎥 Adding local tracks to peer connection...');
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          console.log('➕ Adding track:', track.kind, track.label);
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
      console.log('✅ All local tracks added');
    } else {
      console.warn('⚠️ No local stream available when creating peer connection!');
    }

    console.log('🔧 Peer connection setup complete, returning instance');
    return this.peerConnection;
  }

  /**
   * Create an offer (caller side)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    console.log('📝 createOffer called');
    console.log('📝 Peer connection exists:', !!this.peerConnection);
    
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('📝 Calling peerConnection.createOffer()...');
    const offer = await this.peerConnection.createOffer();
    console.log('📝 Offer created:', offer.type);
    
    console.log('📝 Setting local description...');
    await this.peerConnection.setLocalDescription(offer);
    console.log('📝 Local description set successfully');
    
    return offer;
  }

  /**
   * Create an answer (receiver side)
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('Remote description (offer) set successfully');
    
    // Process any pending ICE candidates now that we have remote description
    await this.processPendingIceCandidates();
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log('Answer created and local description set');
    return answer;
  }

  /**
   * Set remote answer (caller side)
   */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('Remote description (answer) set successfully');
    
    // Process any pending ICE candidates now that we have remote description
    await this.processPendingIceCandidates();
  }

  /**
   * Add ICE candidate received from remote peer
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      console.log('Peer connection not ready, buffering ICE candidate');
      this.pendingIceCandidates.push(candidate);
      return;
    }

    // If we don't have a remote description yet, buffer the candidate
    if (!this.peerConnection.remoteDescription) {
      console.log('Remote description not set, buffering ICE candidate');
      this.pendingIceCandidates.push(candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE candidate added successfully');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  /**
   * Process any pending ICE candidates after remote description is set
   */
  private async processPendingIceCandidates(): Promise<void> {
    if (this.pendingIceCandidates.length === 0) return;

    console.log(`Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
    
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding pending ICE candidate:', error);
      }
    }
    
    this.pendingIceCandidates = [];
  }

  /**
   * Toggle microphone on/off
   */
  toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    
    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = enabled !== undefined ? enabled : !track.enabled;
    });
    
    return audioTracks[0]?.enabled || false;
  }

  /**
   * Toggle camera on/off
   */
  toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    
    const videoTracks = this.localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = enabled !== undefined ? enabled : !track.enabled;
    });
    
    return videoTracks[0]?.enabled || false;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Close connection and cleanup
   */
  close(): void {
    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }
}

