import { create } from 'zustand';

export type Screen = 'welcome' | 'main-menu' | 'create-room' | 'join-room' | 'lobby' | 'game' | 'results';

export interface GameSettings {
  roomName: string;
  numberOfLives: number;
  numberOfRounds: number;
  maxPoints: number;
}

export interface GameData {
  roomId: string;
  roomCode: string;
  playerId: string;
  peerId: string;
  gameSettings: GameSettings;
}

export interface RoundData {
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

interface GameStore {
  // State
  currentScreen: Screen;
  playerName: string;
  gameData: GameData | null;
  roundData: RoundData | null;
  isHost: boolean;

  // Actions
  setCurrentScreen: (screen: Screen) => void;
  setPlayerName: (name: string) => void;
  setGameData: (data: GameData | null) => void;
  setRoundData: (data: RoundData | null) => void;
  setIsHost: (isHost: boolean) => void;
  
  // Convenience actions
  createGame: (data: GameData) => void;
  joinGame: (data: GameData) => void;
  startGame: (data: RoundData) => void;
  resetGame: () => void;
  backToMenu: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial State
  currentScreen: 'welcome',
  playerName: '',
  gameData: null,
  roundData: null,
  isHost: false,

  // Basic Actions
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setPlayerName: (name) => set({ playerName: name }),
  setGameData: (data) => set({ gameData: data }),
  setRoundData: (data) => set({ roundData: data }),
  setIsHost: (isHost) => set({ isHost }),

  // Convenience Actions
  createGame: (data) => 
    set({ 
      gameData: data, 
      isHost: true, 
      currentScreen: 'lobby' 
    }),
  
  joinGame: (data) => 
    set({ 
      gameData: data, 
      isHost: false, 
      currentScreen: 'lobby' 
    }),
  
  startGame: (data) => 
    set({ 
      roundData: data, 
      currentScreen: 'game' 
    }),
  
  resetGame: () => 
    set({ 
      gameData: null, 
      roundData: null, 
      isHost: false 
    }),
  
  backToMenu: () => 
    set({ 
      currentScreen: 'main-menu', 
      gameData: null, 
      roundData: null, 
      isHost: false 
    }),
}));
