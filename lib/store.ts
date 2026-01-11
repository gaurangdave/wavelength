import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
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
  userId: string | null;
  roomCode: string | null;
  gameData: GameData | null;
  roundData: RoundData | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;

  // Basic setters
  setCurrentScreen: (screen: Screen) => void;
  setPlayerName: (name: string) => void;
  setRoomCode: (code: string) => void;
  setError: (error: string | null) => void;
  
  // Player registration
  registerPlayer: (playerName: string) => Promise<void>;
  
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
  
  loadGameState: () => Promise<void>;
  
  assignRandomPsychic: () => Promise<{ psychicId: string } | null>;
  
  updateTargetPosition: (targetPosition: number) => void;
  
  // Direct update methods for realtime subscriptions (performance optimization)
  setRoundData: (roundData: RoundData) => void;
  updateGameState: (gameState: Partial<RoundData['gameState']>) => void;
  updateCurrentRound: (round: Partial<RoundData['round']>) => void;
  
  // Round management
  advanceToNextRound: (router: any) => Promise<void>;
  
  // Navigation actions
  resetGame: () => void;
  backToMenu: () => void;
  goToCreateRoom: () => void;
  goToJoinRoom: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist((set, get) => ({
  // Initial State
  currentScreen: 'welcome',
  playerName: '',
  userId: null,
  roomCode: null,
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
  setRoomCode: (code) => set({ roomCode: code }),
  setError: (error) => set({ error }),

  // Player Registration
  registerPlayer: async (playerName: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('[Store] Registering player:', playerName);
      const result = await api.registerPlayer(playerName);
      
      set({ 
        userId: result.userId,
        playerName: result.playerName,
        currentScreen: 'main-menu',
        isLoading: false 
      });
      
      console.log('[Store] Player registered successfully:', result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register player';
      console.error('[Store] Failed to register player:', err);
      set({ 
        error: message,
        isLoading: false 
      });
      throw err;
    }
  },

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
        roomCode: result.room.room_code,
        isHost: true,
        currentScreen: 'lobby',
        isLoading: false
      });
      
      console.log(`${playerName} created game "${roomName}" with code ${result.room.room_code}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create game. Please try again.';
      console.error('Failed to create game:', err);
      set({ 
        error: message,
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
        roomCode: result.room.room_code,
        isHost: false,
        currentScreen: 'lobby',
        isLoading: false
      });
      
      console.log(`${playerName} joined game with code ${result.room.room_code}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join game. Please check the room code.';
      console.error('Failed to join game:', err);
      set({ 
        error: message,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start game.';
      console.error('[HOST] Failed to start game:', err);
      set({ 
        error: message,
        isLoading: false 
      });
      throw err;
    }
  },

  loadGameState: async () => {
    const { gameData } = get();
    if (!gameData?.roomId) {
      const error = 'No room ID available';
      set({ error });
      throw new Error(error);
    }
    
    set({ isLoading: true, error: null });
    
    try {
      console.log('[PLAYER] Loading game state...');
      const result = await api.getGameState(gameData.roomId);
      console.log('[PLAYER] Game state loaded successfully:', result);
      
      if (result.currentRound && result.gameState) {
        set({
          roundData: {
            round: result.currentRound,
            gameState: result.gameState
          },
          currentScreen: 'game',
          isLoading: false
        });
      } else if (result.gameState) {
        // Game state exists but round might not be ready yet - still transition to game screen
        console.log('[PLAYER] Game state exists but round not fully ready yet');
        set({
          roundData: null,
          currentScreen: 'game',
          isLoading: false
        });
      } else {
        throw new Error('Invalid game state received');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load game state.';
      console.error('[PLAYER] Failed to load game state:', err);
      set({ 
        error: message,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign psychic.';
      console.error('Failed to assign psychic:', err);
      set({ error: message });
      return null;
    }
  },

  updateTargetPosition: (targetPosition: number) => {
    const { roundData } = get();
    if (!roundData) {
      console.error('[Store] Cannot update target position - no round data');
      return;
    }
    
    set({
      roundData: {
        ...roundData,
        round: {
          ...roundData.round,
          target_position: targetPosition
        }
      }
    });
    console.log(`[Store] Updated target position to ${targetPosition}`);
  },

  // Round management
  advanceToNextRound: async (router) => {
    const state = get();
    const gameData = state.gameData;
    const roundData = state.roundData;
    
    if (!gameData || !roundData) {
      console.error('[Store] Cannot advance round: missing game data');
      return;
    }
    
    const roomCode = gameData.roomCode || state.roomCode;
    const currentRound = roundData.gameState.current_round;
    const maxRounds = gameData.gameSettings.numberOfRounds;
    
    try {
      console.log('[Store] Advancing to next round...');
      
      // Check if game is finished
      if (currentRound >= maxRounds) {
        console.log('[Store] Game complete - redirecting to lobby');
        if (roomCode) {
          router.push(`/room/${roomCode}`);
        }
        return;
      }
      
      // Call API to advance round (will rotate psychic and create new round)
      const result = await api.advanceRound(gameData.roomId);
      console.log('[Store] Round advanced successfully:', result);
      
      // Fetch and update the full game state with new round data
      const updatedState = await api.getGameState(gameData.roomId);
      console.log('[Store] Updated game state fetched:', updatedState);
      
      if (updatedState.currentRound && updatedState.gameState) {
        set({
          roundData: {
            round: updatedState.currentRound,
            gameState: updatedState.gameState
          }
        });
        console.log('[Store] Round data updated in store');
      }
      
      // Navigate back to play screen for next round
      if (roomCode) {
        router.push(`/room/${roomCode}/play`);
      }
    } catch (err) {
      console.error('[Store] Failed to advance round:', err);
      throw err;
    }
  },

  // Direct update methods for realtime subscriptions
  setRoundData: (roundData) => {
    set({ roundData });
  },
  
  updateGameState: (gameState) => {
    const current = get().roundData;
    if (current) {
      set({
        roundData: {
          ...current,
          gameState: {
            ...current.gameState,
            ...gameState
          }
        }
      });
    }
  },
  
  updateCurrentRound: (round) => {
    const current = get().roundData;
    if (current) {
      set({
        roundData: {
          ...current,
          round: {
            ...current.round,
            ...round
          }
        }
      });
    }
  },

  // Navigation Actions
  resetGame: () => 
    set({ 
      gameData: null,
      roomCode: null,
      roundData: null, 
      isHost: false,
      error: null
    }),
  
  backToMenu: () => 
    set({ 
      currentScreen: 'main-menu', 
      gameData: null,
      roomCode: null,
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
}), {
  name: 'wavelength-storage',
  partialize: (state) => ({
    userId: state.userId,
    playerName: state.playerName,
  }),
}), { name: 'WavelengthStore' }));

// Initialize: Check if user exists and skip welcome screen
if (typeof window !== 'undefined') {
  const state = useGameStore.getState();
  if (state.userId && state.playerName) {
    console.log('[Store] User already registered:', state.userId, state.playerName);
    useGameStore.setState({ currentScreen: 'main-menu' });
  }
}
