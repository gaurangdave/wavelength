import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName } = body;

    if (!playerName || !playerName.trim()) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Create a standalone player record (not associated with any room yet)
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        player_name: playerName.trim(),
        peer_id: `temp-${Date.now()}`, // Temporary peer ID, will be updated when joining a room
        is_host: false,
        is_psychic: false,
        is_connected: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      userId: player.id,
      playerName: player.player_name,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to register player';
    console.error('Error registering player:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
