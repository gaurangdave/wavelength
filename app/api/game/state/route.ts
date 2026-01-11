import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Fetch game state
    const { data: gameState, error: stateError } = await supabase
      .from('game_state')
      .select()
      .eq('room_id', roomId)
      .single();

    if (stateError) throw stateError;

    // Fetch current round (only if current_round is not null)
    let currentRound = null;
    if (gameState.current_round !== null) {
      const { data, error: roundError } = await supabase
        .from('rounds')
        .select()
        .eq('room_id', roomId)
        .eq('round_number', gameState.current_round)
        .single();

      if (roundError && roundError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is okay for the first round
        throw roundError;
      }
      
      currentRound = data;
    }

    return NextResponse.json({
      success: true,
      gameState,
      currentRound
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch game state';
    console.error('Error fetching game state:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
