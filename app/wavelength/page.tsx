'use client';

import { useState } from 'react';
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import MainMenuScreen from '@/components/screens/MainMenuScreen';
import CreateRoomForm from '@/components/screens/CreateRoomForm';
import GameWaitingRoom from '@/components/screens/GameWaitingRoom';
import ActiveGameScreen from '@/components/screens/ActiveGameScreen';

interface GameSettings {
  roomName: string;
  numberOfLives: number;
  numberOfRounds: number;
  maxPoints: number;
}

export default function WavelengthGamePage() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'main-menu' | 'create-room' | 'join-room' | 'lobby' | 'game'>('welcome');
  const [playerName, setPlayerName] = useState<string>('');
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');

  const handlePlayerNameSubmit = (name: string) => {
    setPlayerName(name);
    setCurrentScreen('main-menu');
    console.log(`Player ${name} is ready to choose their path!`);
  };

  const handleCreateRoom = () => {
    setCurrentScreen('create-room');
    console.log(`${playerName} chose to create a room`);
  };

  const handleJoinRoom = () => {
    setCurrentScreen('join-room');
    console.log(`${playerName} chose to join a room`);
  };

  const handleCreateGame = (settings: GameSettings) => {
    setGameSettings(settings);
    // Generate a random room code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomCode(code);
    setCurrentScreen('lobby');
    console.log(`${playerName} created game "${settings.roomName}" with code ${code}:`, settings);
  };

  const handleBackToMenu = () => {
    setCurrentScreen('main-menu');
  };

  const handleStartGame = () => {
    setCurrentScreen('game');
    console.log(`Game started by ${playerName}`);
  };

  const handleAssignPsychic = () => {
    console.log('Psychic assigned randomly');
  };

  const handleLockInGuess = (position: number) => {
    console.log(`${playerName} locked in guess at ${position}%`);
  };

  const handleBackToLobby = () => {
    setCurrentScreen('lobby');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={handlePlayerNameSubmit} />;
      case 'main-menu':
        return (
          <MainMenuScreen 
            playerName={playerName} 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        );
      case 'create-room':
        return (
          <CreateRoomForm 
            playerName={playerName}
            onCreateGame={handleCreateGame}
            onBack={handleBackToMenu}
          />
        );
      case 'lobby':
        return gameSettings ? (
          <GameWaitingRoom
            roomName={gameSettings.roomName}
            roomCode={roomCode}
            playerName={playerName}
            isHost={true}
            onStartGame={handleStartGame}
            onAssignPsychic={handleAssignPsychic}
            onBack={handleBackToMenu}
          />
        ) : null;
      case 'join-room':
        return (
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="text-white text-center">
              <h1 className="text-4xl font-bold text-teal-400 mb-4">JOIN ROOM</h1>
              <p className="text-fuchsia-400 text-xl">Coming soon...</p>
              <p className="text-zinc-400 mt-4">Player: {playerName}</p>
            </div>
          </div>
        );
      case 'game':
        return gameSettings ? (
          <ActiveGameScreen
            roomName={gameSettings.roomName}
            round={1}
            maxRounds={gameSettings.numberOfRounds}
            score={0}
            lives={gameSettings.numberOfLives}
            maxLives={gameSettings.numberOfLives}
            playerName={playerName}
            onLockInGuess={handleLockInGuess}
            onBack={handleBackToLobby}
          />
        ) : null;
      default:
        return <WelcomeScreen onNext={handlePlayerNameSubmit} />;
    }
  };

  return renderCurrentScreen();
}