'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';

export default function MainMenuScreen() {
  const playerName = useGameStore(state => state.playerName);
  const goToCreateRoom = useGameStore(state => state.goToCreateRoom);
  const goToJoinRoom = useGameStore(state => state.goToJoinRoom);
  const [hoveredCard, setHoveredCard] = useState<'create' | 'join' | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden px-4">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/6 left-1/6 w-40 h-40 border border-zinc-800 rounded-full"></div>
        <div className="absolute top-2/3 right-1/6 w-32 h-32 border border-zinc-800" 
             style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
        <div className="absolute bottom-1/6 left-1/3 w-24 h-24 border border-zinc-800 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-36 h-36 border border-zinc-800" 
             style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
        <div className="absolute bottom-1/3 right-1/2 w-28 h-28 border border-zinc-800 rounded-full"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-widest uppercase mb-4">
            CHOOSE YOUR
            <br />
            <span className="text-fuchsia-500">PATH</span>
          </h1>
          <div className="text-teal-400 text-lg font-medium tracking-wide">
            Welcome, <span className="text-white font-bold">{playerName}</span>
          </div>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Create Room Card */}
          <div
            onClick={goToCreateRoom}
            onMouseEnter={() => setHoveredCard('create')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group cursor-pointer bg-zinc-900 border-2 border-fuchsia-600 
              p-8 lg:p-12 text-center transition-all duration-300 ease-out
              ${hoveredCard === 'create' 
                ? 'transform scale-105 shadow-[0_0_40px_rgba(236,72,153,0.4)] border-fuchsia-400' 
                : 'hover:transform hover:scale-102 hover:shadow-[0_0_25px_rgba(236,72,153,0.2)]'
              }
            `}
          >
            {/* Circle Icon */}
            <div className="mb-8 flex justify-center">
              <div className={`
                relative w-24 h-24 lg:w-32 lg:h-32 border-4 border-fuchsia-500 rounded-full
                transition-all duration-300
                ${hoveredCard === 'create' 
                  ? 'border-fuchsia-400 shadow-[0_0_30px_rgba(236,72,153,0.6)]' 
                  : 'group-hover:border-fuchsia-400 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                }
              `}>
                <div className="absolute inset-2 border-2 border-fuchsia-500 rounded-full opacity-60"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-fuchsia-500 rounded-full"></div>
              </div>
            </div>

            {/* Content */}
            <h2 className="text-2xl lg:text-3xl font-bold text-fuchsia-500 uppercase tracking-wider mb-4">
              HOST A GAME
            </h2>
            <p className="text-zinc-300 text-lg lg:text-xl font-medium mb-6">
              Start a new session as the Front Man
            </p>
            
            {/* Action Indicator */}
            <div className="text-white text-sm font-bold tracking-widest uppercase">
              CREATE ROOM
            </div>
            
            {/* Hover Accent Line */}
            <div className={`
              mt-6 h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent
              transition-all duration-300
              ${hoveredCard === 'create' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}
            `}></div>
          </div>

          {/* Join Room Card */}
          <div
            onClick={goToJoinRoom}
            onMouseEnter={() => setHoveredCard('join')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`
              group cursor-pointer bg-zinc-900 border-2 border-teal-600 
              p-8 lg:p-12 text-center transition-all duration-300 ease-out
              ${hoveredCard === 'join' 
                ? 'transform scale-105 shadow-[0_0_40px_rgba(20,184,166,0.4)] border-teal-400' 
                : 'hover:transform hover:scale-102 hover:shadow-[0_0_25px_rgba(20,184,166,0.2)]'
              }
            `}
          >
            {/* Triangle Icon */}
            <div className="mb-8 flex justify-center">
              <div className={`
                relative w-24 h-24 lg:w-32 lg:h-32 transition-all duration-300
                ${hoveredCard === 'join' ? 'drop-shadow-[0_0_20px_rgba(20,184,166,0.6)]' : 'group-hover:drop-shadow-[0_0_15px_rgba(20,184,166,0.4)]'}
              `}>
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 100 100" 
                  className={`
                    transition-all duration-300
                    ${hoveredCard === 'join' ? 'text-teal-400' : 'text-teal-500 group-hover:text-teal-400'}
                  `}
                >
                  <polygon 
                    points="50,15 15,75 85,75" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <polygon 
                    points="50,25 25,65 75,65" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    opacity="0.6"
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="2" 
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <h2 className="text-2xl lg:text-3xl font-bold text-teal-400 uppercase tracking-wider mb-4">
              JOIN A GAME
            </h2>
            <p className="text-zinc-300 text-lg lg:text-xl font-medium mb-6">
              Enter an existing room code
            </p>
            
            {/* Action Indicator */}
            <div className="text-white text-sm font-bold tracking-widest uppercase">
              JOIN ROOM
            </div>
            
            {/* Hover Accent Line */}
            <div className={`
              mt-6 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent
              transition-all duration-300
              ${hoveredCard === 'join' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}
            `}></div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-zinc-500 text-sm font-medium tracking-wide">
          <p>SELECT AN OPTION TO CONTINUE</p>
        </div>
      </div>

      {/* Corner Accents - Updated for this screen */}
      <div className="absolute top-0 left-0 w-16 h-16 border-r-2 border-b-2 border-fuchsia-500 opacity-40"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-l-2 border-b-2 border-teal-400 opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-r-2 border-t-2 border-teal-400 opacity-40"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-l-2 border-t-2 border-fuchsia-500 opacity-40"></div>
    </div>
  );
}