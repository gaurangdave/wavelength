import { NextRequest, NextResponse } from 'next/server';
import { createGameRoom, joinGameRoom } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, roomCode, playerName, peerId, settings } = body;

    if (!roomName || !roomCode || !playerName || !peerId || !settings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the game room
    const room = await createGameRoom(roomName, roomCode, settings);

    // Join the room as the host
    const { player } = await joinGameRoom(roomCode, playerName, peerId, true);

    return NextResponse.json({
      success: true,
      room,
      player
    });
  } catch (error: any) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create game' },
      { status: 500 }
    );
  }
}
