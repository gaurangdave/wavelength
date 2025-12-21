'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';

export default function JoinRoomForm() {
  const playerName = useGameStore(state => state.playerName);
  const joinGame = useGameStore(state => state.joinGame);
  const backToMenu = useGameStore(state => state.backToMenu);
  const isLoading = useGameStore(state => state.isLoading);
  const storeError = useGameStore(state => state.error);
  
  const [roomCode, setRoomCode] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<boolean>(false);
  
  const error = storeError || localError;

  const handleInputChange = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomCode(cleanValue);
    if (error) setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (roomCode.length !== 6) {
      setLocalError('Room code must be 6 characters');
      return;
    }

    if (!isLoading) {
      setLocalError(null);
      
      try {
        await joinGame({
          roomCode,
          playerName
        });
      } catch {
        // Error is handled in the store
      }
    }
  };

  const isFormValid = roomCode.length === 6;

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
        <div className="bg-zinc-900 border-2 border-teal-600 shadow-[0_0_30px_rgba(20,184,166,0.2)] p-8 lg:p-12">
          
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-widest uppercase mb-4">
              JOIN
              <br />
              <span className="text-teal-400">GAME ROOM</span>
            </h1>
            <div className="text-fuchsia-400 text-sm font-medium tracking-wide uppercase">
              Player: <span className="text-white font-bold">{playerName}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Room Code Input */}
            <div className="space-y-3">
              <label className="block text-gray-400 text-sm font-bold tracking-widest uppercase text-center">
                ENTER ROOM CODE
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setFocusedField(true)}
                onBlur={() => setFocusedField(false)}
                placeholder="ABC123"
                className={`
                  w-full px-6 py-4 bg-zinc-800 border-2 text-white font-mono text-2xl font-bold text-center
                  tracking-[0.5em] uppercase transition-all duration-300 focus:outline-none
                  ${focusedField
                    ? 'border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                    : 'border-zinc-600 hover:border-zinc-500'
                  }
                `}
                maxLength={6}
                autoComplete="off"
                autoFocus
              />
              <div className="text-center">
                <div className="text-xs text-gray-500 tracking-wide">
                  {roomCode.length}/6 characters
                </div>
                {roomCode.length > 0 && roomCode.length < 6 && (
                  <div className="text-xs text-yellow-500 tracking-wide mt-1">
                    Code must be 6 characters
                  </div>
                )}
              </div>
            </div>

            {/* Room Code Format Helper */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Room code format
              </div>
              <div className="flex justify-center space-x-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`
                      w-8 h-10 border-2 flex items-center justify-center font-mono font-bold
                      ${i < roomCode.length 
                        ? 'border-teal-500 text-teal-400 bg-teal-500/10' 
                        : 'border-zinc-600 text-zinc-600'
                      }
                    `}
                  >
                    {roomCode[i] || '·'}
                  </div>
                ))}
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
                  transition-all duration-300 border-2 border-teal-600
                  ${isFormValid && !isLoading
                    ? 'bg-teal-600 hover:bg-teal-700 hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] cursor-pointer'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? 'JOINING...' : 'JOIN GAME'}
              </button>
              
              <button
                type="button"
                onClick={backToMenu}
                disabled={isLoading}
                className="w-full py-3 px-6 text-lg font-medium text-zinc-400 uppercase tracking-widest border-2 border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← BACK TO MENU
              </button>
            </div>
          </form>

          {/* Status Indicator */}
          {isFormValid && !isLoading && (
            <div className="text-center mt-6">
              <div className="flex items-center justify-center space-x-2 text-teal-400 text-sm font-medium tracking-wide uppercase">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <span>READY TO JOIN</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center mt-6">
              <div className="flex items-center justify-center space-x-2 text-yellow-400 text-sm font-medium tracking-wide uppercase">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                <span>CONNECTING TO ROOM...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-r-2 border-b-2 border-teal-500 opacity-30"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-l-2 border-b-2 border-teal-500 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 border-r-2 border-t-2 border-teal-500 opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 border-l-2 border-t-2 border-teal-500 opacity-30"></div>
    </div>
  );
}
