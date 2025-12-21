'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { ScreenContainer, GeometricBackground, CornerAccents } from '@/components/ui/GameComponents';
import { themeClasses } from '@/lib/theme';

export default function MainMenuScreen() {
  const playerName = useGameStore(state => state.playerName);
  const goToCreateRoom = useGameStore(state => state.goToCreateRoom);
  const goToJoinRoom = useGameStore(state => state.goToJoinRoom);
  const [hoveredCard, setHoveredCard] = useState<'create' | 'join' | null>(null);

  return (
    <ScreenContainer className="flex items-center justify-center px-4">
      <GeometricBackground />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={themeClasses.text.title + ' text-4xl md:text-5xl mb-4'}>
            CHOOSE YOUR
            <br />
            <span className={themeClasses.text.psychic}>PATH</span>
          </h1>
          <div className={`${themeClasses.text.player} text-lg font-medium tracking-wide`}>
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
              group cursor-pointer ${themeClasses.card.base} ${themeClasses.card.psychic}
              p-8 lg:p-12 text-center
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
            <h2 className={`${themeClasses.text.subtitle} ${themeClasses.text.psychic} mb-4`}>
              HOST A GAME
            </h2>
            <p className={`${themeClasses.text.body} mb-6`}>
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
              group cursor-pointer ${themeClasses.card.base} ${themeClasses.card.player}
              p-8 lg:p-12 text-center
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
            <h2 className={`${themeClasses.text.subtitle} ${themeClasses.text.player} mb-4`}>
              JOIN A GAME
            </h2>
            <p className={`${themeClasses.text.body} mb-6`}>
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
        <div className={`text-center mt-12 ${themeClasses.text.muted}`}>
          <p>SELECT AN OPTION TO CONTINUE</p>
        </div>
      </div>

      <CornerAccents variant="mixed" />
    </ScreenContainer>
  );
}