import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { roomId, fromPeerId, toPeerId, type, payload } = await request.json();

    if (!roomId || !fromPeerId || !type || !payload) {
      return NextResponse.json(
        { error: 'Room ID, from peer ID, type, and payload are required' },
        { status: 400 }
      );
    }

    // Store signaling message
    const { data: signal, error } = await supabase
      .from('signaling')
      .insert([{
        room_id: roomId,
        from_peer_id: fromPeerId,
        to_peer_id: toPeerId,
        type,
        payload
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing signaling message:', error);
      return NextResponse.json(
        { error: 'Failed to send signaling message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ signal });
  } catch (error) {
    console.error('Error in POST /api/signaling:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get('peerId');
    const roomId = searchParams.get('roomId');

    if (!peerId || !roomId) {
      return NextResponse.json(
        { error: 'Peer ID and room ID are required' },
        { status: 400 }
      );
    }

    // Get messages for this peer
    const { data: signals, error } = await supabase
      .from('signaling')
      .select('*')
      .eq('room_id', roomId)
      .or(`to_peer_id.eq.${peerId},to_peer_id.is.null`)
      .eq('is_consumed', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching signaling messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch signaling messages' },
        { status: 500 }
      );
    }

    // Mark messages as consumed
    if (signals && signals.length > 0) {
      const signalIds = signals.map(s => s.id);
      await supabase
        .from('signaling')
        .update({ is_consumed: true })
        .in('id', signalIds);
    }

    return NextResponse.json({ signals: signals || [] });
  } catch (error) {
    console.error('Error in GET /api/signaling:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}