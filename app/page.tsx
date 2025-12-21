'use client';

import WelcomeScreen from '@/components/screens/WelcomeScreen';
import MainMenuScreen from '@/components/screens/MainMenuScreen';
import CreateRoomForm from '@/components/screens/CreateRoomForm';
import JoinRoomForm from '@/components/screens/JoinRoomForm';
import GameWaitingRoom from '@/components/screens/GameWaitingRoom';
import ActiveGameScreen from '@/components/screens/ActiveGameScreen';
import ResultsScreen from '@/components/screens/ResultsScreen';
import { useGameStore } from '@/lib/store';

export default function Home() {
  const { currentScreen, gameData, roundData } = useGameStore();

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'main-menu':
        return <MainMenuScreen />;
      case 'create-room':
        return <CreateRoomForm />;
      case 'lobby':
        return gameData ? (
          <GameWaitingRoom />
        ) : null;
      case 'join-room':
        return <JoinRoomForm />;
      case 'game':
        return gameData && roundData ? (
          <ActiveGameScreen />
        ) : null;
      case 'results':
        return gameData && roundData ? (
          <ResultsScreen />
        ) : null;
      default:
        return <WelcomeScreen />;
    }
  };

  return renderCurrentScreen();
}
