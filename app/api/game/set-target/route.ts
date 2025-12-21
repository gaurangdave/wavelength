import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, roundNumber, targetPosition } = body;

    if (!roomId || roundNumber === undefined || targetPosition === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, roundNumber, targetPosition' },
        { status: 400 }
      );
    }

    // Validate target position is within 0-100
    if (targetPosition < 0 || targetPosition > 100) {
      return NextResponse.json(
        { error: 'Target position must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Update the round with the target position
    const { data, error } = await supabase
      .from('rounds')
      .update({ target_position: targetPosition })
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)
      .select()
      .single();

    if (error) {
      console.error('Error setting target position:', error);
      return NextResponse.json(
        { error: 'Failed to set target position' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      round: data
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to set target position';
    console.error('Error in set-target:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
