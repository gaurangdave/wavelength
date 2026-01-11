'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import {
  ScreenContainer,
  GeometricBackground,
  CornerAccents,
  GameCard,
  Button,
  ErrorMessage,
  StatusIndicator
} from '@/components/ui/GameComponents';

// Custom component for room code visual display
interface RoomCodeDisplayProps {
  code: string;
}

function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  return (
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
              ${i < code.length 
                ? 'border-teal-500 text-teal-400 bg-teal-500/10' 
                : 'border-zinc-600 text-zinc-600'
              }
            `}
          >
            {code[i] || '·'}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JoinRoomForm() {
  const router = useRouter();
  const playerName = useGameStore(state => state.playerName);
  const joinGame = useGameStore(state => state.joinGame);
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
        
        // Navigate to room after successful join
        router.push(`/room/${roomCode}`);
      } catch {
        // Error is handled in the store
      }
    }
  };

  const handleBackToMenu = () => {
    router.push('/dashboard');
  };

  const isFormValid = roomCode.length === 6;

  return (
    <ScreenContainer>
      <GeometricBackground />
      <CornerAccents variant="psychic" />
      
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <GameCard variant="psychic" className="p-8 lg:p-12">
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
            <RoomCodeDisplay code={roomCode} />

            {/* Error Message */}
            {error && <ErrorMessage message={error} />}

            {/* Action Buttons */}
            <div className="space-y-4 pt-6">
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                variant="primary"
              >
                {isLoading ? 'JOINING...' : 'JOIN GAME'}
              </Button>
              
              <Button
                type="button"
                onClick={handleBackToMenu}
                disabled={isLoading}
                variant="secondary"
              >
                ← BACK TO MENU
              </Button>
            </div>
          </form>

          {/* Status Indicators */}
          {isFormValid && !isLoading && (
            <div className="text-center mt-6">
              <StatusIndicator type="waiting" text="READY TO JOIN" />
            </div>
          )}

          {isLoading && (
            <div className="text-center mt-6">
              <StatusIndicator type="loading" text="CONNECTING TO ROOM..." />
            </div>
          )}
        </GameCard>
      </div>
    </ScreenContainer>
  );
}
