import { NextRequest, NextResponse } from 'next/server';
import { getPlayers, assignPsychic, updatePlayerConnection } from '@/lib/supabase';

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

    const players = await getPlayers(roomId);
    return NextResponse.json({ success: true, players });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch players';
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'assign-psychic': {
        const { roomId, playerId } = params;
        if (!roomId) {
          return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
        }

        // If no playerId provided, select a random non-host player
        let selectedPlayerId = playerId;
        if (!selectedPlayerId) {
          const players = await getPlayers(roomId);
          const eligiblePlayers = players.filter(p => !p.is_host);
          
          if (eligiblePlayers.length === 0) {
            return NextResponse.json({ error: 'No eligible players to assign as psychic' }, { status: 400 });
          }
          
          const randomPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
          selectedPlayerId = randomPlayer.id;
        }

        await assignPsychic(roomId, selectedPlayerId);
        return NextResponse.json({ success: true, psychicId: selectedPlayerId });
      }

      case 'update-connection': {
        const { peerId, isConnected } = params;
        if (!peerId || isConnected === undefined) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await updatePlayerConnection(peerId, isConnected);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to handle player action';
    console.error('Error handling player action:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
