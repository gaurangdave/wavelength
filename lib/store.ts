import { create } from 'zustand';
import * as api from './api-client';

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
  isLoading: boolean;
  error: string | null;

  // Basic setters
  setCurrentScreen: (screen: Screen) => void;
  setPlayerName: (name: string) => void;
  setError: (error: string | null) => void;
  
  // API Actions (handle API calls + state updates)
  createGame: (params: {
    roomName: string;
    playerName: string;
    settings: {
      numberOfLives: number;
      numberOfRounds: number;
      maxPoints: number;
    };
  }) => Promise<void>;
  
  joinGame: (params: {
    roomCode: string;
    playerName: string;
  }) => Promise<void>;
  
  startGame: () => Promise<void>;
  
  assignRandomPsychic: () => Promise<{ psychicId: string } | null>;
  
  // Navigation actions
  resetGame: () => void;
  backToMenu: () => void;
  goToCreateRoom: () => void;
  goToJoinRoom: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
  currentScreen: 'welcome',
  playerName: '',
  gameData: null,
  roundData: null,
  isHost: false,
  isLoading: false,
  error: null,

  // Basic Setters
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setPlayerName: (name) => {
    set({ playerName: name, currentScreen: 'main-menu' });
    console.log(`Player ${name} is ready to choose their path!`);
  },
  setError: (error) => set({ error }),

  // API Actions
  createGame: async (params) => {
    const { roomName, playerName, settings } = params;
    set({ isLoading: true, error: null });
    
    try {
      const roomCode = api.generateRoomCode();
      const peerId = api.generatePeerId();
      
      const result = await api.createGame({
        roomName,
        roomCode,
        playerName,
        peerId,
        settings
      });
      
      set({
        gameData: {
          roomId: result.room.id,
          roomCode: result.room.room_code,
          playerId: result.player.id,
          peerId: result.player.peer_id,
          gameSettings: {
            roomName,
            ...settings
          }
        },
        isHost: true,
        currentScreen: 'lobby',
        isLoading: false
      });
      
      console.log(`${playerName} created game "${roomName}" with code ${result.room.room_code}`);
    } catch (err: any) {
      console.error('Failed to create game:', err);
      set({ 
        error: err.message || 'Failed to create game. Please try again.',
        isLoading: false 
      });
      throw err;
    }
  },

  joinGame: async (params) => {
    const { roomCode, playerName } = params;
    set({ isLoading: true, error: null });
    
    try {
      const peerId = api.generatePeerId();
      
      const result = await api.joinGame({
        roomCode,
        playerName,
        peerId
      });
      
      set({
        gameData: {
          roomId: result.room.id,
          roomCode: result.room.room_code,
          playerId: result.player.id,
          peerId: result.player.peer_id,
          gameSettings: result.room.settings
        },
        isHost: false,
        currentScreen: 'lobby',
        isLoading: false
      });
      
      console.log(`${playerName} joined game with code ${result.room.room_code}`);
    } catch (err: any) {
      console.error('Failed to join game:', err);
      set({ 
        error: err.message || 'Failed to join game. Please check the room code.',
        isLoading: false 
      });
      throw err;
    }
  },

  startGame: async () => {
    const { gameData } = get();
    if (!gameData?.roomId) {
      const error = 'No room ID available';
      set({ error });
      throw new Error(error);
    }
    
    set({ isLoading: true, error: null });
    
    try {
      console.log('[HOST] Starting game...');
      const result = await api.startGame(gameData.roomId);
      console.log('[HOST] Game started successfully, transitioning to game screen');
      
      set({
        roundData: result,
        currentScreen: 'game',
        isLoading: false
      });
    } catch (err: any) {
      console.error('[HOST] Failed to start game:', err);
      set({ 
        error: err.message || 'Failed to start game.',
        isLoading: false 
      });
      throw err;
    }
  },

  assignRandomPsychic: async () => {
    const { gameData } = get();
    if (!gameData?.roomId) {
      const error = 'No room ID available';
      set({ error });
      return null;
    }
    
    try {
      const result = await api.assignRandomPsychic(gameData.roomId);
      return result;
    } catch (err: any) {
      console.error('Failed to assign psychic:', err);
      set({ error: err.message || 'Failed to assign psychic.' });
      return null;
    }
  },

  // Navigation Actions
  resetGame: () => 
    set({ 
      gameData: null, 
      roundData: null, 
      isHost: false,
      error: null
    }),
  
  backToMenu: () => 
    set({ 
      currentScreen: 'main-menu', 
      gameData: null, 
      roundData: null, 
      isHost: false,
      error: null
    }),

  goToCreateRoom: () => {
    const { playerName } = get();
    set({ currentScreen: 'create-room' });
    console.log(`${playerName} chose to create a room`);
  },

  goToJoinRoom: () => {
    const { playerName } = get();
    set({ currentScreen: 'join-room' });
    console.log(`${playerName} chose to join a room`);
  },
}));
