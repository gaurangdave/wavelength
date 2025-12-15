import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { room_id, from_peer_id, to_peer_id, type, payload } = await request.json();

    if (!room_id || !from_peer_id || !type) {
      return NextResponse.json(
        { error: 'room_id, from_peer_id, and type are required' },
        { status: 400 }
      );
    }

    // Store signaling message
    const { data: signal, error } = await supabase
      .from('signaling')
      .insert([{
        room_id,
        from_peer_id,
        to_peer_id,
        type,
        payload,
        is_consumed: false
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

    return NextResponse.json({ success: true, signal });
  } catch (error) {
    console.error('Error in POST /api/signaling:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('signaling')
      .update({ is_consumed: true })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating signaling message:', error);
      return NextResponse.json(
        { error: 'Failed to update signaling message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/signaling:', error);
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