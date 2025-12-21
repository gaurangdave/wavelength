'use client';

import { useState } from 'react';
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import MainMenuScreen from '@/components/screens/MainMenuScreen';
import CreateRoomForm from '@/components/screens/CreateRoomForm';
import JoinRoomForm from '@/components/screens/JoinRoomForm';
import GameWaitingRoom from '@/components/screens/GameWaitingRoom';
import ActiveGameScreen from '@/components/screens/ActiveGameScreen';
import ResultsScreen from '@/components/screens/ResultsScreen';

interface GameSettings {
  roomName: string;
  numberOfLives: number;
  numberOfRounds: number;
  maxPoints: number;
}

interface GameData {
  roomId: string;
  roomCode: string;
  playerId: string;
  peerId: string;
  gameSettings: GameSettings;
}

interface RoundData {
  round: {
    id: string;
    round_number: number;
    left_concept: string;
    right_concept: string;
    psychic_hint: string;
    target_position: number;
  };
  gameState: {
    current_round: number;
    team_score: number;
    lives_remaining: number;
    current_psychic_id: string;
  };
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'main-menu' | 'create-room' | 'join-room' | 'lobby' | 'game' | 'results'>('welcome');
  const [playerName, setPlayerName] = useState<string>('');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);

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

  const handleCreateGame = (data: GameData) => {
    setGameData(data);
    setIsHost(true);
    setCurrentScreen('lobby');
    console.log(`${playerName} created game "${data.gameSettings.roomName}" with code ${data.roomCode}:`, data);
  };

  const handleJoinGame = (data: GameData) => {
    setGameData(data);
    setIsHost(false);
    setCurrentScreen('lobby');
    console.log(`${playerName} joined game with code ${data.roomCode}:`, data);
  };

  const handleBackToMenu = () => {
    setCurrentScreen('main-menu');
    setGameData(null);
    setRoundData(null);
    setIsHost(false);
  };

  const handleStartGame = (data: RoundData) => {
    setRoundData(data);
    setCurrentScreen('game');
    console.log(`Game started by ${playerName}`, data);
  };

  const handleLockInGuess = (position: number) => {
    console.log(`${playerName} locked in guess at ${position}%`);
  };

  const handleBackToLobby = () => {
    setCurrentScreen('lobby');
  };

  const handleShowResults = () => {
    setCurrentScreen('results');
    console.log(`${playerName} viewing results`, roundData);
  };

  const handleNextRound = () => {
    console.log(`${playerName} clicked next round`);
    // TODO: Start next round logic
    setCurrentScreen('game');
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
        return gameData ? (
          <GameWaitingRoom
            roomId={gameData.roomId}
            roomName={gameData.gameSettings.roomName}
            roomCode={gameData.roomCode}
            playerName={playerName}
            playerId={gameData.playerId}
            peerId={gameData.peerId}
            isHost={isHost}
            onStartGame={handleStartGame}
            onBack={handleBackToMenu}
          />
        ) : null;
      case 'join-room':
        return (
          <JoinRoomForm
            playerName={playerName}
            onJoinGame={handleJoinGame}
            onBack={handleBackToMenu}
          />
        );
      case 'game':
        return gameData && roundData ? (
          <ActiveGameScreen
            roomId={gameData.roomId}
            roomName={gameData.gameSettings.roomName}
            round={roundData.gameState.current_round}
            maxRounds={gameData.gameSettings.numberOfRounds}
            score={roundData.gameState.team_score}
            lives={roundData.gameState.lives_remaining}
            maxLives={gameData.gameSettings.numberOfLives}
            playerId={gameData.playerId}
            playerName={playerName}
            peerId={gameData.peerId}
            isPsychic={gameData.playerId === roundData.gameState.current_psychic_id}
            leftConcept={roundData.round.left_concept}
            rightConcept={roundData.round.right_concept}
            psychicHint={roundData.round.psychic_hint}
            targetPosition={roundData.round.target_position}
            onLockInGuess={handleLockInGuess}
            onBack={handleBackToLobby}
            onShowResults={handleShowResults}
          />
        ) : null;
      case 'results':
        return gameData && roundData ? (
          <ResultsScreen
            roomId={gameData.roomId}
            roomName={gameData.gameSettings.roomName}
            round={roundData.gameState.current_round}
            maxRounds={gameData.gameSettings.numberOfRounds}
            score={roundData.gameState.team_score}
            lives={roundData.gameState.lives_remaining}
            maxLives={gameData.gameSettings.numberOfLives}
            leftConcept={roundData.round.left_concept}
            rightConcept={roundData.round.right_concept}
            psychicHint={roundData.round.psychic_hint}
            targetPosition={roundData.round.target_position}
            onNextRound={handleNextRound}
            onBack={handleBackToLobby}
          />
        ) : null;
      default:
        return <WelcomeScreen onNext={handlePlayerNameSubmit} />;
    }
  };

  return renderCurrentScreen();
}
