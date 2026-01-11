'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { ActionButton } from '@/components/ui/ActionButton';
import { actions } from '@/lib/actions';
import { GameHUD } from '@/components/ui/GameHUD';
import { ResultsDial } from '@/components/ui/ResultsDial';
import { PlayerScoresTable } from '@/components/ui/PlayerScoresTable';

// Local interface matching component's usage
interface PlayerGuess {
  playerId: string;
  playerName: string;
  position: number;
  distance: number;
  points: number;
}

export default function ResultsScreen() {
  const router = useRouter();
  const { 
    gameData, 
    roundData,
    roomCode: storeRoomCode
  } = useGameStore();
  
  const [playerGuesses, setPlayerGuesses] = useState<PlayerGuess[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancingRound, setAdvancingRound] = useState(false);

  const handleNextRound = async () => {
    try {
      setAdvancingRound(true);
      const { advanceToNextRound } = useGameStore.getState();
      await advanceToNextRound(router);
    } catch (err) {
      console.error('[ResultsScreen] Failed to advance round:', err);
      setAdvancingRound(false);
    }
  };

  const handleBackToLobby = () => {
    const roomCodeToUse = gameData?.roomCode || storeRoomCode;
    if (roomCodeToUse) {
      router.push(`/room/${roomCodeToUse}`);
    }
  };

  // Fetch all player guesses
  useEffect(() => {
    if (!gameData || !roundData) return;
    
    const roomId = gameData.roomId;
    const round = roundData.gameState.current_round;
    const targetPosition = roundData.round.target_position;
    const maxPoints = gameData.gameSettings.maxPoints;
    
    if (targetPosition === null || targetPosition === undefined) {
      console.error('[ResultsScreen] Target position is null - cannot calculate scores');
      setLoading(false);
      return;
    }
    
    const fetchGuesses = async () => {
      try {
        const guesses = await actions.getLockedGuessesWithScores(
          roomId,
          round,
          targetPosition,
          maxPoints
        );

        // Map to component's interface (position vs dialPosition)
        const mappedGuesses: PlayerGuess[] = guesses.map(g => ({
          playerId: g.playerId,
          playerName: g.playerName,
          position: g.dialPosition,
          distance: g.distance,
          points: g.points,
        }));

        setPlayerGuesses(mappedGuesses);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch guesses:', err);
        setLoading(false);
      }
    };

    fetchGuesses();
  }, [gameData, roundData]);

  if (!gameData || !roundData) return null;
  
  const roomName = gameData.gameSettings.roomName;
  const maxRounds = gameData.gameSettings.numberOfRounds;
  const maxLives = gameData.gameSettings.numberOfLives;
  const score = roundData.gameState.team_score;
  const lives = roundData.gameState.lives_remaining;
  const leftConcept = roundData.round.left_concept;
  const rightConcept = roundData.round.right_concept;
  const psychicHint = roundData.round.psychic_hint;
  const targetPosition = roundData.round.target_position ?? 50; // Default to center if null
  const round = roundData.gameState.current_round;

  console.log(
    "[ResultsScreen] Gradient values - targetPosition:",
    targetPosition,
    "typeof:",
    typeof targetPosition
  );

  const totalPoints = playerGuesses.reduce((sum, g) => sum + g.points, 0);

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
        isResults={true}
      />

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Round Info */}
          <div className="text-center mb-8">
            <div className="text-3xl font-bold text-white mb-4 uppercase tracking-wider">
              Round Results
            </div>
            <div className="text-teal-400 text-lg mb-2">
              {leftConcept} ⟷ {rightConcept}
            </div>
            <div className="text-fuchsia-400 text-xl font-bold">
              Psychic Hint: &ldquo;{psychicHint}&rdquo;
            </div>
            <div className="text-yellow-400 text-lg mt-4 font-bold">
              Team Earned: +{totalPoints} Points
            </div>
          </div>

          {/* Dial Visualization */}
          <ResultsDial
            playerGuesses={playerGuesses}
            targetPosition={targetPosition}
            leftConcept={leftConcept}
            rightConcept={rightConcept}
          />

          {/* Player Scores Table */}
          <PlayerScoresTable playerGuesses={playerGuesses} loading={loading} />

          {/* Next Round Button */}
          <div className="text-center">
            <ActionButton
              onClick={handleNextRound}
              disabled={advancingRound}
              variant="primary"
              fullWidth={false}
              className="px-12"
            >
              {advancingRound 
                ? 'STARTING NEXT ROUND...' 
                : round >= maxRounds 
                  ? 'FINISH GAME' 
                  : 'NEXT ROUND'
              }
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Back button for testing */}
      <div className="absolute top-20 left-4">
        <button
          onClick={handleBackToLobby}
          className="px-4 py-2 text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300"
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}
