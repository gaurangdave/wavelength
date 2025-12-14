import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, creatorName } = await request.json();

    if (!name || !creatorName) {
      return NextResponse.json(
        { error: 'Room name and creator name are required' },
        { status: 400 }
      );
    }

    // Check if room already exists
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('*')
      .eq('name', name)
      .single();

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room already exists' },
        { status: 409 }
      );
    }

    // Create new room
    const { data: room, error } = await supabase
      .from('rooms')
      .insert([{ name, creator_name: creatorName }])
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error in POST /api/rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('name');

    if (roomName) {
      // Get specific room
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('name', roomName)
        .eq('is_active', true)
        .single();

      if (error || !room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        );
      }

      // Get participants in the room
      const { data: participants } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_connected', true);

      return NextResponse.json({ room, participants: participants || [] });
    } else {
      // Get all active rooms
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json(
          { error: 'Failed to fetch rooms' },
          { status: 500 }
        );
      }

      return NextResponse.json({ rooms: rooms || [] });
    }
  } catch (error) {
    console.error('Error in GET /api/rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}