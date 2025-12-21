'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/store';

interface PlayerGuess {
  playerId: string;
  playerName: string;
  position: number;
  distance: number;
  points: number;
}

export default function ResultsScreen() {
  const { 
    gameData, 
    roundData,
    setCurrentScreen
  } = useGameStore();
  
  const [playerGuesses, setPlayerGuesses] = useState<PlayerGuess[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNextRound = () => {
    console.log('Next round clicked');
    // TODO: Start next round logic
    setCurrentScreen('game');
  };

  // Fetch all player guesses
  useEffect(() => {
    if (!gameData || !roundData) return;
    
    const roomId = gameData.roomId;
    const round = roundData.gameState.current_round;
    const targetPosition = roundData.round.target_position;
    
    const fetchGuesses = async () => {
      try {
        const { data: dialData, error: dialError } = await supabase
          .from('dial_updates')
          .select('player_id, dial_position')
          .eq('room_id', roomId)
          .eq('round_number', round)
          .eq('is_locked', true);

        if (dialError) throw dialError;

        // Fetch player names
        const playerIds = dialData?.map(d => d.player_id) || [];
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, player_name')
          .in('id', playerIds);

        if (playersError) throw playersError;

        // Calculate distances and points
        const guesses = dialData?.map(dial => {
          const player = playersData?.find(p => p.id === dial.player_id);
          const distance = Math.abs(dial.dial_position - targetPosition);
          let points = 0;
          
          if (distance <= 5) points = 4; // Perfect
          else if (distance <= 10) points = 3; // Great
          else if (distance <= 20) points = 2; // Good
          else if (distance <= 30) points = 1; // Close
          
          return {
            playerId: dial.player_id,
            playerName: player?.player_name || 'Unknown',
            position: dial.dial_position,
            distance,
            points
          };
        }) || [];

        // Sort by points (highest first)
        guesses.sort((a, b) => b.points - a.points);
        
        setPlayerGuesses(guesses);
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
  const targetPosition = roundData.round.target_position;
  const round = roundData.gameState.current_round;

  // Create gradient for scoring zones
  const createDialGradient = () => {
    const targetAngle = targetPosition * 1.8 - 90;
    
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

  const totalPoints = playerGuesses.reduce((sum, g) => sum + g.points, 0);

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Top HUD Bar */}
      <div className="bg-zinc-900 border-b-2 border-zinc-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-white tracking-wider uppercase">
            {roomName}
          </h1>
          <div className="text-fuchsia-400 font-medium tracking-wide">
            ROUND {round}/{maxRounds} - RESULTS
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
          <div className="mb-12">
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="relative w-full max-w-[500px] h-[250px] mx-auto">
                {/* Semicircle with gradient */}
                <div 
                  className="absolute w-full h-full rounded-t-full overflow-hidden shadow-2xl"
                  style={{
                    background: createDialGradient(),
                    boxShadow: 'inset 0 5px 15px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div className="absolute inset-0 rounded-t-full border-2 border-zinc-700" 
                       style={{ borderBottom: 'none' }}></div>
                  
                  {/* All player needles */}
                  {playerGuesses.map((guess, index) => {
                    const needleAngle = -90 + (guess.position / 100) * 180;
                    const colors = ['rgb(236, 72, 153)', 'rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(168, 85, 247)'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div
                        key={guess.playerId}
                        className="absolute bottom-0 left-1/2 w-8 h-[200px] pointer-events-none"
                        style={{ transform: 'translateX(-50%)' }}
                      >
                        <div
                          className="absolute bottom-0 left-1/2 w-1.5 h-[180px] rounded-t-full"
                          style={{
                            background: color,
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                            boxShadow: `0 0 10px ${color}`
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Target indicator */}
                  <div
                    className="absolute bottom-0 left-1/2 w-8 h-[200px] pointer-events-none"
                    style={{ transform: 'translateX(-50%)' }}
                  >
                    <div
                      className="absolute bottom-0 left-1/2 w-2 h-[200px] rounded-t-full"
                      style={{
                        background: 'rgb(255, 255, 255)',
                        transformOrigin: 'bottom center',
                        transform: `translateX(-50%) rotate(${-90 + (targetPosition / 100) * 180}deg)`,
                        boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
                        opacity: 0.9
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 -mt-4">
                <div className="text-lg font-bold text-teal-400 tracking-wider uppercase">
                  {leftConcept}
                </div>
                <div className="text-lg font-bold text-teal-400 tracking-wider uppercase">
                  {rightConcept}
                </div>
              </div>
            </div>
          </div>

          {/* Player Scores Table */}
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 mb-8">
            <h3 className="text-xl font-bold text-white tracking-wider uppercase mb-4 text-center">
              Player Scores
            </h3>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center text-gray-400">Loading results...</div>
              ) : playerGuesses.length === 0 ? (
                <div className="text-center text-gray-400">No guesses recorded</div>
              ) : (
                playerGuesses.map((guess, index) => {
                  const colors = ['border-fuchsia-500', 'border-blue-500', 'border-green-500', 'border-purple-500'];
                  const borderColor = colors[index % colors.length];
                  
                  return (
                    <div 
                      key={guess.playerId}
                      className={`flex items-center justify-between p-4 bg-zinc-800 border-2 ${borderColor}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-white">#{index + 1}</div>
                        <div>
                          <div className="font-bold text-white">{guess.playerName}</div>
                          <div className="text-sm text-gray-400">Position: {Math.round(guess.position)}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">+{guess.points}</div>
                        <div className="text-sm text-gray-400">Distance: {Math.round(guess.distance)}%</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Next Round Button */}
          <div className="text-center">
            <button
              onClick={handleNextRound}
              className="px-12 py-6 bg-fuchsia-600 border-2 border-fuchsia-500 text-white text-2xl font-bold uppercase tracking-widest hover:bg-fuchsia-700 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] transition-all duration-300"
            >
              {round >= maxRounds ? 'FINISH GAME' : 'NEXT ROUND'}
            </button>
          </div>
        </div>
      </div>

      {/* Back button for testing */}
      <div className="absolute top-20 left-4">
        <button
          onClick={() => setCurrentScreen('lobby')}
          className="px-4 py-2 text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300"
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}
