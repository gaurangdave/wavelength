import { supabase } from './supabase';

export interface P2PMessage {
  type: 'dial-update' | 'lock-position' | 'reveal' | 'chat' | 'player-joined' | 'player-left' | 'round-start' | 'game-state-sync';
  payload: any;
  fromPeerId: string;
  timestamp: string;
}

export interface DialUpdatePayload {
  playerId: string;
  playerName: string;
  position: number;
  isLocked: boolean;
}

export interface GameStateSyncPayload {
  round: number;
  score: number;
  lives: number;
  psychicId: string;
}

export class WavelengthP2PManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private roomId: string | null = null;
  private peerId: string;
  private onMessageReceived?: (message: P2PMessage) => void;
  private onPeerConnected?: (peerId: string) => void;
  private onPeerDisconnected?: (peerId: string) => void;
  private signalingSubscription: any = null;

  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(peerId: string) {
    this.peerId = peerId;
  }

  setCallbacks(callbacks: {
    onMessageReceived?: (message: P2PMessage) => void;
    onPeerConnected?: (peerId: string) => void;
    onPeerDisconnected?: (peerId: string) => void;
  }) {
    this.onMessageReceived = callbacks.onMessageReceived;
    this.onPeerConnected = callbacks.onPeerConnected;
    this.onPeerDisconnected = callbacks.onPeerDisconnected;
  }

  async joinRoom(roomId: string) {
    this.roomId = roomId;
    
    // Subscribe to signaling messages for this room
    this.signalingSubscription = supabase
      .channel(`signaling-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signaling',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          await this.handleSignalingMessage(payload.new);
        }
      )
      .subscribe();

    // Get all other players in the room via API
    try {
      const response = await fetch(`/api/game/players?roomId=${roomId}`);
      if (!response.ok) throw new Error('Failed to fetch players');
      
      const data = await response.json();
      const players = data.players || [];

      // Create peer connections to all existing players
      for (const player of players) {
        if (player.peer_id !== this.peerId) {
          await this.createPeerConnection(player.peer_id, true);
        }
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }

  private async createPeerConnection(remotePeerId: string, isInitiator: boolean) {
    if (this.peers.has(remotePeerId)) {
      return; // Already connected
    }

    const peerConnection = new RTCPeerConnection(this.config);
    this.peers.set(remotePeerId, peerConnection);

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.roomId) {
        await this.sendSignalingMessage(
          this.roomId,
          remotePeerId,
          'ice-candidate',
          event.candidate
        );
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${remotePeerId}: ${peerConnection.connectionState}`);
      
      if (peerConnection.connectionState === 'connected') {
        this.onPeerConnected?.(remotePeerId);
      } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        this.onPeerDisconnected?.(remotePeerId);
        this.removePeer(remotePeerId);
      }
    };

    if (isInitiator) {
      // Create data channel
      const dataChannel = peerConnection.createDataChannel('wavelength');
      this.setupDataChannel(dataChannel, remotePeerId);

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (this.roomId) {
        await this.sendSignalingMessage(
          this.roomId,
          remotePeerId,
          'offer',
          offer
        );
      }
    } else {
      // Wait for data channel from remote peer
      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, remotePeerId);
      };
    }
  }

  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string) {
    this.dataChannels.set(peerId, dataChannel);

    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${peerId}`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        this.onMessageReceived?.(message);
      } catch (error) {
        console.error('Error parsing P2P message:', error);
      }
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with ${peerId}`);
      this.dataChannels.delete(peerId);
    };
  }

  private async sendSignalingMessage(
    roomId: string,
    toPeerId: string,
    type: 'offer' | 'answer' | 'ice-candidate',
    payload: any
  ) {
    try {
      const response = await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          from_peer_id: this.peerId,
          to_peer_id: toPeerId,
          type,
          payload
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send signaling message');
      }
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  }

  private async handleSignalingMessage(message: any) {
    // Ignore messages not meant for us
    if (message.to_peer_id && message.to_peer_id !== this.peerId) {
      return;
    }

    // Ignore messages from ourselves
    if (message.from_peer_id === this.peerId) {
      return;
    }

    const remotePeerId = message.from_peer_id;

    try {
      switch (message.type) {
        case 'offer': {
          // Create peer connection if it doesn't exist
          if (!this.peers.has(remotePeerId)) {
            await this.createPeerConnection(remotePeerId, false);
          }

          const peerConnection = this.peers.get(remotePeerId);
          if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload));
            
            // Create and send answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            if (this.roomId) {
              await this.sendSignalingMessage(
                this.roomId,
                remotePeerId,
                'answer',
                answer
              );
            }
          }
          break;
        }

        case 'answer': {
          const peerConnection = this.peers.get(remotePeerId);
          if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload));
          }
          break;
        }

        case 'ice-candidate': {
          const peerConnection = this.peers.get(remotePeerId);
          if (peerConnection && message.payload) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.payload));
          }
          break;
        }
      }

      // Mark message as consumed via API
      try {
        await fetch('/api/signaling', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: message.id })
        });
      } catch (error) {
        console.error('Error marking message as consumed:', error);
      }

    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  // Send dial update to all peers
  sendDialUpdate(playerId: string, playerName: string, position: number, isLocked: boolean) {
    const message: P2PMessage = {
      type: 'dial-update',
      payload: {
        playerId,
        playerName,
        position,
        isLocked
      } as DialUpdatePayload,
      fromPeerId: this.peerId,
      timestamp: new Date().toISOString()
    };

    this.broadcast(message);
  }

  // Send game state sync to all peers
  sendGameStateSync(round: number, score: number, lives: number, psychicId: string) {
    const message: P2PMessage = {
      type: 'game-state-sync',
      payload: {
        round,
        score,
        lives,
        psychicId
      } as GameStateSyncPayload,
      fromPeerId: this.peerId,
      timestamp: new Date().toISOString()
    };

    this.broadcast(message);
  }

  // Send reveal event to all peers
  sendReveal(targetPosition: number, points: number) {
    const message: P2PMessage = {
      type: 'reveal',
      payload: {
        targetPosition,
        points
      },
      fromPeerId: this.peerId,
      timestamp: new Date().toISOString()
    };

    this.broadcast(message);
  }

  // Broadcast message to all connected peers
  private broadcast(message: P2PMessage) {
    const messageStr = JSON.stringify(message);
    
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        try {
          channel.send(messageStr);
        } catch (error) {
          console.error(`Error sending message to ${peerId}:`, error);
        }
      }
    });
  }

  // Send message to specific peer
  sendToPeer(peerId: string, message: P2PMessage) {
    const channel = this.dataChannels.get(peerId);
    if (channel && channel.readyState === 'open') {
      try {
        channel.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to ${peerId}:`, error);
      }
    }
  }

  private removePeer(peerId: string) {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peers.delete(peerId);
    }

    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(peerId);
    }
  }

  // Get list of connected peer IDs
  getConnectedPeers(): string[] {
    return Array.from(this.dataChannels.entries())
      .filter(([_, channel]) => channel.readyState === 'open')
      .map(([peerId, _]) => peerId);
  }

  // Leave room and cleanup
  async leaveRoom() {
    // Close all peer connections
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();

    // Close all data channels
    this.dataChannels.forEach((channel) => channel.close());
    this.dataChannels.clear();

    // Unsubscribe from signaling
    if (this.signalingSubscription) {
      await supabase.removeChannel(this.signalingSubscription);
      this.signalingSubscription = null;
    }

    this.roomId = null;
  }

  // Cleanup on destroy
  destroy() {
    this.leaveRoom();
  }
}

// Factory function to create a new P2P manager
export function createWavelengthP2PManager(peerId: string): WavelengthP2PManager {
  return new WavelengthP2PManager(peerId);
}
