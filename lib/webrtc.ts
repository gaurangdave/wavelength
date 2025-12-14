import SimplePeer from 'simple-peer';

export interface WebRTCMessage {
  type: 'message';
  userName: string;
  content: string;
  timestamp: string;
  messageId: string;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  fromPeerId: string;
  toPeerId?: string;
}

export interface Participant {
  id: string;
  user_name: string;
  peer_id: string;
  is_connected: boolean;
}

export class WebRTCManager {
  private peer: SimplePeer.Instance | null = null;
  private roomId: string | null = null;
  private peerId: string;
  private userName: string;
  private localStream: MediaStream | null = null;
  private onConnectionChange?: (connected: boolean) => void;
  private onStreamReceived?: (stream: MediaStream) => void;
  private onParticipantsChange?: (participants: Participant[]) => void;
  private onError?: (error: Error) => void;
  private onMessageReceived?: (message: WebRTCMessage) => void;
  private pollingInterval: NodeJS.Timeout | null = null;

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(userName: string) {
    this.userName = userName;
    this.peerId = this.generatePeerId();
  }

  private generatePeerId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event handlers
  onConnectionStateChange(callback: (connected: boolean) => void) {
    this.onConnectionChange = callback;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onStreamReceived = callback;
  }

  onParticipantsUpdate(callback: (participants: Participant[]) => void) {
    this.onParticipantsChange = callback;
  }

  onErrorOccurred(callback: (error: Error) => void) {
    this.onError = callback;
  }

  onPeerMessage(callback: (message: WebRTCMessage) => void) {
    this.onMessageReceived = callback;
  }

  // Get user media
  async getUserMedia(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio,
      });
      return this.localStream;
    } catch (error) {
      throw new Error(`Failed to get user media: ${error}`);
    }
  }

  // Create a new room
  async createRoom(roomName: string): Promise<{ roomId: string; participants: Participant[] }> {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          creatorName: this.userName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const { room } = await response.json();
      this.roomId = room.id;

      // Join the room as a participant
      const participantData = await this.joinRoomAsParticipant(room.id);
      
      // Start polling for signaling messages
      this.startSignalingPoll();

      return {
        roomId: room.id,
        participants: participantData.participants,
      };
    } catch (error) {
      this.handleError(new Error(`Failed to create room: ${error}`));
      throw error;
    }
  }

  // Join an existing room
  async joinRoom(roomName: string): Promise<{ roomId: string; participants: Participant[] }> {
    try {
      // First check if room exists
      const response = await fetch(`/api/rooms?name=${encodeURIComponent(roomName)}`);
      
      if (!response.ok) {
        throw new Error('Room not found');
      }

      const { room, participants } = await response.json();
      this.roomId = room.id;

      // Join the room as a participant
      const participantData = await this.joinRoomAsParticipant(room.id);

      // Create peer connection as joiner (not initiator)
      await this.createPeerConnection(false);

      // Start polling for signaling messages
      this.startSignalingPoll();

      return {
        roomId: room.id,
        participants: participantData.participants,
      };
    } catch (error) {
      this.handleError(new Error(`Failed to join room: ${error}`));
      throw error;
    }
  }

  private async joinRoomAsParticipant(roomId: string): Promise<{ participants: Participant[] }> {
    const response = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        userName: this.userName,
        peerId: this.peerId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to join room');
    }

    return response.json();
  }

  // Create peer connection
  private async createPeerConnection(initiator: boolean = true): Promise<void> {
    this.peer = new SimplePeer({
      initiator,
      trickle: false,
      config: this.config,
    });

    this.peer.on('signal', async (data) => {
      await this.sendSignalingMessage({
        type: initiator ? 'offer' : 'answer',
        payload: data,
        fromPeerId: this.peerId,
      });
    });

    this.peer.on('stream', (stream) => {
      this.onStreamReceived?.(stream);
    });

    this.peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebRTCMessage;
        if (message.type === 'message') {
          this.onMessageReceived?.(message);
        }
      } catch (error) {
        console.error('Error parsing P2P message:', error);
      }
    });

    this.peer.on('connect', () => {
      console.log('WebRTC connection established');
      this.onConnectionChange?.(true);
    });

    this.peer.on('close', () => {
      console.log('WebRTC connection closed');
      this.onConnectionChange?.(false);
    });

    this.peer.on('error', (err) => {
      console.error('WebRTC error:', err);
      this.handleError(err);
    });
  }

  // Send signaling message
  private async sendSignalingMessage(message: Omit<SignalingMessage, 'toPeerId'>) {
    if (!this.roomId) return;

    try {
      await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          fromPeerId: message.fromPeerId,
          type: message.type,
          payload: message.payload,
        }),
      });
    } catch (error) {
      console.error('Failed to send signaling message:', error);
    }
  }

  // Start polling for signaling messages
  private startSignalingPoll() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      await this.pollSignalingMessages();
    }, 1000); // Poll every second
  }

  // Poll for signaling messages
  private async pollSignalingMessages() {
    if (!this.roomId) return;

    try {
      const response = await fetch(
        `/api/signaling?peerId=${this.peerId}&roomId=${this.roomId}`
      );

      if (response.ok) {
        const { signals } = await response.json();
        
        for (const signal of signals) {
          await this.handleSignalingMessage(signal);
        }
      }
    } catch (error) {
      console.error('Error polling signaling messages:', error);
    }
  }

  // Handle incoming signaling messages
  private async handleSignalingMessage(signal: any) {
    if (!this.peer) {
      // If we don't have a peer yet and receive an offer, create one
      if (signal.type === 'offer') {
        await this.createPeerConnection(false);
      } else {
        return;
      }
    }

    try {
      if (signal.type === 'offer' && !this.peer.initiator) {
        this.peer.signal(signal.payload);
      } else if (signal.type === 'answer' && this.peer.initiator) {
        this.peer.signal(signal.payload);
      } else if (signal.type === 'ice-candidate') {
        this.peer.signal(signal.payload);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  // Leave room
  async leaveRoom() {
    try {
      // Stop polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      // Close peer connection
      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Remove from participants
      if (this.peerId) {
        await fetch(`/api/participants?peerId=${this.peerId}`, {
          method: 'DELETE',
        });
      }

      this.roomId = null;
      this.onConnectionChange?.(false);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  // Send message via P2P
  sendMessage(content: string): boolean {
    if (!this.peer || !this.peer.connected) {
      return false;
    }

    try {
      const message: WebRTCMessage = {
        type: 'message',
        userName: this.userName,
        content,
        timestamp: new Date().toISOString(),
        messageId: `${this.peerId}-${Date.now()}-${Math.random()}`,
      };

      this.peer.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending P2P message:', error);
      return false;
    }
  }

  // Handle errors
  private handleError(error: Error) {
    console.error('WebRTC Manager Error:', error);
    this.onError?.(error);
  }

  // Getters
  get isConnected(): boolean {
    return this.peer?.connected || false;
  }

  get currentRoomId(): string | null {
    return this.roomId;
  }

  get currentPeerId(): string {
    return this.peerId;
  }

  get currentUserName(): string {
    return this.userName;
  }

  get currentLocalStream(): MediaStream | null {
    return this.localStream;
  }
}

export default WebRTCManager;