// Signaling Service for WebRTC connection setup
// Uses Supabase Realtime for peer-to-peer signaling

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left';
  data: any;
  from: string;
  timestamp: number;
}

export interface CallRoom {
  roomId: string;
  userId: string;
  userRole: 'helper' | 'volunteer';
}

export class SignalingService {
  private channel: RealtimeChannel | null = null;
  private roomId: string;
  private userId: string;
  private userRole: 'helper' | 'volunteer';
  private knownPeers: Set<string> = new Set();
  
  // Callbacks
  public onOffer?: (offer: RTCSessionDescriptionInit, from: string) => void;
  public onAnswer?: (answer: RTCSessionDescriptionInit, from: string) => void;
  public onIceCandidate?: (candidate: RTCIceCandidateInit, from: string) => void;
  public onUserJoined?: (userId: string) => void;
  public onUserLeft?: (userId: string) => void;

  constructor(room: CallRoom) {
    this.roomId = room.roomId;
    this.userId = room.userId;
    this.userRole = room.userRole;
  }

  /**
   * Join a call room
   */
  async joinRoom(): Promise<void> {
    console.log(`Joining room ${this.roomId} as ${this.userRole}`);
    
    // Create a Realtime channel for this call
    this.channel = supabase.channel(`call:${this.roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: this.userId },
      },
    });

    // Listen for broadcast messages
    this.channel.on('broadcast', { event: 'signaling' }, (payload) => {
      this.handleSignalingMessage(payload.payload as SignalingMessage);
    });

    // Track presence (who's in the room)
    this.channel.on('presence', { event: 'join' }, ({ key }) => {
      console.log('User joined:', key);
      if (key !== this.userId) {
        this.notifyUserJoined(key);
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log('User left:', key);
      if (key !== this.userId) {
        this.knownPeers.delete(key);
        if (this.onUserLeft) {
          this.onUserLeft(key);
        }
      }
    });

    this.channel.on('presence', { event: 'sync' }, () => {
      console.log('Presence sync received');
      const presenceState = this.channel?.presenceState();
      if (!presenceState) return;

      const otherUsers = Object.keys(presenceState).filter((key) => key !== this.userId);
      otherUsers.forEach((userId) => {
        this.notifyUserJoined(userId);
      });
    });

    // Subscribe to the channel
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence
        await this.channel?.track({
          userId: this.userId,
          role: this.userRole,
          online_at: new Date().toISOString(),
        });
        
        console.log('Successfully joined room');
        
        // Initial presence sync will trigger the handler above
      }
    });
  }

  private notifyUserJoined(userId: string) {
    if (this.knownPeers.has(userId)) return;
    this.knownPeers.add(userId);

    if (this.onUserJoined) {
      console.log('Detected user in room:', userId);
      this.onUserJoined(userId);
    }
  }

  /**
   * Handle incoming signaling messages
   */
  private handleSignalingMessage(message: SignalingMessage): void {
    // Don't process our own messages
    if (message.from === this.userId) return;

    console.log('Received signaling message:', message.type);

    switch (message.type) {
      case 'offer':
        if (this.onOffer) {
          this.onOffer(message.data, message.from);
        }
        break;
      
      case 'answer':
        if (this.onAnswer) {
          this.onAnswer(message.data, message.from);
        }
        break;
      
      case 'ice-candidate':
        if (this.onIceCandidate) {
          this.onIceCandidate(message.data, message.from);
        }
        break;
      
      case 'user-joined':
        if (this.onUserJoined) {
          this.onUserJoined(message.from);
        }
        break;
      
      case 'user-left':
        if (this.onUserLeft) {
          this.onUserLeft(message.from);
        }
        break;
    }
  }

  /**
   * Send WebRTC offer
   */
  async sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    await this.sendMessage({
      type: 'offer',
      data: offer,
      from: this.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Send WebRTC answer
   */
  async sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.sendMessage({
      type: 'answer',
      data: answer,
      from: this.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Send ICE candidate
   */
  async sendIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    await this.sendMessage({
      type: 'ice-candidate',
      data: candidate.toJSON(),
      from: this.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Send a signaling message
   */
  private async sendMessage(message: SignalingMessage): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to room');
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message,
    });
  }

  /**
   * Leave the room and cleanup
   */
  async leaveRoom(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await this.channel.unsubscribe();
      this.channel = null;
      this.knownPeers.clear();
    }
  }

  /**
   * Get current room ID
   */
  getRoomId(): string {
    return this.roomId;
  }
}

/**
 * Generate a unique room ID for a call
 */
export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

