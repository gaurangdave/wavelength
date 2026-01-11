/**
 * GameHUD Component
 * 
 * Displays the game header with room name, round progress, score, and lives.
 * Used across ActiveGameScreen and ResultsScreen.
 */

interface GameHUDProps {
  roomName: string;
  round: number;
  maxRounds: number;
  score: number;
  lives: number;
  maxLives: number;
  isResults?: boolean;
}

export function GameHUD({ 
  roomName, 
  round, 
  maxRounds, 
  score, 
  lives, 
  maxLives, 
  isResults 
}: GameHUDProps) {
  return (
    <div className="bg-zinc-900 border-b-2 border-zinc-700 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold text-white tracking-wider uppercase">
          {roomName}
        </h1>
        <div className="text-fuchsia-400 font-medium tracking-wide">
          ROUND {round}/{maxRounds}{isResults ? ' - RESULTS' : ''}
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
