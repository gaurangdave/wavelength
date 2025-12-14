'use client';

import { useState } from 'react';

interface WelcomeScreenProps {
  onNext?: (playerName: string) => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onNext?.(playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-zinc-800 rotate-45"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-zinc-800 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 border border-zinc-800"></div>
        <div className="absolute top-1/2 right-1/3 w-28 h-28 border border-zinc-800 rotate-12"></div>
        <div className="absolute bottom-1/3 right-1/2 w-16 h-16 border border-zinc-800 rounded-full"></div>
        <div className="absolute top-1/3 left-1/2 w-36 h-36 border border-zinc-800 rotate-45"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-8">
        <div className="text-center space-y-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-fuchsia-500 tracking-widest uppercase">
            ENTER YOUR
            <br />
            <span className="text-3xl md:text-4xl">IDENTIFIER</span>
          </h1>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="e.g., Player 456"
                className={`
                  w-full px-6 py-4 text-xl font-medium text-white bg-zinc-900 border-2 
                  transition-all duration-300 focus:outline-none
                  ${isFocused 
                    ? 'border-fuchsia-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]' 
                    : 'border-zinc-700'
                  }
                `}
                maxLength={20}
              />
              {isFocused && (
                <div className="absolute inset-0 border-2 border-fuchsia-500 animate-pulse pointer-events-none"></div>
              )}
            </div>

            <button
              type="submit"
              disabled={!playerName.trim()}
              className={`
                w-full py-4 px-8 text-xl font-bold text-white uppercase tracking-widest
                transition-all duration-300 border-2 border-fuchsia-600
                ${playerName.trim()
                  ? 'bg-fuchsia-600 hover:bg-fuchsia-700 hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] cursor-pointer' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                }
              `}
            >
              NEXT
            </button>
          </form>

          {/* Status Indicator */}
          <div className="text-teal-400 text-sm font-medium tracking-wide uppercase">
            {playerName.length > 0 && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <span>READY TO PROCEED</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-r-2 border-b-2 border-fuchsia-500 opacity-30"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-l-2 border-b-2 border-fuchsia-500 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 border-r-2 border-t-2 border-fuchsia-500 opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 border-l-2 border-t-2 border-fuchsia-500 opacity-30"></div>
    </div>
  );
}