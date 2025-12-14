import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { roomId, userName, content } = await request.json();

    if (!roomId || !userName || !content?.trim()) {
      return NextResponse.json(
        { error: 'Room ID, user name, and message content are required' },
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

    // Store message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        content: `${userName}: ${content}`
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing message:', error);
      return NextResponse.json(
        { error: 'Failed to store message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const after = searchParams.get('after');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('messages')
      .select('*');

    // If 'after' timestamp is provided, filter for newer messages
    if (after) {
      query = query.gt('created_at', after);
    }

    const { data: messages, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Reverse to show oldest first
    const reversedMessages = (messages || []).reverse();

    return NextResponse.json({ messages: reversedMessages });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}