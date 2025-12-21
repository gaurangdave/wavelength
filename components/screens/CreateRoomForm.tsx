'use client';

import { useState } from 'react';
import { useGameStore, type GameSettings } from '@/lib/store';

export default function CreateRoomForm() {
  const playerName = useGameStore(state => state.playerName);
  const createGame = useGameStore(state => state.createGame);
  const backToMenu = useGameStore(state => state.backToMenu);
  const isLoading = useGameStore(state => state.isLoading);
  const error = useGameStore(state => state.error);
  
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    roomName: '',
    numberOfLives: 3,
    numberOfRounds: 5,
    maxPoints: 100
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleInputChange = (field: keyof GameSettings, value: string | number) => {
    setGameSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCounterChange = (field: 'numberOfLives' | 'numberOfRounds' | 'maxPoints', increment: boolean) => {
    setGameSettings(prev => {
      const currentValue = prev[field];
      let newValue: number;
      
      if (field === 'numberOfLives') {
        newValue = increment ? Math.min(currentValue + 1, 10) : Math.max(currentValue - 1, 1);
      } else if (field === 'numberOfRounds') {
        newValue = increment ? Math.min(currentValue + 1, 20) : Math.max(currentValue - 1, 1);
      } else { // maxPoints
        newValue = increment ? Math.min(currentValue + 50, 1000) : Math.max(currentValue - 50, 50);
      }
      
      return { ...prev, [field]: newValue };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gameSettings.roomName.trim() && !isLoading) {
      try {
        await createGame({
          roomName: gameSettings.roomName,
          playerName,
          settings: {
            numberOfLives: gameSettings.numberOfLives,
            numberOfRounds: gameSettings.numberOfRounds,
            maxPoints: gameSettings.maxPoints
          }
        });
      } catch {
        // Error is handled in the store
      }
    }
  };

  const isFormValid = gameSettings.roomName.trim().length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-zinc-800 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 border border-zinc-800"></div>
        <div className="absolute top-3/4 left-1/3 w-24 h-24 border border-zinc-800 rotate-45"></div>
        <div className="absolute top-1/6 right-1/3 w-36 h-36 border border-zinc-800 rounded-full"></div>
      </div>

      {/* Main Form Container */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-zinc-900 border-2 border-fuchsia-600 shadow-[0_0_30px_rgba(236,72,153,0.2)] p-8 lg:p-12">
          
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-widest uppercase mb-4">
              GAME
              <br />
              <span className="text-fuchsia-500">PARAMETERS</span>
            </h1>
            <div className="text-teal-400 text-sm font-medium tracking-wide uppercase">
              Front Man: <span className="text-white font-bold">{playerName}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Room Name */}
            <div className="space-y-3">
              <label className="block text-gray-400 text-sm font-bold tracking-widest uppercase">
                ROOM NAME
              </label>
              <input
                type="text"
                value={gameSettings.roomName}
                onChange={(e) => handleInputChange('roomName', e.target.value)}
                onFocus={() => setFocusedField('roomName')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., FINAL ELIMINATION"
                className={`
                  w-full px-4 py-3 bg-zinc-800 border-2 text-white font-medium
                  transition-all duration-300 focus:outline-none
                  ${focusedField === 'roomName'
                    ? 'border-fuchsia-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                    : 'border-zinc-600 hover:border-zinc-500'
                  }
                `}
                maxLength={30}
              />
            </div>

            {/* Number of Lives */}
            <div className="space-y-3">
              <label className="block text-gray-400 text-sm font-bold tracking-widest uppercase">
                NUMBER OF LIVES
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleCounterChange('numberOfLives', false)}
                  className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 text-white font-bold text-xl hover:border-fuchsia-500 hover:text-fuchsia-500 transition-all duration-200"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className="bg-zinc-800 border-2 border-zinc-600 py-3 px-4">
                    <span className="text-2xl font-bold text-white">{gameSettings.numberOfLives}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCounterChange('numberOfLives', true)}
                  className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 text-white font-bold text-xl hover:border-fuchsia-500 hover:text-fuchsia-500 transition-all duration-200"
                >
                  +
                </button>
              </div>
              <div className="text-xs text-gray-500 tracking-wide">
                Range: 1-10 lives per player
              </div>
            </div>

            {/* Number of Rounds */}
            <div className="space-y-3">
              <label className="block text-gray-400 text-sm font-bold tracking-widest uppercase">
                NUMBER OF ROUNDS
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleCounterChange('numberOfRounds', false)}
                  className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 text-white font-bold text-xl hover:border-teal-500 hover:text-teal-500 transition-all duration-200"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className="bg-zinc-800 border-2 border-zinc-600 py-3 px-4">
                    <span className="text-2xl font-bold text-white">{gameSettings.numberOfRounds}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCounterChange('numberOfRounds', true)}
                  className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 text-white font-bold text-xl hover:border-teal-500 hover:text-teal-500 transition-all duration-200"
                >
                  +
                </button>
              </div>
              <div className="text-xs text-gray-500 tracking-wide">
                Range: 1-20 rounds per game
              </div>
            </div>

            {/* Max Points */}
            <div className="space-y-3">
              <label className="block text-gray-400 text-sm font-bold tracking-widest uppercase">
                MAX POINTS PER ROUND
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleCounterChange('maxPoints', false)}
                  className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 text-white font-bold text-xl hover:border-teal-500 hover:text-teal-500 transition-all duration-200"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className="bg-zinc-800 border-2 border-zinc-600 py-3 px-4">
                    <span className="text-2xl font-bold text-white">{gameSettings.maxPoints}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCounterChange('maxPoints', true)}
                  className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 text-white font-bold text-xl hover:border-teal-500 hover:text-teal-500 transition-all duration-200"
                >
                  +
                </button>
              </div>
              <div className="text-xs text-gray-500 tracking-wide">
                Range: 50-1000 points (increments of 50)
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-red-300 text-center font-medium tracking-wide">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4 pt-6">
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`
                  w-full py-4 px-8 text-xl font-bold text-white uppercase tracking-widest
                  transition-all duration-300 border-2 border-fuchsia-600
                  ${isFormValid && !isLoading
                    ? 'bg-fuchsia-600 hover:bg-fuchsia-700 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] cursor-pointer'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? 'CREATING...' : 'INITIALIZE GAME'}
              </button>
              
              <button
                type="button"
                onClick={backToMenu}
                className="w-full py-3 px-6 text-lg font-medium text-zinc-400 uppercase tracking-widest border-2 border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300"
              >
                ← BACK TO MENU
              </button>
            </div>
          </form>

          {/* Status Indicator */}
          {isFormValid && (
            <div className="text-center mt-6">
              <div className="flex items-center justify-center space-x-2 text-teal-400 text-sm font-medium tracking-wide uppercase">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <span>READY TO DEPLOY</span>
              </div>
            </div>
          )}
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