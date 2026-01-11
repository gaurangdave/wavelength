/**
 * PlayerScoresTable Component
 * 
 * Displays a ranked table of player scores for the current round,
 * showing position, distance from target, and points earned.
 * Used in both ActiveGameScreen (psychic view) and ResultsScreen.
 */

interface PlayerGuess {
  playerId: string;
  playerName: string;
  position: number;
  distance: number;
  points: number;
}

interface PlayerScoresTableProps {
  playerGuesses: PlayerGuess[];
  loading?: boolean;
  showTitle?: boolean;
  titleText?: string;
  variant?: 'default' | 'psychic'; // Psychic view has different styling
  showTargetPosition?: boolean;
  targetPosition?: number;
}

export function PlayerScoresTable({ 
  playerGuesses, 
  loading = false,
  showTitle = true,
  titleText = 'Player Scores',
  variant = 'default',
  showTargetPosition = false,
  targetPosition
}: PlayerScoresTableProps) {
  const colors = [
    'border-fuchsia-500', 
    'border-blue-500', 
    'border-green-500', 
    'border-purple-500'
  ];

  const containerClass = variant === 'psychic'
    ? 'bg-zinc-900 border-2 border-teal-500 p-6'
    : 'bg-zinc-900 border-2 border-zinc-700 p-6 mb-8';

  const titleClass = variant === 'psychic'
    ? 'text-2xl font-bold text-teal-400 mb-4 uppercase tracking-wider'
    : 'text-xl font-bold text-white tracking-wider uppercase mb-4 text-center';

  return (
    <div className={containerClass}>
      {showTitle && (
        <h2 className={titleClass}>
          {titleText}
        </h2>
      )}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-gray-400">Loading results...</div>
        ) : playerGuesses.length === 0 ? (
          <div className="text-center text-gray-400">No guesses recorded</div>
        ) : (
          playerGuesses.map((guess, index) => {
            const borderColor = variant === 'psychic' ? 'border-zinc-700' : colors[index % colors.length];
            
            return (
              <div 
                key={guess.playerId}
                className={`flex items-center justify-between p-4 bg-zinc-800 border-2 ${borderColor}`}
              >
                <div className="flex items-center space-x-4">
                  {variant === 'psychic' ? (
                    <div className="w-3 h-3 bg-fuchsia-500 rounded-full"></div>
                  ) : (
                    <div className="text-2xl font-bold text-white">#{index + 1}</div>
                  )}
                  <div>
                    <div className="font-bold text-white">{guess.playerName}</div>
                    <div className="text-sm text-gray-400">
                      {variant === 'psychic' ? 'Guess: ' : 'Position: '}
                      <span className="text-white font-bold">{Math.round(guess.position)}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      Distance: <span className={variant === 'psychic' ? 'text-fuchsia-400 font-bold' : 'text-white font-bold'}>{Math.round(guess.distance)}{variant === 'default' ? '%' : ''}</span>
                    </div>
                  </div>
                  <div className={`font-bold text-xl ${variant === 'psychic' ? 'text-teal-400' : 'text-yellow-400'}`}>
                    +{Math.round(guess.points)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {showTargetPosition && targetPosition !== undefined && (
        <div className="mt-4 pt-4 border-t border-zinc-700 text-center">
          <div className="text-gray-400">
            Target Position: <span className="text-teal-400 font-bold text-xl">{Math.round(targetPosition)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
