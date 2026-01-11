"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/lib/store";
import { useDialUpdates, useRoundUpdates, useGameStateUpdates, usePlayerUpdates, useNewRoundInserts } from "@/lib/hooks/useRealtimeSubscriptions";
import {
  ConceptPair,
  PsychicHint,
  DialNeedle
} from "@/components/ui/GameComponents";
import { createDialGradient } from "@/lib/theme";
import * as api from "@/lib/api-client";

// Extend Window interface for throttling
declare global {
  interface Window {
    _lastDialUpdate?: number;
  }
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

// HUD Display Component
interface GameHUDProps {
  roomName: string;
  round: number;
  maxRounds: number;
  score: number;
  lives: number;
  maxLives: number;
}

function GameHUD({ roomName, round, maxRounds, score, lives, maxLives }: GameHUDProps) {
  return (
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
              <div
                key={i}
                className={`text-xl ${i < lives ? "text-fuchsia-500" : "text-zinc-600"}`}
              >
                ♥
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Status Footer Component
interface PlayerStatusBarProps {
  players: Player[];
}

function PlayerStatusBar({ players }: PlayerStatusBarProps) {
  return (
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
                  ? "border-teal-500 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                  : "border-zinc-600 text-white"
                }
              `}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  player.isPsychic ? "bg-teal-400" : "bg-zinc-500"
                }`}
              ></div>
              <span className="text-sm font-medium">{player.name}</span>
              {player.isPsychic && (
                <span className="text-xs uppercase">(PSYCHIC)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Dial Position Indicator Component
interface DialPositionIndicatorProps {
  dialPosition: number;
  isDragging: boolean;
  isLocked: boolean;
  isPsychic: boolean;
  targetSet: boolean;
}

function DialPositionIndicator({ dialPosition, isDragging, isLocked, isPsychic, targetSet }: DialPositionIndicatorProps) {
  const getStatusText = () => {
    if (isPsychic) {
      if (targetSet) return "TARGET SET";
      if (isDragging) return "⟷ SETTING TARGET ⟷";
      return "SETTING TARGET";
    } else {
      if (!targetSet) return "WAITING";
      if (isLocked) return "LOCKED GUESS";
      if (isDragging) return "⟷ DRAGGING ⟷";
      return "CURRENT GUESS";
    }
  };

  return (
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-20">
      <div className="text-center">
        <div
          className={`text-2xl font-bold tracking-wider mb-1 transition-all duration-200 ${
            isDragging ? "text-pink-400 scale-110" : isPsychic ? "text-teal-400" : "text-fuchsia-500"
          }`}
        >
          {Math.round(dialPosition)}%
        </div>
        <div className="text-gray-400 text-sm uppercase tracking-wide mb-2">
          {getStatusText()}
        </div>

        {((isPsychic && !targetSet) || (!isPsychic && targetSet && !isLocked)) && (
          <div className="text-xs text-teal-400 mt-2 uppercase tracking-wide">
            Click and drag to adjust
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActiveGameScreen() {
  const router = useRouter();
  const { gameData, roundData, roomCode: storeRoomCode, playerName, updateTargetPosition } = useGameStore();

  const [dialPosition, setDialPosition] = useState(50); // Current needle position - now dynamic
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [targetSet, setTargetSet] = useState(false); // Track if psychic has set target
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [otherPlayerDials, setOtherPlayerDials] = useState<OtherPlayerDial[]>(
    []
  );
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [allPlayersLocked, setAllPlayersLocked] = useState(false);
  const [showPsychicResults, setShowPsychicResults] = useState(false);

  // Extract values with fallbacks for hook dependencies
  const roomId = gameData?.roomId || "";
  const playerId = gameData?.playerId || "";
  const round = roundData?.gameState.current_round || 0;
  const isPsychic =
    gameData?.playerId === roundData?.gameState.current_psychic_id;

  // Reset all round-specific states when round number changes (new round started)
  useEffect(() => {
    if (round > 0) {
      console.log("[ActiveGame] Round changed, resetting states for round:", round);
      setDialPosition(50); // Reset to center
      setIsDragging(false);
      setIsLocked(false);
      setTargetSet(false);
      setOtherPlayerDials([]);
      setAllPlayersLocked(false);
      setShowPsychicResults(false);
    }
  }, [round]);

  // Initialize targetSet and dialPosition from roundData when target_position exists
  useEffect(() => {
    if (roundData?.round.target_position !== null && roundData?.round.target_position !== undefined) {
      setTargetSet(true);
      // For psychic, set dialPosition to the target they set
      if (gameData?.playerId === roundData?.gameState.current_psychic_id) {
        setDialPosition(roundData.round.target_position);
      }
    }
  }, [roundData?.round.target_position, gameData?.playerId, roundData?.gameState.current_psychic_id]);

  // Handle dial updates from other players via custom hook
  const handleDialUpdate = useCallback((dials: OtherPlayerDial[]) => {
    setOtherPlayerDials(dials);
    console.log("[ActiveGame] Updated dial positions:", dials);
  }, []);

  useDialUpdates(roomId, round, playerId, isLocked, handleDialUpdate);

  // Fetch total player count
  useEffect(() => {
    const fetchPlayerCount = async () => {
      if (!roomId) {
        console.log("[ActiveGame] No roomId provided, skipping player count fetch");
        return;
      }

      try {
        const { count, error } = await supabase
          .from("players")
          .select("id", { count: "exact", head: true })
          .eq("room_id", roomId);

        if (error) {
          console.error("[ActiveGame] Error fetching player count:", error);
          throw error;
        }
        
        setTotalPlayers(count || 0);
        console.log("[ActiveGame] Total players in room:", count);
      } catch (err) {
        console.error("Failed to fetch player count:", err);
      }
    };

    fetchPlayerCount();
  }, [roomId]);

  // Mouse/Touch interaction functions
  const calculateAngleFromPointer = useCallback(
    (clientX: number, clientY: number, dialElement: HTMLElement) => {
      const rect = dialElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.bottom; // Bottom of the dial semicircle

      const angle =
        (Math.atan2(clientX - centerX, centerY - clientY) * 180) / Math.PI;
      const clampedAngle = Math.max(-90, Math.min(90, angle));

      // Convert angle to percentage (0% = left, 100% = right)
      const percentage = ((clampedAngle + 90) / 180) * 100;
      return Math.max(0, Math.min(100, percentage));
    },
    []
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Psychic can drag before target is set, non-psychic can drag after target is set
      if (isLocked || (isPsychic && targetSet) || (!isPsychic && !targetSet)) return;
      event.preventDefault();

      setIsDragging(true);
      const dialElement = event.currentTarget;
      const newPosition = calculateAngleFromPointer(
        event.clientX,
        event.clientY,
        dialElement
      );
      setDialPosition(newPosition);
    },
    [isLocked, isPsychic, targetSet, calculateAngleFromPointer]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      // Psychic can drag before target is set, non-psychic can drag after target is set
      if (isLocked || (isPsychic && targetSet) || (!isPsychic && !targetSet)) return;
      event.preventDefault();

      const touch = event.touches[0];
      setIsDragging(true);
      const dialElement = event.currentTarget;
      const newPosition = calculateAngleFromPointer(
        touch.clientX,
        touch.clientY,
        dialElement
      );
      setDialPosition(newPosition);
    },
    [isLocked, isPsychic, targetSet, calculateAngleFromPointer]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || isLocked) return;
      // Psychic can drag before target is set, non-psychic can drag after target is set
      if ((isPsychic && targetSet) || (!isPsychic && !targetSet)) return;

      const dialElement = document.querySelector(
        "#dial-container"
      ) as HTMLElement;
      if (dialElement) {
        const newPosition = calculateAngleFromPointer(
          event.clientX,
          event.clientY,
          dialElement
        );
        setDialPosition(newPosition);
      }
    },
    [isDragging, isLocked, isPsychic, targetSet, calculateAngleFromPointer]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isDragging || isLocked) return;
      // Psychic can drag before target is set, non-psychic can drag after target is set
      if ((isPsychic && targetSet) || (!isPsychic && !targetSet)) return;
      event.preventDefault();

      const touch = event.touches[0];
      const dialElement = document.querySelector(
        "#dial-container"
      ) as HTMLElement;
      if (dialElement) {
        const newPosition = calculateAngleFromPointer(
          touch.clientX,
          touch.clientY,
          dialElement
        );
        setDialPosition(newPosition);
      }
    },
    [isDragging, isLocked, isPsychic, targetSet, calculateAngleFromPointer]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse and touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.body.style.userSelect = "";
    };
  }, [
    isDragging,
    isLocked,
    isPsychic,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Sample players
  const players: Player[] = [
    { id: "1", name: "Player 001", isPsychic: false },
    { id: "2", name: "Player 218", isPsychic: true },
    { id: "3", name: playerName, isPsychic: false },
    { id: "4", name: "Player 456", isPsychic: false },
  ];

  // Check if all players have locked in
  useEffect(() => {
    console.log(
      "[ActiveGame] Checking lock status. totalPlayers:",
      totalPlayers,
      "isPsychic:",
      isPsychic,
      "isLocked:",
      isLocked,
      "otherPlayerDials:",
      otherPlayerDials
    );

    if (totalPlayers === 0) {
      console.log("[ActiveGame] Waiting for player count...");
      return;
    }

    // Psychic doesn't lock in, so subtract 1 from total
    const nonPsychicPlayerCount = totalPlayers - 1;
    const lockedCount =
      otherPlayerDials.filter((d) => d.isLocked).length +
      (isLocked && !isPsychic ? 1 : 0);
    const allLocked = lockedCount === nonPsychicPlayerCount;

    console.log("[ActiveGame] Lock status:", {
      lockedCount,
      totalPlayers,
      nonPsychicPlayerCount,
      allLocked,
      isPsychic,
      myLockStatus: isLocked,
      otherPlayersLocked: otherPlayerDials.filter((d) => d.isLocked).length,
      otherPlayerDials: otherPlayerDials.map((d) => ({
        id: d.playerId,
        locked: d.isLocked,
        pos: d.position,
      })),
    });

    if (allLocked && !allPlayersLocked) {
      console.log(
        "[ActiveGame] ✅ All players locked in!"
      );
      setAllPlayersLocked(true);

      // For psychic: show results inline with next round button
      // For non-psychic: auto-navigate to results screen
      if (isPsychic) {
        console.log("[ActiveGame] Showing results to psychic");
        setShowPsychicResults(true);
      } else {
        const roomCodeToUse = gameData?.roomCode || storeRoomCode;
        setTimeout(() => {
          console.log("[ActiveGame] Transitioning to results screen");
          if (roomCodeToUse) {
            router.push(`/room/${roomCodeToUse}/results`);
          }
        }, 2000);
      }
    }
  }, [
    otherPlayerDials,
    isLocked,
    totalPlayers,
    allPlayersLocked,
    gameData,
    storeRoomCode,
    router,
    isPsychic,
  ]);

  // Glitch effect for hint text
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Monitor target position changes (for non-psychic players waiting) via realtime
  const handleRoundUpdate = useCallback((roundData: {target_position: number | null}) => {
    if (roundData.target_position !== null && roundData.target_position !== undefined) {
      setTargetSet(true);
      // Update the store with the target position
      updateTargetPosition(roundData.target_position);
    }
  }, [updateTargetPosition]);

  // Subscribe to round updates only for non-psychic players
  useRoundUpdates(
    !isPsychic ? roomId : undefined,
    !isPsychic ? round : undefined,
    handleRoundUpdate
  );

  // Subscribe to game state updates for ALL players
  // PERFORMANCE: Hook now updates store directly, callback only for special cases
  const handleGameStateUpdate = useCallback(async () => {
    console.log('[ActiveGame] 🔄 Game state updated via realtime');
    // Store is already updated by the hook, no additional action needed
  }, []);

  useGameStateUpdates(roomId, handleGameStateUpdate);

  // Subscribe to player updates to detect psychic role changes
  // PERFORMANCE: Hook now tracks changes, callback only when psychic status changes
  const handlePlayerUpdate = useCallback(async () => {
    console.log('[ActiveGame] 🎭 Psychic role changed, refreshing game state...');
    const { loadGameState } = useGameStore.getState();
    await loadGameState();
  }, []);

  usePlayerUpdates(playerId, handlePlayerUpdate);

  // Subscribe to new round INSERT events for ALL players
  // PERFORMANCE: Hook now updates store directly from payload
  const handleNewRound = useCallback(() => {
    console.log('[ActiveGame] 🎯 New round detected via realtime');
    // Store already updated by the hook, no need to refetch
  }, []);

  useNewRoundInserts(roomId, handleNewRound);

  // Helper function to update dial position in database
  const updateDialPosition = async (position: number, locked: boolean) => {
    try {
      await supabase.from("dial_updates").upsert(
        {
          room_id: roomId,
          round_number: round,
          player_id: playerId,
          dial_position: position,
          is_locked: locked,
        },
        {
          onConflict: "room_id,round_number,player_id",
        }
      );
    } catch (err) {
      console.error("Failed to update dial position:", err);
    }
  };

  const handleLockIn = async () => {
    setIsLocked(true);

    try {
      // Update dial position with locked status
      await updateDialPosition(dialPosition, true);
      console.log(`${playerName} locked in guess at ${dialPosition}%`);
    } catch (err) {
      console.error("Failed to lock position:", err);
      // Revert lock state on error
      setIsLocked(false);
    }
  };

  const handleSetRandomTarget = async () => {
    if (!isPsychic || !roomId || !round) return;
    
    // Generate random position between 0 and 100
    const randomPosition = Math.floor(Math.random() * 101);
    setDialPosition(randomPosition);
    // Don't set isLocked for psychic - they need to receive dial updates from other players
    
    try {
      console.log(`[PSYCHIC] Setting random target position at ${randomPosition}%`);
      await api.setTargetPosition(roomId, round, randomPosition);
      
      // Update the store with the new target position
      updateTargetPosition(randomPosition);
      
      setTargetSet(true);
      console.log(`[PSYCHIC] Random target position set successfully`);
    } catch (err) {
      console.error("Failed to set random target position:", err);
    }
  };

  const handleSetTarget = async () => {
    if (!isPsychic || !roomId || !round) return;
    
    // Don't set isLocked for psychic - they need to receive dial updates from other players
    
    try {
      console.log(`[PSYCHIC] Setting target position at ${dialPosition}%`);
      await api.setTargetPosition(roomId, round, dialPosition);
      
      // Update the store with the new target position
      updateTargetPosition(dialPosition);
      
      setTargetSet(true);
      console.log(`[PSYCHIC] Target position set successfully`);
    } catch (err) {
      console.error("Failed to set target position:", err);
    }
  };

  // Calculate needle angle (-90 to 90 degrees for semicircle)
  const needleAngle = -90 + (dialPosition / 100) * 180;

  // Handler for psychic to advance to next round
  const handleNextRound = async () => {
    if (!roomId) return;
    
    try {
      console.log('[ActiveGame] Advancing to next round...');
      
      // Call API to rotate psychic and create new round - API returns the new round data
      const result = await api.advanceRound(roomId);
      console.log('[ActiveGame] Round advanced successfully:', result);
      
      // Update local state with the returned round data
      if (result && result.newRound) {
        const { setRoundData } = useGameStore.getState();
        
        // Fetch updated game state with new round number and psychic
        const { data: gameStateData, error: gameStateError } = await supabase
          .from('game_state')
          .select()
          .eq('room_id', roomId)
          .single();
          
        if (gameStateError) {
          console.error('[ActiveGame] Failed to fetch updated game state:', gameStateError);
        } else {
          setRoundData({
            gameState: gameStateData,
            round: result.newRound
          });
          console.log('[ActiveGame] Game state updated locally with new round data');
        }
      }
      
      console.log('[ActiveGame] Ready for new round');
    } catch (err) {
      console.error('[ActiveGame] Failed to advance round:', err);
    }
  };

  // Early return after all hooks
  if (!gameData) return null;

  // Show loading state while waiting for round data
  if (!roundData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-teal-400 mb-4">
            WAITING FOR PSYCHIC TO START THE ROUND...
          </div>
          <div className="text-gray-400">
            Loading game state...
          </div>
        </div>
      </div>
    );
  }

  // Extract display values
  const roomName = gameData.gameSettings.roomName;
  const maxRounds = gameData.gameSettings.numberOfRounds;
  const maxLives = gameData.gameSettings.numberOfLives;
  const score = roundData.gameState.team_score;
  const lives = roundData.gameState.lives_remaining;
  const leftConcept = roundData.round.left_concept;
  const rightConcept = roundData.round.right_concept;
  const psychicHint = roundData.round.psychic_hint;
  const targetPosition = roundData.round.target_position;
  const targetPos = targetPosition ?? 50; // Default to center if not provided

  console.log(
    "[ActiveGame] Gradient values - targetPosition:",
    targetPosition,
    "targetPos:",
    targetPos,
    "isPsychic:",
    isPsychic
  );

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Top HUD Bar */}
      <GameHUD
        roomName={roomName}
        round={round}
        maxRounds={maxRounds}
        score={score}
        lives={lives}
        maxLives={maxLives}
      />

      {/* Upper Game Area - Binary Concepts */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Binary Card */}
          <ConceptPair leftConcept={leftConcept} rightConcept={rightConcept} />

          {/* Psychic's Hint */}
          <PsychicHint hint={psychicHint} glitchEffect={glitchEffect} />
        </div>
      </div>

      {/* Central Game Area - Spectrum Dial */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="relative w-full max-w-2xl mx-auto">
          {/* Dial Container */}
          <div
            id="dial-container"
            className={`relative w-full max-w-[500px] h-[250px] mx-auto select-none ${
              !isLocked && !isPsychic
                ? isDragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-not-allowed"
            }`}
            onMouseDown={isPsychic ? (targetSet ? undefined : handleMouseDown) : (targetSet ? handleMouseDown : undefined)}
            onTouchStart={isPsychic ? (targetSet ? undefined : handleTouchStart) : (targetSet ? handleTouchStart : undefined)}
            style={{ touchAction: "none" }}
          >
            {/* Semicircle Board - Show gradient only to psychic before target set, hide from non-psychic until revealed */}
            <div
              className="absolute w-full h-full rounded-t-full overflow-hidden shadow-2xl"
              style={{
                background: (() => {
                  // Psychic always sees gradient based on their current dial position (before and after setting)
                  if (isPsychic) {
                    return createDialGradient(dialPosition);
                  }
                  // Non-psychic players see gradient only after round is revealed (all locked in)
                  if (!isPsychic && allPlayersLocked && targetPos !== null) {
                    return createDialGradient(targetPos);
                  }
                  // Default gray (non-psychic players during guessing, or waiting)
                  return "rgb(63, 63, 70)";
                })(),
                boxShadow:
                  "inset 0 5px 15px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* Outer border rings */}
              <div
                className="absolute inset-0 rounded-t-full border-2 border-zinc-700"
                style={{ borderBottom: "none" }}
              ></div>
              <div
                className="absolute inset-2 rounded-t-full border border-zinc-800"
                style={{ borderBottom: "none" }}
              ></div>
            </div>

            {/* Needle Container */}
            <DialNeedle
              position={dialPosition}
              isDragging={isDragging}
              showPivot={true}
            />
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
          <DialPositionIndicator
            dialPosition={dialPosition}
            isDragging={isDragging}
            isLocked={isLocked}
            isPsychic={isPsychic}
            targetSet={targetSet}
          />
        </div>
      </div>

      {/* Action Area */}
      <div className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {isPsychic && showPsychicResults ? (
            // Psychic results view with player scores
            <div className="space-y-6">
              <div className="bg-zinc-900 border-2 border-teal-500 p-6">
                <h2 className="text-2xl font-bold text-teal-400 mb-4 uppercase tracking-wider">
                  All Players Locked In - Results
                </h2>
                <div className="space-y-3">
                  {otherPlayerDials.map((player) => {
                    const distance = Math.abs(player.position - targetPos);
                    const score = Math.max(0, 100 - distance);
                    return (
                      <div
                        key={player.playerId}
                        className="bg-zinc-800 border border-zinc-700 p-4 flex justify-between items-center"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-fuchsia-500 rounded-full"></div>
                          <span className="text-white font-medium">{player.playerName}</span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-gray-400">
                            Guess: <span className="text-white font-bold">{Math.round(player.position)}%</span>
                          </div>
                          <div className="text-gray-400">
                            Distance: <span className="text-fuchsia-400 font-bold">{Math.round(distance)}</span>
                          </div>
                          <div className="text-teal-400 font-bold text-xl">
                            +{Math.round(score)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-700 text-center">
                  <div className="text-gray-400">
                    Target Position: <span className="text-teal-400 font-bold text-xl">{Math.round(targetPos)}%</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleNextRound}
                className="w-full py-6 px-8 text-3xl font-bold uppercase tracking-widest transition-all duration-300 border-2 relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-700 border-teal-500 text-white hover:from-teal-500 hover:to-teal-600 hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] cursor-pointer"
              >
                Next Round →
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
              </button>
            </div>
          ) : isPsychic ? (
            // Psychic buttons - set target position or random
            <div className="flex gap-4">
              <button
                onClick={handleSetTarget}
                disabled={targetSet}
                className={`
                  flex-1 py-6 px-8 text-3xl font-bold uppercase tracking-widest
                  transition-all duration-300 border-2 relative overflow-hidden
                  ${
                    targetSet
                      ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-teal-700 border-teal-500 text-white hover:from-teal-500 hover:to-teal-600 hover:shadow-[0_0_40px_rgba(20,184,166,0.6)] cursor-pointer"
                  }
                `}
              >
                {targetSet ? "TARGET SET - WAITING FOR PLAYERS" : "SET TARGET POSITION"}
                {!targetSet && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
                )}
              </button>
              <button
                onClick={handleSetRandomTarget}
                disabled={targetSet}
                className={`
                  flex-1 py-6 px-8 text-3xl font-bold uppercase tracking-widest
                  transition-all duration-300 border-2 relative overflow-hidden
                  ${
                    targetSet
                      ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500 text-white hover:from-purple-500 hover:to-purple-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] cursor-pointer"
                  }
                `}
              >
                {targetSet ? "TARGET SET" : "RANDOM TARGET"}
                {!targetSet && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
                )}
              </button>
            </div>
          ) : !targetSet ? (
            // Non-psychic waiting for target
            <button
              disabled
              className="w-full py-6 px-8 text-3xl font-bold uppercase tracking-widest transition-all duration-300 border-2 relative overflow-hidden bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
            >
              WAITING FOR PSYCHIC TO SET TARGET...
            </button>
          ) : (
            // Non-psychic guessing
            <button
              onClick={handleLockIn}
              disabled={isLocked}
              className={`
                w-full py-6 px-8 text-3xl font-bold uppercase tracking-widest
                transition-all duration-300 border-2 relative overflow-hidden
                ${
                  isLocked
                    ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 border-fuchsia-500 text-white hover:from-fuchsia-500 hover:to-fuchsia-600 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] cursor-pointer"
                }
              `}
            >
              {isLocked ? "GUESS LOCKED IN" : "LOCK IN GUESS"}
              {!isLocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse"></div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer - Player Status */}
      <PlayerStatusBar players={players} />

      {/* Back button for testing */}
      <div className="absolute top-20 left-4">
        <button
          onClick={() => {
            const roomCodeToUse = gameData?.roomCode || storeRoomCode;
            if (roomCodeToUse) router.push(`/room/${roomCodeToUse}`);
          }}
          className="px-4 py-2 text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300"
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}
