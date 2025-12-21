// Utility functions for making API calls to the game backend

export interface CreateGameRequest {
  roomName: string;
  roomCode: string;
  playerName: string;
  peerId: string;
  settings: {
    numberOfLives: number;
    numberOfRounds: number;
    maxPoints: number;
  };
}

export interface JoinGameRequest {
  roomCode: string;
  playerName: string;
  peerId: string;
}

export interface StartGameRequest {
  roomId: string;
  psychicPlayerId: string;
  numberOfLives: number;
}

export interface RoundAction {
  action: 'create' | 'update-hint' | 'lock-position' | 'reveal' | 'advance';
  [key: string]: unknown;
}

export interface PlayerAction {
  action: 'assign-psychic' | 'update-connection';
  [key: string]: unknown;
}

export async function createGame(data: CreateGameRequest) {
  const response = await fetch('/api/game/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create game');
  }

  return response.json();
}

export async function joinGame(data: JoinGameRequest) {
  const response = await fetch('/api/game/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join game');
  }

  return response.json();
}

export async function handleRoundAction(action: RoundAction) {
  const response = await fetch('/api/game/round', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to handle round action');
  }

  return response.json();
}

export async function handlePlayerAction(action: PlayerAction) {
  const response = await fetch('/api/game/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to handle player action');
  }

  return response.json();
}

export async function getPlayers(roomId: string) {
  const response = await fetch(`/api/game/players?roomId=${roomId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch players');
  }

  const data = await response.json();
  return data.players || [];
}

export async function getGameState(roomId: string) {
  const response = await fetch(`/api/game/state?roomId=${roomId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch game state');
  }

  return response.json();
}

// Helper function to assign random psychic (API will select randomly)
export async function assignRandomPsychic(roomId: string) {
  const result = await handlePlayerAction({
    action: 'assign-psychic',
    roomId
  });
  return result;
}

// Helper function to lock dial position
export async function lockDialPosition(
  roomId: string,
  roundNumber: number,
  playerId: string,
  position: number
) {
  return handleRoundAction({
    action: 'lock-position',
    roomId,
    roundNumber,
    playerId,
    position
  });
}

// Simplified startGame function for use in components
export async function startGame(roomId: string) {
  const response = await fetch('/api/game/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start game');
  }

  return response.json();
}

// Set target position (psychic only)
export async function setTargetPosition(
  roomId: string,
  roundNumber: number,
  targetPosition: number
) {
  const response = await fetch('/api/game/set-target', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, roundNumber, targetPosition })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set target position');
  }

  return response.json();
}

// Generate a unique peer ID
export function generatePeerId(): string {
  return `peer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate a unique room code
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
