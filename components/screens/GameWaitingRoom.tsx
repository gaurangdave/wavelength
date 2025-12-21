'use client';

import { useState, useEffect } from 'react';
import { getPlayers, assignRandomPsychic, startGame } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/store';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isYou: boolean;
  isConnected: boolean;
  isPsychic: boolean;
}

export default function GameWaitingRoom() {
  const { 
    gameData, 
    playerName, 
    isHost, 
    startGame: startGameAction, 
    backToMenu,
    setCurrentScreen 
  } = useGameStore();
  
  if (!gameData) return null;
  
  const { roomId, roomCode, playerId, peerId } = gameData;
  const roomName = gameData.gameSettings.roomName;
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPsychic, setSelectedPsychic] = useState<string | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Subscribe to game room status changes (Realtime)
  useEffect(() => {
    console.log('GameWaitingRoom mounted - isHost:', isHost, 'roomId:', roomId);
    
    if (isHost) {
      console.log('Host mode - skipping Realtime subscription');
      return;
    }

    console.log('[NON-HOST] Setting up Supabase Realtime subscription for room status changes');
    
    // Also poll the room status as a backup
    const checkRoomStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('game_rooms')
          .select('status')
          .eq('id', roomId)
          .single();
        
        if (error) {
          console.error('[NON-HOST] Error checking room status:', error);
          return;
        }
        
        console.log('[NON-HOST] Current room status:', data?.status);
        
        if (data?.status === 'in_progress' && !isStarting) {
          console.log('[NON-HOST] ✅ Game already started! Fetching game state...');
          setIsStarting(true);
          
          const response = await fetch(`/api/game/state?roomId=${roomId}`);
          if (response.ok) {
            const gameData = await response.json();
            console.log('[NON-HOST] Fetched game state:', gameData);
            
            if (gameData.currentRound && gameData.gameState) {
              startGameAction({
                round: gameData.currentRound,
                gameState: gameData.gameState
              });
            }
          }
        }
      } catch (err) {
        console.error('[NON-HOST] Error in status check:', err);
      }
    };
    
    // Check immediately
    checkRoomStatus();
    
    // Then check every 2 seconds as backup
    const pollInterval = setInterval(checkRoomStatus, 2000);
    
    const channel = supabase
      .channel(`game-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        async (payload) => {
          console.log('[NON-HOST] Game room updated via Realtime:', payload);
          console.log('[NON-HOST] Old status:', payload.old?.status, '→ New status:', payload.new?.status);
          
          // Check if game has started
          if (payload.new?.status === 'in_progress' && !isStarting) {
            console.log('[NON-HOST] ✅ Game started detected via Realtime! Fetching game state...');
            setIsStarting(true);
            
            try {
              const response = await fetch(`/api/game/state?roomId=${roomId}`);
              console.log('[NON-HOST] API response status:', response.status);
              
              if (response.ok) {
                const data = await response.json();
                console.log('[NON-HOST] Fetched game state:', data);
                
                if (data.currentRound && data.gameState) {
                  console.log('[NON-HOST] ✅ Transitioning to game screen with data:', {
                    round: data.currentRound,
                    gameState: data.gameState
                  });
                  startGameAction({
                    round: data.currentRound,
                    gameState: data.gameState
                  });
                } else {
                  console.error('[NON-HOST] ❌ Missing currentRound or gameState in response');
                }
              } else {
                const errorText = await response.text();
                console.error('[NON-HOST] ❌ API response not ok:', errorText);
              }
            } catch (err) {
              console.error('[NON-HOST] ❌ Failed to fetch game state:', err);
              setIsStarting(false);
            }
          } else {
            console.log('[NON-HOST] Status change but not starting game:', {
              newStatus: payload.new?.status,
              isStarting
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[NON-HOST] Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[NON-HOST] ✅ Successfully subscribed to room updates!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[NON-HOST] ❌ Realtime subscription error!');
        }
      });

    return () => {
      console.log('[NON-HOST] Cleaning up - unsubscribing from game room changes');
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost, startGameAction]);

  // Fetch players from database
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const fetchedPlayers = await getPlayers(roomId);
        setPlayers(fetchedPlayers.map(p => ({
          id: p.id,
          name: p.player_name,
          isHost: p.is_host,
          isYou: p.id === playerId,
          isConnected: p.is_connected,
          isPsychic: p.is_psychic
        })));
        
        // Check if psychic is already assigned
        const psychic = fetchedPlayers.find(p => p.is_psychic);
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

  // Check if game is ready
  useEffect(() => {
    setIsGameReady(players.length >= 2 && selectedPsychic !== null);
  }, [players.length, selectedPsychic]);

  const handleAssignPsychic = async () => {
    try {
      const result = await assignRandomPsychic(roomId);
      setSelectedPsychic(result.psychicId);
      // Update local players list
      setPlayers(prev => prev.map(p => ({
        ...p,
        isPsychic: p.id === result.psychicId
      })));
    } catch (err) {
      console.error('Failed to assign psychic:', err);
    }
  };

  const handleStartGame = async () => {
    if (isGameReady && selectedPsychic && !isStarting) {
      setIsStarting(true);
      try {
        console.log('[HOST] Starting game...');
        const result = await startGame(roomId);
        console.log('[HOST] Game started successfully, transitioning to game screen');
        
        // Room status is updated in the API, Realtime will notify non-host players
        startGameAction(result);
      } catch (err) {
        console.error('[HOST] Failed to start game:', err);
        setIsStarting(false);
      }
    }
  };

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
            disabled={!isHost || !isGameReady || isStarting}
            className={`
              w-full py-6 px-8 text-2xl font-bold uppercase tracking-widest
              transition-all duration-300 border-2
              ${(isHost && isGameReady && !isStarting)
                ? 'bg-fuchsia-600 border-fuchsia-600 text-white hover:bg-fuchsia-700 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] cursor-pointer'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'
              }
            `}
          >
            {!isHost
              ? 'WAITING FOR HOST TO START...'
              : isStarting 
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