'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Extend Window interface for throttling
declare global {
  interface Window {
    _lastDialUpdate?: number;
  }
}

interface ActiveGameScreenProps {
  roomId: string;
  roomName: string;
  round: number;
  maxRounds: number;
  score: number;
  lives: number;
  maxLives: number;
  playerId: string;
  playerName: string;
  peerId: string;
  isPsychic?: boolean;
  leftConcept: string;
  rightConcept: string;
  psychicHint: string;
  targetPosition?: number;
  onLockInGuess?: (position: number) => void;
  onBack?: () => void;
  onShowResults?: () => void;
}

interface Player {
  id: string;
  name: string;
  isPsychic: boolean;
}

interface OtherPlayerDial {
  playerId: string;
  playerName: string;
  position: number;
  isLocked: boolean;
}

export default function ActiveGameScreen({
  roomId,
  roomName,
  round = 1,
  maxRounds = 5,
  score = 0,
  lives = 3,
  maxLives = 3,
  playerId,
  playerName,
  peerId,
  isPsychic = false,
  leftConcept,
  rightConcept,
  psychicHint,
  targetPosition,
  onLockInGuess,
  onBack,
  onShowResults
}: ActiveGameScreenProps) {
  const targetWidth = 10; // 10% wide
  
  const [dialPosition, setDialPosition] = useState(50); // Current needle position - now dynamic
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [otherPlayerDials, setOtherPlayerDials] = useState<OtherPlayerDial[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [allPlayersLocked, setAllPlayersLocked] = useState(false);

  // Fetch total player count
  useEffect(() => {
    const fetchPlayerCount = async () => {
      try {
        const { count, error } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomId);
        
        if (error) throw error;
        setTotalPlayers(count || 0);
        console.log('[ActiveGame] Total players in room:', count);
      } catch (err) {
        console.error('Failed to fetch player count:', err);
      }
    };
    
    fetchPlayerCount();
  }, [roomId]);

  // Fetch existing dial positions (also used for polling)
  const fetchExistingDials = async () => {
    try {
      const { data, error } = await supabase
        .from('dial_updates')
        .select('player_id, dial_position, is_locked')
        .eq('room_id', roomId)
        .eq('round_number', round)
        .neq('player_id', playerId);
      
      if (error) {
        console.error('[ActiveGame] Error fetching existing dials:', error);
        throw error;
      }
      
      if (data) {
        const dials = data.map(d => ({
          playerId: d.player_id,
          playerName: 'Player',
          position: d.dial_position,
          isLocked: d.is_locked
        }));
        setOtherPlayerDials(dials);
        console.log('[ActiveGame] Updated dial positions:', dials);
      }
    } catch (err) {
      console.error('[ActiveGame] Failed to fetch existing dials:', err);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    console.log('[ActiveGame] Initial fetch for room:', roomId, 'round:', round);
    fetchExistingDials();
  }, [roomId, round, playerId]);

  // Polling fallback - check every 2 seconds for updates
  useEffect(() => {
    console.log('[ActiveGame] Starting polling for dial updates');
    const pollInterval = setInterval(() => {
      if (!isLocked) {
        // Only poll while we haven't locked yet
        fetchExistingDials();
      }
    }, 2000);

    return () => {
      console.log('[ActiveGame] Stopping polling');
      clearInterval(pollInterval);
    };
  }, [roomId, round, playerId, isLocked]);

  // Subscribe to dial position updates via Realtime
  useEffect(() => {
    console.log('[ActiveGame] Setting up Realtime subscription for dial updates');
    
    const channel = supabase
      .channel(`dial-updates-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dial_updates',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          console.log('[Realtime] Dial update received:', payload);
          console.log('[Realtime] Payload details - eventType:', payload.eventType, 'new:', payload.new);
          
          // Handle the update
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const update = payload.new as any;
            
            // Ignore updates from yourself
            if (update?.player_id === playerId) {
              console.log('[Realtime] Ignoring my own update');
              return;
            }
            
            console.log('[Realtime] Processing update for player:', update?.player_id, 'locked:', update?.is_locked, 'position:', update?.dial_position);
            
            setOtherPlayerDials(prev => {
              const existing = prev.find(d => d.playerId === update.player_id);
              const newDial = {
                playerId: update.player_id,
                playerName: existing?.playerName || 'Player',
                position: update.dial_position,
                isLocked: update.is_locked
              };
              
              if (existing) {
                console.log('[Realtime] Updating existing player dial:', newDial);
                return prev.map(d => 
                  d.playerId === update.player_id ? newDial : d
                );
              } else {
                console.log('[Realtime] Adding new player dial:', newDial);
                return [...prev, newDial];
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[ActiveGame] Realtime subscription status:', status);
      });

    return () => {
      console.log('[ActiveGame] Cleaning up dial updates subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId, round, playerId]);

  // Scoring zones (like the original Wavelength game)
  const targetPos = targetPosition ?? 50; // Default to center if not provided
  const scoringZones = [
    { start: targetPos, width: 4, color: '#ef4444', points: 4, label: 'PERFECT' }, // Red center
    { start: targetPos - 2, width: 2, color: '#f97316', points: 3, label: 'GREAT' }, // Orange
    { start: targetPos + 4, width: 2, color: '#f97316', points: 3, label: 'GREAT' }, // Orange
    { start: targetPos - 4, width: 2, color: '#eab308', points: 2, label: 'GOOD' }, // Yellow
    { start: targetPos + 6, width: 2, color: '#eab308', points: 2, label: 'GOOD' }, // Yellow
    { start: targetPos - 6, width: 2, color: '#06b6d4', points: 1, label: 'CLOSE' }, // Cyan
    { start: targetPos + 8, width: 2, color: '#06b6d4', points: 1, label: 'CLOSE' }, // Cyan
  ];

  // Mouse/Touch interaction functions
  const calculateAngleFromPointer = (clientX: number, clientY: number, dialElement: HTMLElement) => {
    const rect = dialElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom; // Bottom of the dial semicircle
    
    const angle = (Math.atan2(clientX - centerX, centerY - clientY) * 180) / Math.PI;
    const clampedAngle = Math.max(-90, Math.min(90, angle));
    
    // Convert angle to percentage (0% = left, 100% = right)
    const percentage = ((clampedAngle + 90) / 180) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    event.preventDefault();
    
    setIsDragging(true);
    const dialElement = event.currentTarget;
    const newPosition = calculateAngleFromPointer(event.clientX, event.clientY, dialElement);
    setDialPosition(newPosition);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    setIsDragging(true);
    const dialElement = event.currentTarget;
    const newPosition = calculateAngleFromPointer(touch.clientX, touch.clientY, dialElement);
    setDialPosition(newPosition);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging || isLocked) return;
    
    const dialElement = document.querySelector('#dial-container') as HTMLElement;
    if (dialElement) {
      const newPosition = calculateAngleFromPointer(event.clientX, event.clientY, dialElement);
      setDialPosition(newPosition);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging || isLocked) return;
    event.preventDefault();
    
    const touch = event.touches[0];
    const dialElement = document.querySelector('#dial-container') as HTMLElement;
    if (dialElement) {
      const newPosition = calculateAngleFromPointer(touch.clientX, touch.clientY, dialElement);
      setDialPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add global mouse and touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isLocked]);

  // Sample players
  const players: Player[] = [
    { id: '1', name: 'Player 001', isPsychic: false },
    { id: '2', name: 'Player 218', isPsychic: true },
    { id: '3', name: playerName, isPsychic: false },
    { id: '4', name: 'Player 456', isPsychic: false },
  ];

  // Check if all players have locked in
  useEffect(() => {
    console.log('[ActiveGame] Checking lock status. totalPlayers:', totalPlayers, 'isLocked:', isLocked, 'otherPlayerDials:', otherPlayerDials);
    
    if (totalPlayers === 0) {
      console.log('[ActiveGame] Waiting for player count...');
      return;
    }
    
    const lockedCount = otherPlayerDials.filter(d => d.isLocked).length + (isLocked ? 1 : 0);
    const allLocked = lockedCount === totalPlayers;
    
    console.log('[ActiveGame] Lock status:', { 
      lockedCount, 
      totalPlayers, 
      allLocked,
      myLockStatus: isLocked,
      otherPlayersLocked: otherPlayerDials.filter(d => d.isLocked).length,
      otherPlayerDials: otherPlayerDials.map(d => ({ id: d.playerId, locked: d.isLocked, pos: d.position }))
    });
    
    if (allLocked && !allPlayersLocked) {
      console.log('[ActiveGame] ✅ All players locked in! Transitioning to results...');
      setAllPlayersLocked(true);
      
      // Navigate to results screen after a short delay
      setTimeout(() => {
        console.log('[ActiveGame] Calling onShowResults callback');
        if (onShowResults) {
          onShowResults();
        } else {
          console.warn('[ActiveGame] onShowResults callback is not defined!');
        }
      }, 1500);
    }
  }, [otherPlayerDials, isLocked, totalPlayers, allPlayersLocked, onShowResults]);

  // Glitch effect for hint text
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to update dial position in database
  const updateDialPosition = async (position: number, locked: boolean) => {
    try {
      await supabase
        .from('dial_updates')
        .upsert({
          room_id: roomId,
          round_number: round,
          player_id: playerId,
          dial_position: position,
          is_locked: locked
        }, {
          onConflict: 'room_id,round_number,player_id'
        });
    } catch (err) {
      console.error('Failed to update dial position:', err);
    }
  };

  const handleLockIn = async () => {
    setIsLocked(true);
    
    try {
      // Update dial position with locked status
      await updateDialPosition(dialPosition, true);
      
      onLockInGuess?.(dialPosition);
    } catch (err) {
      console.error('Failed to lock position:', err);
      // Revert lock state on error
      setIsLocked(false);
    }
  };

  // Calculate needle angle (-90 to 90 degrees for semicircle)
  const needleAngle = -90 + (dialPosition / 100) * 180;

  // Create gradient for scoring zones
  const createDialGradient = () => {
    const targetAngle = targetPos * 1.8 - 90; // Convert percentage to degrees
    
    return `conic-gradient(
      from -90deg at 50% 100%,
      rgb(63, 63, 70) 0deg ${targetAngle - 22.5 + 90}deg,
      #06b6d4 ${targetAngle - 22.5 + 90}deg ${targetAngle - 13.5 + 90}deg,
      #eab308 ${targetAngle - 13.5 + 90}deg ${targetAngle - 4.5 + 90}deg,
      #f97316 ${targetAngle - 4.5 + 90}deg ${targetAngle + 4.5 + 90}deg,
      #ef4444 ${targetAngle + 4.5 + 90}deg ${targetAngle + 13.5 + 90}deg,
      #f97316 ${targetAngle + 13.5 + 90}deg ${targetAngle + 22.5 + 90}deg,
      rgb(63, 63, 70) ${targetAngle + 22.5 + 90}deg 180deg
    )`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      
      {/* Top HUD Bar */}
      <div className="bg-zinc-900 border-b-2 border-zinc-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-white tracking-wider uppercase">
            {roomName}
          </h1>
          <div className="text-fuchsia-400 font-medium tracking-wide">
            ROUND {round}/{maxRounds}
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-teal-400 font-bold tracking-wide">SCORE:</span>
            <span className="text-white text-xl font-bold">{score}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-fuchsia-400 font-bold tracking-wide">LIVES:</span>
            <div className="flex space-x-1">
              {Array.from({ length: maxLives }, (_, i) => (
                <div key={i} className={`text-xl ${i < lives ? 'text-fuchsia-500' : 'text-zinc-600'}`}>
                  ♥
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upper Game Area - Binary Concepts */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Binary Card */}
          <div className="bg-zinc-900 border-2 border-teal-500 shadow-[0_0_25px_rgba(20,184,166,0.3)] p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl lg:text-3xl font-bold text-teal-400 tracking-wider uppercase">
                {leftConcept}
              </div>
              
              {/* Digital Connection Line */}
              <div className="flex-1 mx-8 flex items-center">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-500 via-zinc-600 to-teal-500"></div>
                <div className="text-teal-500 mx-4 text-2xl">⟷</div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-500 via-zinc-600 to-teal-500"></div>
              </div>
              
              <div className="text-2xl lg:text-3xl font-bold text-teal-400 tracking-wider uppercase">
                {rightConcept}
              </div>
            </div>
          </div>

          {/* Psychic's Hint */}
          <div className="text-center mb-8">
            <div className="bg-zinc-900 border-2 border-fuchsia-600 inline-block px-8 py-6 relative overflow-hidden">
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-500/10 to-transparent opacity-50 animate-pulse"></div>
              
              <div className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-2">
                PSYCHIC TRANSMISSION
              </div>
              <div className={`text-3xl lg:text-4xl font-bold text-white tracking-wider transition-all duration-100 ${glitchEffect ? 'animate-pulse text-fuchsia-500' : ''}`}>
                "{psychicHint}"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Central Game Area - Spectrum Dial */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="relative w-full max-w-2xl mx-auto">
          {/* Dial Container */}
          <div 
            id="dial-container"
            className={`relative w-full max-w-[500px] h-[250px] mx-auto select-none ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
          >
            {/* Semicircle Board with Scoring Zones */}
            <div 
              className="absolute w-full h-full rounded-t-full overflow-hidden shadow-2xl"
              style={{
                background: isPsychic ? createDialGradient() : 'rgb(63, 63, 70)',
                boxShadow: 'inset 0 5px 15px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Outer border rings */}
              <div className="absolute inset-0 rounded-t-full border-2 border-zinc-700" 
                   style={{ borderBottom: 'none' }}></div>
              <div className="absolute inset-2 rounded-t-full border border-zinc-800" 
                   style={{ borderBottom: 'none' }}></div>
              
              {/* Other players' dial indicators */}
              {otherPlayerDials.map((otherDial) => {
                const otherNeedleAngle = -90 + (otherDial.position / 100) * 180;
                return (
                  <div
                    key={otherDial.playerId}
                    className="absolute bottom-0 left-1/2 w-8 h-[200px] pointer-events-none"
                    style={{ transform: 'translateX(-50%)' }}
                  >
                    {/* Other player's needle */}
                    <div
                      className="absolute bottom-0 left-1/2 w-1 h-[180px] rounded-t-full opacity-60"
                      style={{
                        background: otherDial.isLocked ? 'rgb(34, 197, 94)' : 'rgb(99, 102, 241)',
                        transformOrigin: 'bottom center',
                        transform: `translateX(-50%) rotate(${otherNeedleAngle}deg)`,
                        boxShadow: otherDial.isLocked 
                          ? '0 0 10px rgba(34, 197, 94, 0.6)' 
                          : '0 0 10px rgba(99, 102, 241, 0.4)'
                      }}
                    />
                  </div>
                );
              })}
            </div>



            {/* Needle Container */}
            <div 
              className="absolute bottom-0 left-1/2 w-10 h-[220px] pointer-events-none"
              style={{ transform: 'translateX(-50%)' }}
            >
              {/* Needle */}
              <div
                className={`absolute bottom-0 left-1/2 w-1.5 h-[200px] rounded-t-full transition-all duration-100 ${isDragging ? 'animate-pulse' : ''}`}
                style={{
                  background: isDragging ? 'rgb(255, 20, 147)' : 'rgb(236, 72, 153)',
                  transformOrigin: 'bottom center',
                  transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                  boxShadow: isDragging 
                    ? '0 0 20px rgba(255, 20, 147, 0.8), 0 0 40px rgba(255, 20, 147, 0.4)' 
                    : '0 0 15px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.4)',
                  filter: isDragging 
                    ? 'drop-shadow(0 0 8px rgb(255, 20, 147))' 
                    : 'drop-shadow(0 0 6px rgb(236, 72, 153))'
                }}
              />

              {/* Pivot Point */}
              <div 
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 pointer-events-auto"
                style={{ cursor: !isLocked ? 'grab' : 'not-allowed' }}
              >
                {/* Enlarged hit area */}
                <div className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
                
                {/* Outer ring */}
                <div 
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 -translate-x-1/2 -translate-y-1/2 absolute`}
                  style={{
                    backgroundColor: 'rgb(39, 39, 42)',
                    borderColor: isDragging ? 'rgb(255, 20, 147)' : 'rgb(236, 72, 153)',
                    boxShadow: isDragging
                      ? '0 0 20px rgba(255, 20, 147, 0.8)'
                      : '0 0 15px rgba(236, 72, 153, 0.6)'
                  }}
                />
                
                {/* Inner circle */}
                <div 
                  className="w-4 h-4 rounded-full transition-all duration-200 -translate-x-1/2 -translate-y-1/2 absolute"
                  style={{
                    backgroundColor: isDragging ? 'rgb(255, 20, 147)' : 'rgb(236, 72, 153)',
                    boxShadow: '0 0 10px rgba(236, 72, 153, 1)'
                  }}
                />
                
                {/* Center dot */}
                <div className="w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 absolute"></div>
              </div>
            </div>


          </div>

          {/* Spectrum Extremes Labels */}
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 -mt-4">
            <div className="text-lg lg:text-xl font-bold text-teal-400 tracking-wider uppercase">
              {leftConcept}
            </div>
            <div className="text-lg lg:text-xl font-bold text-teal-400 tracking-wider uppercase">
              {rightConcept}
            </div>
          </div>

          {/* Current Position Indicator with Score Zone Info */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-20">
            <div className="text-center">
              <div className={`text-2xl font-bold tracking-wider mb-1 transition-all duration-200 ${isDragging ? 'text-pink-400 scale-110' : 'text-fuchsia-500'}`}>
                {Math.round(dialPosition)}%
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wide mb-2">
                {isLocked ? 'LOCKED GUESS' : isDragging ? '⟷ DRAGGING ⟷' : 'CURRENT GUESS'}
              </div>
              
              {/* Show what score zone the needle is in (psychic only) */}
              {isPsychic && (
                <div className="text-xs text-zinc-300">
                  {(() => {
                    const currentZone = scoringZones.find(zone => 
                      dialPosition >= zone.start && dialPosition <= zone.start + zone.width
                    );
                    if (currentZone) {
                      return (
                        <span style={{ color: currentZone.color }} className="font-bold">
                          {currentZone.label} ({currentZone.points} PTS)
                        </span>
                      );
                    }
                    return <span className="text-zinc-500">NO SCORE</span>;
                  })()}
                </div>
              )}
              
              {!isLocked && (
                <div className="text-xs text-teal-400 mt-2 uppercase tracking-wide">
                  Click and drag to adjust
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleLockIn}
            disabled={isLocked}
            className={`
              w-full py-6 px-8 text-3xl font-bold uppercase tracking-widest
              transition-all duration-300 border-2 relative overflow-hidden
              ${isLocked
                ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 border-fuchsia-500 text-white hover:from-fuchsia-500 hover:to-fuchsia-600 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] cursor-pointer'
              }
            `}
          >
            {isLocked ? 'GUESS LOCKED IN' : 'LOCK IN GUESS'}
            {!isLocked && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
            )}
          </button>
        </div>
      </div>

      {/* Footer - Player Status */}
      <div className="bg-zinc-900 border-t-2 border-zinc-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-6">
          <div className="text-gray-400 text-sm font-bold tracking-widest uppercase">
            PARTICIPANTS:
          </div>
          <div className="flex space-x-4">
            {players.map((player) => (
              <div
                key={player.id}
                className={`
                  flex items-center space-x-2 px-3 py-2 border-2 bg-zinc-800
                  ${player.isPsychic 
                    ? 'border-teal-500 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]' 
                    : 'border-zinc-600 text-white'
                  }
                `}
              >
                <div className={`w-2 h-2 rounded-full ${player.isPsychic ? 'bg-teal-400' : 'bg-zinc-500'}`}></div>
                <span className="text-sm font-medium">{player.name}</span>
                {player.isPsychic && <span className="text-xs uppercase">(PSYCHIC)</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Back button for testing */}
      {onBack && (
        <div className="absolute top-20 left-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300"
          >
            ← BACK
          </button>
        </div>
      )}
    </div>
  );
}