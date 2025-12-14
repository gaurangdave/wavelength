import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { roomId, userName, peerId } = await request.json();

    if (!roomId || !userName || !peerId) {
      return NextResponse.json(
        { error: 'Room ID, user name, and peer ID are required' },
        { status: 400 }
      );
    }

    // Check if room exists
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .eq('is_active', true)
      .single();

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Add participant to room
    const { data: participant, error } = await supabase
      .from('participants')
      .insert([{
        room_id: roomId,
        user_name: userName,
        peer_id: peerId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error joining room:', error);
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    // Get all participants in the room
    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_connected', true);

    return NextResponse.json({ 
      participant, 
      participants: participants || [] 
    });
  } catch (error) {
    console.error('Error in POST /api/participants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get('peerId');

    if (!peerId) {
      return NextResponse.json(
        { error: 'Peer ID is required' },
        { status: 400 }
      );
    }

    // Remove participant or mark as disconnected
    const { error } = await supabase
      .from('participants')
      .update({ is_connected: false })
      .eq('peer_id', peerId);

    if (error) {
      console.error('Error leaving room:', error);
      return NextResponse.json(
        { error: 'Failed to leave room' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/participants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}