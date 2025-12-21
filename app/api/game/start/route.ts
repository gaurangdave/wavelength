import { NextRequest, NextResponse } from 'next/server';
import { startGame, createRound, assignPsychic } from '@/lib/supabase';

// Sample concept pairs for the game
const CONCEPT_PAIRS = [
  { left: 'BAD MOVIE', right: 'GOOD MOVIE' },
  { left: 'COLD', right: 'HOT' },
  { left: 'WEAK', right: 'STRONG' },
  { left: 'BORING', right: 'EXCITING' },
  { left: 'CHEAP', right: 'EXPENSIVE' },
  { left: 'UGLY', right: 'BEAUTIFUL' },
  { left: 'QUIET', right: 'LOUD' },
  { left: 'SIMPLE', right: 'COMPLEX' },
  { left: 'SLOW', right: 'FAST' },
  { left: 'OLD', right: 'NEW' },
  { left: 'SMALL', right: 'LARGE' },
  { left: 'DARK', right: 'BRIGHT' },
  { left: 'SOFT', right: 'HARD' },
  { left: 'COMMON', right: 'RARE' },
  { left: 'SAFE', right: 'DANGEROUS' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, psychicPlayerId, numberOfLives } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId' },
        { status: 400 }
      );
    }

    // Get room settings if numberOfLives not provided
    let lives = numberOfLives;
    let psychicId = psychicPlayerId;

    if (lives === undefined || !psychicId) {
      // Fetch from database
      const { supabase } = await import('@/lib/supabase');
      
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('settings')
        .eq('id', roomId)
        .single();

      if (roomError || !room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        );
      }

      if (lives === undefined) {
        lives = room.settings.numberOfLives || 3;
      }

      // Get current psychic if not provided
      if (!psychicId) {
        const { data: players } = await supabase
          .from('players')
          .select('id')
          .eq('room_id', roomId)
          .eq('is_psychic', true)
          .single();
        
        if (players) {
          psychicId = players.id;
        } else {
          return NextResponse.json(
            { error: 'No psychic assigned. Assign a psychic first.' },
            { status: 400 }
          );
        }
      }
    }

    // Delete any existing rounds and dial updates for this room (in case of restart)
    const { supabase } = await import('@/lib/supabase');
    await supabase
      .from('dial_updates')
      .delete()
      .eq('room_id', roomId);
    
    await supabase
      .from('rounds')
      .delete()
      .eq('room_id', roomId);

    // Start the game
    const gameState = await startGame(roomId, lives);

    // Make sure psychic is assigned
    if (psychicId) {
      await assignPsychic(roomId, psychicId);
    }
    
    // Re-fetch game state to get the updated psychic ID
    const { supabase: supabaseClient } = await import('@/lib/supabase');
    const { data: updatedGameState, error: gameStateError } = await supabaseClient
      .from('game_state')
      .select('*')
      .eq('room_id', roomId)
      .single();
    
    if (gameStateError) throw gameStateError;

    // Create the first round with random concepts
    const randomConcepts = CONCEPT_PAIRS[Math.floor(Math.random() * CONCEPT_PAIRS.length)];
    const targetPosition = Math.random() * 100; // Random target between 0-100

    const round = await createRound(
      roomId,
      1,
      randomConcepts.left,
      randomConcepts.right,
      targetPosition
    );

    return NextResponse.json({
      success: true,
      gameState: updatedGameState,
      round
    });
  } catch (error: any) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start game' },
      { status: 500 }
    );
  }
}
