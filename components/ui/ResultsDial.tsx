/**
 * ResultsDial Component
 * 
 * Displays the dial visualization on the results screen showing all player
 * guesses relative to the target position.
 */

import { DialNeedle } from "./GameComponents";
import { createDialGradient } from "@/lib/theme";

interface PlayerGuess {
  playerId: string;
  playerName: string;
  position: number;
  distance: number;
  points: number;
}

interface ResultsDialProps {
  playerGuesses: PlayerGuess[];
  targetPosition: number;
  leftConcept: string;
  rightConcept: string;
}

export function ResultsDial({ 
  playerGuesses, 
  targetPosition, 
  leftConcept, 
  rightConcept 
}: ResultsDialProps) {
  const colors = [
    'rgb(236, 72, 153)', 
    'rgb(59, 130, 246)', 
    'rgb(34, 197, 94)', 
    'rgb(168, 85, 247)'
  ];

  return (
    <div className="mb-12">
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative w-full max-w-[500px] h-[250px] mx-auto">
          {/* Semicircle with gradient */}
          <div 
            className="absolute w-full h-full rounded-t-full overflow-hidden shadow-2xl"
            style={{
              background: createDialGradient(targetPosition),
              boxShadow: 'inset 0 5px 15px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div 
              className="absolute inset-0 rounded-t-full border-2 border-zinc-700" 
              style={{ borderBottom: 'none' }}
            />
            
            {/* All player needles */}
            {playerGuesses.map((guess, index) => {
              const color = colors[index % colors.length];
              
              return (
                <DialNeedle
                  key={guess.playerId}
                  position={guess.position}
                  color={color}
                  showPivot={false}
                  height={180}
                  width={1.5}
                />
              );
            })}

            {/* Target indicator */}
            <DialNeedle
              position={targetPosition}
              color="rgb(255, 255, 255)"
              showPivot={false}
              height={200}
              width={2}
              opacity={0.9}
            />
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
  );
}
