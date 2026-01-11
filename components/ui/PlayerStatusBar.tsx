/**
 * PlayerStatusBar Component
 * 
 * Displays a footer showing all participants in the game.
 * Highlights the current psychic player.
 */

interface Player {
  id: string;
  name: string;
  isPsychic: boolean;
}

interface PlayerStatusBarProps {
  players: Player[];
}

export function PlayerStatusBar({ players }: PlayerStatusBarProps) {
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
