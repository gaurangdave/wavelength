import { NextRequest, NextResponse } from 'next/server';
import { joinGameRoom, getGameRoom } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, playerName, peerId } = body;

    if (!roomCode || !playerName || !peerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if room exists and is joinable
    const roomData = await getGameRoom(roomCode);
    
    if (!roomData) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (roomData.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game already in progress' },
        { status: 400 }
      );
    }

    // Join the room
    const { room, player } = await joinGameRoom(roomCode, playerName, peerId, false);

    return NextResponse.json({
      success: true,
      room,
      player
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join game';
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
