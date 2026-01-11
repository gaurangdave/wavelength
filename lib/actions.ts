/**
 * Centralized Actions Layer
 * 
 * This module provides a single point of entry for all database operations.
 * Benefits:
 * - Maintains unidirectional data flow (Flux pattern)
 * - Makes state changes easy to track and debug
 * - Decouples business logic from UI components
 * - Provides consistent error handling
 * - Enables easier testing and mocking
 * 
 * Architecture: Component → Action → Database → Store Update
 */

import { supabase } from './supabase';
import type { Database } from './database.types';

type DialUpdate = Database['public']['Tables']['dial_updates']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type GameState = Database['public']['Tables']['game_state']['Row'];

// ============================================================================
// DIAL POSITION ACTIONS
// ============================================================================

export interface UpdateDialPositionParams {
  roomId: string;
  roundNumber: number;
  playerId: string;
  dialPosition: number;
  isLocked: boolean;
}

/**
 * Update a player's dial position in the database
 * Used when player moves the dial or locks in their guess
 */
export async function updateDialPosition(params: UpdateDialPositionParams): Promise<void> {
  const { roomId, roundNumber, playerId, dialPosition, isLocked } = params;
  
  console.log('[Actions] Updating dial position:', { playerId, dialPosition, isLocked });
  
  const { error } = await supabase
    .from('dial_updates')
    .upsert(
      {
        room_id: roomId,
        round_number: roundNumber,
        player_id: playerId,
        dial_position: dialPosition,
        is_locked: isLocked,
      },
      {
        onConflict: 'room_id,round_number,player_id',
      }
    );

  if (error) {
    console.error('[Actions] Failed to update dial position:', error);
    throw new Error(`Failed to update dial position: ${error.message}`);
  }
  
  console.log('[Actions] ✅ Dial position updated successfully');
}

// ============================================================================
// PLAYER COUNT ACTIONS
// ============================================================================

/**
 * Get the total number of players in a room
 * Used for displaying player count and determining game state
 */
export async function getPlayerCount(roomId: string): Promise<number> {
  console.log('[Actions] Fetching player count for room:', roomId);
  
  const { count, error } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId);

  if (error) {
    console.error('[Actions] Failed to fetch player count:', error);
    throw new Error(`Failed to fetch player count: ${error.message}`);
  }

  console.log('[Actions] ✅ Player count:', count);
  return count || 0;
}

// ============================================================================
// GUESS/RESULTS ACTIONS
// ============================================================================

export interface PlayerGuess {
  playerId: string;
  playerName: string;
  dialPosition: number;
  distance: number;
  points: number;
}

/**
 * Fetch all locked guesses for a round with calculated scores
 * Used on the results screen to display player performance
 */
export async function getLockedGuessesWithScores(
  roomId: string,
  roundNumber: number,
  targetPosition: number,
  maxPoints: number
): Promise<PlayerGuess[]> {
  console.log('[Actions] Fetching locked guesses for round:', roundNumber);

  // Fetch all locked dial positions
  const { data: dialData, error: dialError } = await supabase
    .from('dial_updates')
    .select('player_id, dial_position')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)
    .eq('is_locked', true);

  if (dialError) {
    console.error('[Actions] Failed to fetch dial updates:', dialError);
    throw new Error(`Failed to fetch guesses: ${dialError.message}`);
  }

  if (!dialData || dialData.length === 0) {
    console.log('[Actions] No locked guesses found');
    return [];
  }

  // Fetch player names
  const playerIds = dialData.map(d => d.player_id).filter((id): id is string => id !== null);
  const { data: playersData, error: playersError } = await supabase
    .from('players')
    .select('id, player_name')
    .in('id', playerIds);

  if (playersError) {
    console.error('[Actions] Failed to fetch player names:', playersError);
    throw new Error(`Failed to fetch player names: ${playersError.message}`);
  }

  // Create a map for quick player lookup
  const playerMap = new Map(
    playersData?.map(p => [p.id, p.player_name]) || []
  );

  // Calculate distances and points for each guess
  const guesses: PlayerGuess[] = dialData
    .filter(dial => dial.player_id !== null)
    .map(dial => {
      const distance = Math.abs(dial.dial_position - targetPosition);
      const points = calculatePoints(distance, maxPoints);

      return {
        playerId: dial.player_id!,
        playerName: playerMap.get(dial.player_id!) || 'Unknown',
        dialPosition: dial.dial_position,
        distance,
        points,
      };
    });

  // Sort by distance (closest first)
  guesses.sort((a, b) => a.distance - b.distance);

  console.log('[Actions] ✅ Fetched', guesses.length, 'locked guesses');
  return guesses;
}

/**
 * Calculate points based on distance from target
 * Scoring zones:
 * - Within 5%: Full points
 * - Within 10%: Max points - 1
 * - Within 20%: Max points - 2
 * - Beyond 20%: 0 points
 */
function calculatePoints(distance: number, maxPoints: number): number {
  if (distance <= 5) return maxPoints;
  if (distance <= 10) return Math.max(1, maxPoints - 1);
  if (distance <= 20) return Math.max(1, maxPoints - 2);
  return 0;
}

// ============================================================================
// GAME STATE ACTIONS
// ============================================================================

export interface GameStateData {
  current_round: number;
  team_score: number;
  lives_remaining: number;
  current_psychic_id: string;
}

/**
 * Fetch current game state for a room
 * Used when components need fresh game state data
 */
export async function fetchGameState(roomId: string): Promise<GameStateData> {
  console.log('[Actions] Fetching game state for room:', roomId);

  const { data, error } = await supabase
    .from('game_state')
    .select('current_round, team_score, lives_remaining, current_psychic_id')
    .eq('room_id', roomId)
    .single();

  if (error) {
    console.error('[Actions] Failed to fetch game state:', error);
    throw new Error(`Failed to fetch game state: ${error.message}`);
  }

  console.log('[Actions] ✅ Game state fetched:', data);
  return {
    current_round: data.current_round || 0,
    team_score: data.team_score || 0,
    lives_remaining: data.lives_remaining || 0,
    current_psychic_id: data.current_psychic_id || '',
  };
}

// ============================================================================
// EXPORT ALL ACTIONS
// ============================================================================

/**
 * Consolidated actions object for easy import
 * Usage: import { actions } from '@/lib/actions'
 *        await actions.updateDialPosition(...)
 */
export const actions = {
  // Dial operations
  updateDialPosition,
  
  // Player queries
  getPlayerCount,
  
  // Results/guesses
  getLockedGuessesWithScores,
  
  // Game state
  fetchGameState,
} as const;

// Also export individual functions for tree-shaking
export default actions;
