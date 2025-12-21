'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { 
  ScreenContainer, 
  GeometricBackground, 
  CornerAccents,
  Input,
  Button,
  StatusIndicator 
} from '@/components/ui/GameComponents';
import { themeClasses } from '@/lib/theme';

export default function WelcomeScreen() {
  const setPlayerName = useGameStore(state => state.setPlayerName);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerNameInput.trim()) {
      setPlayerName(playerNameInput.trim());
    }
  };

  return (
    <ScreenContainer className="flex items-center justify-center">
      <GeometricBackground />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-8">
        <div className="text-center space-y-8">
          {/* Title */}
          <h1 className={`${themeClasses.text.title} text-4xl md:text-5xl ${themeClasses.text.psychic}`}>
            ENTER YOUR
            <br />
            <span className="text-3xl md:text-4xl">IDENTIFIER</span>
          </h1>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              value={playerNameInput}
              onChange={setPlayerNameInput}
              placeholder="e.g., Player 456"
              maxLength={20}
              focused={isFocused}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!playerNameInput.trim()}
            >
              NEXT
            </Button>
          </form>

          {/* Status Indicator */}
          {playerNameInput.length > 0 && (
            <StatusIndicator type="waiting" text="READY TO PROCEED" />
          )}
        </div>
      </div>

      <CornerAccents variant="psychic" />
    </ScreenContainer>
  );
}