'use client';

import { useState, useEffect, useMemo } from 'react';
import { getPlayers } from '@/lib/api-client';
import { useGameStore } from '@/lib/store';
import { useGameRoomStatusUpdates } from '@/lib/hooks/useRealtimeSubscriptions';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isYou: boolean;
  isConnected: boolean;
  isPsychic: boolean;
}

interface FetchedPlayer {
  id: string;
  player_name: string;
  is_host: boolean;
  is_connected: boolean;
  is_psychic: boolean;
}

export default function GameWaitingRoom() {
  const { 
    gameData,
    isHost,
    isLoading,
    assignRandomPsychic,
    startGame,
    backToMenu
  } = useGameStore();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPsychic, setSelectedPsychic] = useState<string | null>(null);
  
  // Calculate game ready state from players and psychic
  const isGameReady = useMemo(() => 
    players.length >= 2 && selectedPsychic !== null,
    [players.length, selectedPsychic]
  );
  
  // Get data from gameData (with null checks)
  const roomId = gameData?.roomId;
  const roomCode = gameData?.roomCode;
  const playerId = gameData?.playerId;
  const roomName = gameData?.gameSettings?.roomName;

  // Subscribe to game room status changes via custom hook
  useGameRoomStatusUpdates(roomId, isHost);

  // Fetch players from database
  useEffect(() => {
    if (!roomId || !playerId) return;
    
    const fetchPlayers = async () => {
      try {
        const fetchedPlayers = await getPlayers(roomId) as FetchedPlayer[];
        setPlayers(fetchedPlayers.map((p) => ({
          id: p.id,
          name: p.player_name,
          isHost: p.is_host,
          isYou: p.id === playerId,
          isConnected: p.is_connected,
          isPsychic: p.is_psychic
        })));
        
        // Check if psychic is already assigned
        const psychic = fetchedPlayers.find((p) => p.is_psychic);
        if (psychic) {
          setSelectedPsychic(psychic.id);
        }
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };

    fetchPlayers();
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchPlayers, 2000);
    return () => clearInterval(interval);
  }, [roomId, playerId]);

  const handleAssignPsychic = async () => {
    const result = await assignRandomPsychic();
    if (result) {
      setSelectedPsychic(result.psychicId);
      // Update local players list
      setPlayers(prev => prev.map(p => ({
        ...p,
        isPsychic: p.id === result.psychicId
      })));
    }
  };

  const handleStartGame = async () => {
    if (isGameReady && selectedPsychic && !isLoading) {
      console.log('[HOST] Starting game...');
      await startGame();
    }
  };
  
  // Early return if no game data
  if (!gameData) return null;

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/5 left-1/5 w-28 h-28 border border-zinc-800 rounded-full"></div>
        <div className="absolute bottom-1/5 right-1/5 w-32 h-32 border border-zinc-800"></div>
        <div className="absolute top-2/3 left-1/4 w-20 h-20 border border-zinc-800 rotate-45"></div>
        <div className="absolute top-1/4 right-1/3 w-36 h-36 border border-zinc-800 rounded-full"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-widest uppercase mb-4">
            {roomName}
          </h1>
          
          {/* Room Code */}
          <div className="bg-zinc-900 border-2 border-fuchsia-600 inline-block px-8 py-4 mb-6">
            <div className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-1">
              ROOM CODE
            </div>
            <div className="text-3xl lg:text-4xl font-mono font-bold text-fuchsia-500 tracking-widest">
              {roomCode}
            </div>
          </div>

          <div className="text-teal-400 text-sm font-medium tracking-wide uppercase">
            Share this code with other players
          </div>
        </div>

        {/* Player Roster */}
        <div className="mb-10">
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-widest uppercase mb-6 text-center">
            REGISTERED PLAYERS 
            <span className="text-teal-400">(Waiting...)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div 
                key={player.id}
                className={`
                  bg-zinc-900 border-2 p-4 transition-all duration-300
                  ${player.isYou 
                    ? 'border-fuchsia-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                    : player.isPsychic
                    ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                    : 'border-teal-600 hover:border-teal-500'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  {/* Player Avatar */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${player.isYou 
                      ? 'bg-fuchsia-600 text-white' 
                      : player.isPsychic
                      ? 'bg-yellow-500 text-black'
                      : 'bg-teal-600 text-white'
                    }
                  `}>
                    {player.isHost ? 'H' : player.isPsychic ? 'P' : 'U'}
                  </div>
                  
                  {/* Player Info */}
                  <div className="flex-1">
                    <div className={`
                      font-bold tracking-wide
                      ${player.isYou ? 'text-fuchsia-400' : 'text-white'}
                    `}>
                      {player.name}
                      {player.isYou && ' (YOU)'}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      {player.isHost ? 'Front Man' : player.isPsychic ? 'Psychic' : 'Player'}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-teal-400 animate-pulse' : 'bg-zinc-600'}`}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 text-gray-500 text-sm font-medium tracking-wide uppercase">
            {players.length} Players Connected
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 lg:p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-400 tracking-widest uppercase mb-6 text-center">
              HOST CONTROLS
            </h3>
            
            <div className="space-y-4">
              {/* Assign Psychic Button */}
              <button
                onClick={handleAssignPsychic}
                className="w-full py-3 px-6 bg-zinc-800 border-2 border-yellow-600 text-yellow-500 font-bold text-lg uppercase tracking-widest hover:bg-yellow-600 hover:text-black hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all duration-300"
              >
                {selectedPsychic ? 'REASSIGN PSYCHIC (RNG)' : 'ASSIGN PSYCHIC (RNG)'}
              </button>

              {selectedPsychic && (
                <div className="text-center text-sm text-yellow-400 font-medium tracking-wide">
                  Psychic: {players.find(p => p.id === selectedPsychic)?.name}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Start Game Button */}
          <button
            onClick={handleStartGame}
            disabled={!isHost || !isGameReady || isLoading}
            className={`
              w-full py-6 px-8 text-2xl font-bold uppercase tracking-widest
              transition-all duration-300 border-2
              ${(isHost && isGameReady && !isLoading)
                ? 'bg-fuchsia-600 border-fuchsia-600 text-white hover:bg-fuchsia-700 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] cursor-pointer'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'
              }
            `}
          >
            {!isHost
              ? 'WAITING FOR HOST TO START...'
              : isLoading 
              ? 'STARTING...'
              : !isGameReady 
              ? `WAITING FOR PLAYERS (${players.length}/2)` 
              : !selectedPsychic 
              ? 'ASSIGN PSYCHIC FIRST'
              : 'START GAME'
            }
          </button>
          
          {/* Back Button */}
          <button
            onClick={backToMenu}
            className="w-full py-3 px-6 text-lg font-medium text-zinc-400 uppercase tracking-widest border-2 border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300"
          >
            ← BACK TO MENU
          </button>
        </div>

        {/* Status Messages */}
        <div className="text-center mt-8">
          {isGameReady && selectedPsychic ? (
            <div className="flex items-center justify-center space-x-2 text-teal-400 text-sm font-medium tracking-wide uppercase">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              <span>READY TO COMMENCE</span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm font-medium tracking-wide uppercase">
              {!selectedPsychic ? 'Assign a Psychic to continue' : `Need at least 2 players (${players.length}/2)`}
            </div>
          )}
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-16 h-16 border-r-2 border-b-2 border-fuchsia-500 opacity-30"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-teal-400 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-r-2 border-t-2 border-teal-400 opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-l-2 border-t-2 border-fuchsia-500 opacity-30"></div>
    </div>
  );
}