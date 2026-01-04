import { createClient } from '@supabase/supabase-js'

// These are the default local development URLs for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

export interface GameSettings {
  numberOfLives: number
  numberOfRounds: number
  maxPoints: number
}

export interface Player {
  id: string
  room_id: string
  player_name: string
  peer_id: string
  is_host: boolean
  is_psychic: boolean
  is_connected: boolean
  joined_at: string
  last_seen: string
}

export interface GameRoom {
  id: string
  room_code: string
  room_name: string
  host_player_id: string | null
  status: 'waiting' | 'in_progress' | 'finished'
  settings: GameSettings
  created_at: string
  updated_at: string
}

export interface GameState {
  id: string
  room_id: string
  current_round: number
  team_score: number
  lives_remaining: number
  current_psychic_id: string | null
  updated_at: string
}

export interface Round {
  id: string
  room_id: string
  round_number: number
  left_concept: string
  right_concept: string
  psychic_hint: string | null
  target_position: number
  locked_positions: Array<{
    playerId: string
    playerName: string
    position: number
    lockedAt: string
  }>
  revealed: boolean
  points_earned: number
  created_at: string
  updated_at: string
}

export interface DialUpdate {
  id: string
  room_id: string
  round_number: number
  player_id: string
  dial_position: number
  is_locked: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      messages: {
        Row: {
          id: number
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          content?: string
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          creator_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          creator_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          creator_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          room_id: string
          user_name: string
          peer_id: string
          is_connected: boolean
          joined_at: string
          last_seen: string
        }
        Insert: {
          id?: string
          room_id: string
          user_name: string
          peer_id: string
          is_connected?: boolean
          joined_at?: string
          last_seen?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_name?: string
          peer_id?: string
          is_connected?: boolean
          joined_at?: string
          last_seen?: string
        }
      }
      signaling: {
        Row: {
          id: string
          room_id: string
          from_peer_id: string
          to_peer_id: string | null
          type: 'offer' | 'answer' | 'ice-candidate'
          payload: Json
          is_consumed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          from_peer_id: string
          to_peer_id?: string | null
          type: 'offer' | 'answer' | 'ice-candidate'
          payload: Json
          is_consumed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          from_peer_id?: string
          to_peer_id?: string | null
          type?: 'offer' | 'answer' | 'ice-candidate'
          payload?: Json
          is_consumed?: boolean
          created_at?: string
        }
      }
      game_rooms: {
        Row: GameRoom
        Insert: Omit<GameRoom, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<GameRoom, 'id' | 'created_at' | 'updated_at'>>
      }
      players: {
        Row: Player
        Insert: Omit<Player, 'id' | 'joined_at' | 'last_seen'> & {
          id?: string
          joined_at?: string
          last_seen?: string
        }
        Update: Partial<Omit<Player, 'id' | 'joined_at' | 'last_seen'>>
      }
      game_state: {
        Row: GameState
        Insert: Omit<GameState, 'id' | 'updated_at'> & {
          id?: string
          updated_at?: string
        }
        Update: Partial<Omit<GameState, 'id' | 'updated_at'>>
      }
      rounds: {
        Row: Round
        Insert: Omit<Round, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Round, 'id' | 'created_at' | 'updated_at'>>
      }
      dial_updates: {
        Row: DialUpdate
        Insert: Omit<DialUpdate, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<DialUpdate, 'id' | 'created_at'>>
      }
    }
  }
}

// Helper functions for game management
export async function createGameRoom(roomName: string, roomCode: string, settings: GameSettings) {
  const { data, error } = await supabase
    .from('game_rooms')
    .insert({
      room_code: roomCode,
      room_name: roomName,
      status: 'waiting',
      settings,
      host_player_id: null
    })
    .select()
    .single()

  if (error) throw error
  return data as GameRoom
}

export async function joinGameRoom(roomCode: string, playerName: string, peerId: string, isHost: boolean = false) {
  // Find room by code
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select()
    .eq('room_code', roomCode)
    .single()

  if (roomError) throw roomError

  // Add player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      room_id: room.id,
      player_name: playerName,
      peer_id: peerId,
      is_host: isHost,
      is_psychic: false,
      is_connected: true
    })
    .select()
    .single()

  if (playerError) throw playerError

  // Update host if this is the first player
  if (isHost) {
    await supabase
      .from('game_rooms')
      .update({ host_player_id: player.id })
      .eq('id', room.id)
  }

  return { room: room as GameRoom, player: player as Player }
}

export async function getGameRoom(roomCode: string) {
  const { data, error } = await supabase
    .from('game_rooms')
    .select(`
      *,
      players (*)
    `)
    .eq('room_code', roomCode)
    .single()

  if (error) throw error
  return data
}

export async function getPlayers(roomId: string) {
  const { data, error } = await supabase
    .from('players')
    .select()
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as Player[]
}

export async function updatePlayerConnection(peerId: string, isConnected: boolean) {
  const { error } = await supabase
    .from('players')
    .update({ 
      is_connected: isConnected,
      last_seen: new Date().toISOString()
    })
    .eq('peer_id', peerId)

  if (error) throw error
}

export async function assignPsychic(roomId: string, playerId: string) {
  // Remove psychic from all players in room
  await supabase
    .from('players')
    .update({ is_psychic: false })
    .eq('room_id', roomId)

  // Assign psychic to selected player
  const { error } = await supabase
    .from('players')
    .update({ is_psychic: true })
    .eq('id', playerId)

  if (error) throw error

  // Update game state
  await supabase
    .from('game_state')
    .update({ current_psychic_id: playerId })
    .eq('room_id', roomId)
}

export async function startGame(roomId: string, initialLives: number) {
  // Update room status
  await supabase
    .from('game_rooms')
    .update({ status: 'in_progress' })
    .eq('id', roomId)

  // Create or update game state (upsert to handle restarts)
  const { data, error } = await supabase
    .from('game_state')
    .upsert({
      room_id: roomId,
      current_round: 1,
      team_score: 0,
      lives_remaining: initialLives,
      current_psychic_id: null
    }, {
      onConflict: 'room_id'
    })
    .select()
    .single()

  if (error) throw error
  return data as GameState
}

export async function createRound(
  roomId: string,
  roundNumber: number,
  leftConcept: string,
  rightConcept: string,
  targetPosition: number | null
) {
  const { data, error } = await supabase
    .from('rounds')
    .insert({
      room_id: roomId,
      round_number: roundNumber,
      left_concept: leftConcept,
      right_concept: rightConcept,
      target_position: targetPosition,
      psychic_hint: null,
      locked_positions: [],
      revealed: false,
      points_earned: 0
    })
    .select()
    .single()

  if (error) throw error
  return data as Round
}

export async function updateRoundHint(roundId: string, hint: string) {
  const { error } = await supabase
    .from('rounds')
    .update({ psychic_hint: hint })
    .eq('id', roundId)

  if (error) throw error
}

export async function lockDialPosition(
  roundId: string,
  playerId: string,
  playerName: string,
  position: number
) {
  const { data: round, error: fetchError } = await supabase
    .from('rounds')
    .select('locked_positions')
    .eq('id', roundId)
    .single()

  if (fetchError) throw fetchError

  const lockedPositions = round.locked_positions || []
  lockedPositions.push({
    playerId,
    playerName,
    position,
    lockedAt: new Date().toISOString()
  })

  const { error } = await supabase
    .from('rounds')
    .update({ locked_positions: lockedPositions })
    .eq('id', roundId)

  if (error) throw error
}

export async function revealRound(roundId: string, pointsEarned: number) {
  const { error } = await supabase
    .from('rounds')
    .update({ 
      revealed: true,
      points_earned: pointsEarned
    })
    .eq('id', roundId)

  if (error) throw error
}

export async function updateGameScore(roomId: string, scoreChange: number, livesChange: number = 0) {
  const { data: gameState, error: fetchError } = await supabase
    .from('game_state')
    .select()
    .eq('room_id', roomId)
    .single()

  if (fetchError) throw fetchError

  const { error } = await supabase
    .from('game_state')
    .update({
      team_score: gameState.team_score + scoreChange,
      lives_remaining: Math.max(0, gameState.lives_remaining + livesChange)
    })
    .eq('room_id', roomId)

  if (error) throw error
}

export async function advanceRound(roomId: string, newLeftConcept: string, newRightConcept: string) {
  // Get current game state
  const { data: gameState, error: fetchError } = await supabase
    .from('game_state')
    .select()
    .eq('room_id', roomId)
    .single()

  if (fetchError) throw fetchError

  // Get all players in the room (ordered by join time for consistent rotation)
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select()
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })

  if (playersError) throw playersError
  if (!players || players.length === 0) throw new Error('No players found in room')

  // Find the current psychic index
  const currentPsychicIndex = players.findIndex(p => p.id === gameState.current_psychic_id)
  
  // Rotate to next player (wrap around to first player if at end)
  const nextPsychicIndex = (currentPsychicIndex + 1) % players.length
  const newPsychicId = players[nextPsychicIndex].id

  console.log('[advanceRound] Rotating psychic from', gameState.current_psychic_id, 'to', newPsychicId)

  // Update game state: increment round and set new psychic
  const { error: updateError } = await supabase
    .from('game_state')
    .update({ 
      current_round: gameState.current_round + 1,
      current_psychic_id: newPsychicId
    })
    .eq('room_id', roomId)

  if (updateError) throw updateError

  // Create new round with new concepts (target_position will be null until psychic sets it)
  const newRound = await createRound(
    roomId,
    gameState.current_round + 1,
    newLeftConcept,
    newRightConcept,
    null // Psychic will set target position
  )

  return { newRound, newPsychicId }
}

export async function endGame(roomId: string) {
  const { error } = await supabase
    .from('game_rooms')
    .update({ status: 'finished' })
    .eq('id', roomId)

  if (error) throw error
}