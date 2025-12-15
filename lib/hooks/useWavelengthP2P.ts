import { useEffect, useRef, useState } from 'react';
import { WavelengthP2PManager, P2PMessage, createWavelengthP2PManager } from '@/lib/wavelength-p2p';

export interface UseP2POptions {
  peerId: string;
  onDialUpdate?: (playerId: string, playerName: string, position: number, isLocked: boolean) => void;
  onGameStateSync?: (round: number, score: number, lives: number, psychicId: string) => void;
  onReveal?: (targetPosition: number, points: number) => void;
  onPeerConnected?: (peerId: string) => void;
  onPeerDisconnected?: (peerId: string) => void;
}

export function useWavelengthP2P(options: UseP2POptions) {
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const p2pManagerRef = useRef<WavelengthP2PManager | null>(null);

  useEffect(() => {
    // Create P2P manager
    const manager = createWavelengthP2PManager(options.peerId);
    p2pManagerRef.current = manager;

    // Set up callbacks
    manager.setCallbacks({
      onMessageReceived: (message: P2PMessage) => {
        switch (message.type) {
          case 'dial-update':
            options.onDialUpdate?.(
              message.payload.playerId,
              message.payload.playerName,
              message.payload.position,
              message.payload.isLocked
            );
            break;
          case 'game-state-sync':
            options.onGameStateSync?.(
              message.payload.round,
              message.payload.score,
              message.payload.lives,
              message.payload.psychicId
            );
            break;
          case 'reveal':
            options.onReveal?.(
              message.payload.targetPosition,
              message.payload.points
            );
            break;
        }
      },
      onPeerConnected: (peerId: string) => {
        setConnectedPeers(prev => [...prev, peerId]);
        options.onPeerConnected?.(peerId);
      },
      onPeerDisconnected: (peerId: string) => {
        setConnectedPeers(prev => prev.filter(id => id !== peerId));
        options.onPeerDisconnected?.(peerId);
      }
    });

    // Cleanup on unmount
    return () => {
      manager.destroy();
      p2pManagerRef.current = null;
    };
  }, [options.peerId]);

  const joinRoom = async (roomId: string) => {
    if (p2pManagerRef.current) {
      await p2pManagerRef.current.joinRoom(roomId);
      setIsConnected(true);
    }
  };

  const leaveRoom = async () => {
    if (p2pManagerRef.current) {
      await p2pManagerRef.current.leaveRoom();
      setIsConnected(false);
      setConnectedPeers([]);
    }
  };

  const sendDialUpdate = (playerId: string, playerName: string, position: number, isLocked: boolean) => {
    p2pManagerRef.current?.sendDialUpdate(playerId, playerName, position, isLocked);
  };

  const sendGameStateSync = (round: number, score: number, lives: number, psychicId: string) => {
    p2pManagerRef.current?.sendGameStateSync(round, score, lives, psychicId);
  };

  const sendReveal = (targetPosition: number, points: number) => {
    p2pManagerRef.current?.sendReveal(targetPosition, points);
  };

  return {
    joinRoom,
    leaveRoom,
    sendDialUpdate,
    sendGameStateSync,
    sendReveal,
    connectedPeers,
    isConnected
  };
}
