// Example integration component showing how to use the backend in your screens
// This is a reference implementation you can use to update your existing screens

import { useState, useEffect } from 'react';
import { useWavelengthP2P } from '@/lib/hooks/useWavelengthP2P';
import { 
  createGame, 
  joinGame, 
  startGame, 
  handleRoundAction,
  handlePlayerAction,
  getPlayers,
  getGameState,
  generatePeerId,
  generateRoomCode 
} from '@/lib/api-client';
import { GameRoom, Player, GameState, Round } from '@/lib/supabase';

interface GameIntegrationExampleProps {
  playerName: string;
  roomName: string;
  settings: {
    numberOfLives: number;
    numberOfRounds: number;
    maxPoints: number;
  };
}

export default function GameIntegrationExample({ playerName, roomName, settings }: GameIntegrationExampleProps) {
  // State
  const [peerId] = useState(generatePeerId());
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [dialPosition, setDialPosition] = useState(50);
  const [isLocked, setIsLocked] = useState(false);

  // P2P Hook
  const p2p = useWavelengthP2P({
    peerId,
    onDialUpdate: (playerId, playerName, position, isLocked) => {
      console.log(`${playerName} moved dial to ${position}`, { isLocked });
      // Update UI to show other player's dial position
    },
    onGameStateSync: (round, score, lives, psychicId) => {
      console.log('Game state synced:', { round, score, lives });
      // Update game state in UI
      if (gameState) {
        setGameState({
          ...gameState,
          current_round: round,
          team_score: score,
          lives_remaining: lives,
          current_psychic_id: psychicId
        });
      }
    },
    onReveal: (targetPosition, points) => {
      console.log('Target revealed:', { targetPosition, points });
      // Show reveal animation
    },
    onPeerConnected: (peerId) => {
      console.log('Peer connected:', peerId);
    },
    onPeerDisconnected: (peerId) => {
      console.log('Peer disconnected:', peerId);
    }
  });

  // Create game and join P2P room
  const handleCreateGame = async () => {
    try {
      const roomCode = generateRoomCode();
      const result = await createGame({
        roomName,
        roomCode,
        playerName,
        peerId,
        settings
      });

      setRoom(result.room);
      setPlayer(result.player);

      // Join P2P room
      await p2p.joinRoom(result.room.id);

      console.log('Game created:', result);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  // Join existing game
  const handleJoinGame = async (roomCode: string) => {
    try {
      const result = await joinGame({
        roomCode,
        playerName,
        peerId
      });

      setRoom(result.room);
      setPlayer(result.player);

      // Join P2P room
      await p2p.joinRoom(result.room.id);

      console.log('Joined game:', result);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  // Start game (host only)
  const handleStartGame = async (psychicPlayerId: string) => {
    if (!room) return;

    try {
      const result = await startGame({
        roomId: room.id,
        psychicPlayerId,
        numberOfLives: settings.numberOfLives
      });

      setGameState(result.gameState);
      setCurrentRound(result.round);

      // Sync game state with all peers
      p2p.sendGameStateSync(
        result.gameState.current_round,
        result.gameState.team_score,
        result.gameState.lives_remaining,
        psychicPlayerId
      );

      console.log('Game started:', result);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  // Handle dial movement
  const handleDialMove = (position: number) => {
    setDialPosition(position);
    
    // Broadcast dial position to all peers
    if (player) {
      p2p.sendDialUpdate(player.id, player.player_name, position, false);
    }
  };

  // Lock in guess
  const handleLockGuess = async () => {
    if (!currentRound || !player) return;

    try {
      setIsLocked(true);

      // Save to database
      await handleRoundAction({
        action: 'lock-position',
        roundId: currentRound.id,
        playerId: player.id,
        playerName: player.player_name,
        position: dialPosition
      });

      // Broadcast locked position to peers
      p2p.sendDialUpdate(player.id, player.player_name, dialPosition, true);

      console.log('Guess locked at:', dialPosition);
    } catch (error) {
      console.error('Failed to lock guess:', error);
    }
  };

  // Reveal target (host only)
  const handleReveal = async () => {
    if (!currentRound || !room) return;

    try {
      const result = await handleRoundAction({
        action: 'reveal',
        roundId: currentRound.id,
        roomId: room.id,
        dialPosition,
        targetPosition: currentRound.target_position,
        maxPoints: settings.maxPoints
      });

      // Broadcast reveal to all peers
      p2p.sendReveal(currentRound.target_position, result.points);

      console.log('Revealed:', result);
    } catch (error) {
      console.error('Failed to reveal:', error);
    }
  };

  // Fetch players periodically
  useEffect(() => {
    if (!room) return;

    const fetchPlayers = async () => {
      try {
        const result = await getPlayers(room.id);
        setPlayers(result.players);
      } catch (error) {
        console.error('Failed to fetch players:', error);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 3000);

    return () => clearInterval(interval);
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      p2p.leaveRoom();
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-4xl font-bold text-fuchsia-500 mb-8">WAVELENGTH BACKEND INTEGRATION</h1>

      {/* Connection Status */}
      <div className="mb-8 p-4 bg-zinc-900 border border-fuchsia-600 rounded">
        <h2 className="text-xl font-bold text-teal-400 mb-2">CONNECTION STATUS</h2>
        <p>Peer ID: {peerId}</p>
        <p>Connected Peers: {p2p.connectedPeers.length}</p>
        <p>P2P Status: {p2p.isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      </div>

      {/* Room Info */}
      {room && (
        <div className="mb-8 p-4 bg-zinc-900 border border-fuchsia-600 rounded">
          <h2 className="text-xl font-bold text-teal-400 mb-2">ROOM INFO</h2>
          <p>Room Code: {room.room_code}</p>
          <p>Room Name: {room.room_name}</p>
          <p>Status: {room.status}</p>
          <p>Players: {players.length}</p>
        </div>
      )}

      {/* Game State */}
      {gameState && (
        <div className="mb-8 p-4 bg-zinc-900 border border-fuchsia-600 rounded">
          <h2 className="text-xl font-bold text-teal-400 mb-2">GAME STATE</h2>
          <p>Round: {gameState.current_round}</p>
          <p>Score: {gameState.team_score}</p>
          <p>Lives: {gameState.lives_remaining}</p>
        </div>
      )}

      {/* Current Round */}
      {currentRound && (
        <div className="mb-8 p-4 bg-zinc-900 border border-fuchsia-600 rounded">
          <h2 className="text-xl font-bold text-teal-400 mb-2">CURRENT ROUND</h2>
          <p>Concepts: {currentRound.left_concept} ↔ {currentRound.right_concept}</p>
          <p>Hint: {currentRound.psychic_hint || 'Waiting...'}</p>
          <p>Target: {currentRound.revealed ? currentRound.target_position.toFixed(1) : '???'}</p>
        </div>
      )}

      {/* Dial Control */}
      <div className="mb-8 p-4 bg-zinc-900 border border-fuchsia-600 rounded">
        <h2 className="text-xl font-bold text-teal-400 mb-2">DIAL CONTROL</h2>
        <input
          type="range"
          min="0"
          max="100"
          value={dialPosition}
          onChange={(e) => handleDialMove(Number(e.target.value))}
          disabled={isLocked}
          className="w-full"
        />
        <p>Position: {dialPosition.toFixed(1)}</p>
        <button
          onClick={handleLockGuess}
          disabled={isLocked}
          className="mt-2 px-4 py-2 bg-fuchsia-600 text-white rounded disabled:opacity-50"
        >
          {isLocked ? 'LOCKED' : 'LOCK IN'}
        </button>
      </div>

      {/* Host Controls */}
      {player?.is_host && (
        <div className="mb-8 p-4 bg-zinc-900 border border-fuchsia-600 rounded">
          <h2 className="text-xl font-bold text-teal-400 mb-2">HOST CONTROLS</h2>
          <button
            onClick={() => handleStartGame(player.id)}
            className="px-4 py-2 bg-teal-600 text-white rounded mr-2"
          >
            START GAME
          </button>
          <button
            onClick={handleReveal}
            className="px-4 py-2 bg-fuchsia-600 text-white rounded"
          >
            REVEAL
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-zinc-900 border border-fuchsia-600 rounded">
        <h2 className="text-xl font-bold text-teal-400 mb-2">ACTIONS</h2>
        <button
          onClick={handleCreateGame}
          className="px-4 py-2 bg-fuchsia-600 text-white rounded mr-2"
        >
          CREATE GAME
        </button>
        <button
          onClick={() => handleJoinGame(prompt('Enter room code:') || '')}
          className="px-4 py-2 bg-teal-600 text-white rounded"
        >
          JOIN GAME
        </button>
      </div>
    </div>
  );
}
