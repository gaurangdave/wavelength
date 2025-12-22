'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, type GameSettings } from '@/lib/store';
import { 
  ScreenContainer, 
  GeometricBackground, 
  CornerAccents,
  GameCard,
  Title,
  Input,
  Button,
  StatusIndicator,
  ErrorMessage
} from '@/components/ui/GameComponents';
import { themeClasses } from '@/lib/theme';

export default function CreateRoomForm() {
  const router = useRouter();
  const playerName = useGameStore(state => state.playerName);
  const createGame = useGameStore(state => state.createGame);
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
        
        // Navigate to room after successful creation
        const { roomCode } = useGameStore.getState();
        if (roomCode) {
          router.push(`/room/${roomCode}`);
        }
      } catch {
        // Error is handled in the store
      }
    }
  };

  const handleBackToMenu = () => {
    router.push('/dashboard');
  };

  const isFormValid = gameSettings.roomName.trim().length > 0;

  return (
    <ScreenContainer className="flex items-center justify-center px-4">
      <GeometricBackground />

      {/* Main Form Container */}
      <div className="relative z-10 w-full max-w-2xl">
        <GameCard variant="psychic" className="p-8 lg:p-12">
          
          {/* Header */}
          <Title 
            subtitle={
              <>
                Front Man: <span className="text-white font-bold">{playerName}</span>
              </>
            }
            className="mb-10"
          >
            GAME
            <br />
            <span className={themeClasses.text.psychic}>PARAMETERS</span>
          </Title>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Room Name */}
            <Input
              label="ROOM NAME"
              value={gameSettings.roomName}
              onChange={(value) => handleInputChange('roomName', value)}
              focused={focusedField === 'roomName'}
              onFocus={() => setFocusedField('roomName')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g., FINAL ELIMINATION"
              maxLength={30}
            />

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
              <div className={themeClasses.text.muted}>
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
              <div className={themeClasses.text.muted}>
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
              <div className={themeClasses.text.muted}>
                Range: 50-1000 points (increments of 50)
              </div>
            </div>

            {/* Error Message */}
            {error && <ErrorMessage message={error} />}

            {/* Action Buttons */}
            <div className="space-y-4 pt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? 'CREATING...' : 'INITIALIZE GAME'}
              </Button>
              
              <button
                type="button"
                onClick={handleBackToMenu}
                className="w-full py-3 px-6 text-lg font-medium text-zinc-400 uppercase tracking-widest border-2 border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 transition-all duration-300"
              >
                ← BACK TO MENU
              </button>
            </div>
          </form>

          {/* Status Indicator */}
          {isFormValid && (
            <div className="text-center mt-6">
              <StatusIndicator type="waiting" text="READY TO DEPLOY" />
            </div>
          )}
        </GameCard>
      </div>

      <CornerAccents variant="psychic" />
    </ScreenContainer>
  );
}