import { NextRequest, NextResponse } from 'next/server';
import { createRound, updateRoundHint, lockDialPosition, revealRound, updateGameScore, advanceRound } from '@/lib/supabase';

const CONCEPT_PAIRS = [
  { left: 'BAD MOVIE', right: 'GOOD MOVIE' },
  { left: 'COLD', right: 'HOT' },
  { left: 'WEAK', right: 'STRONG' },
  { left: 'BORING', right: 'EXCITING' },
  { left: 'CHEAP', right: 'EXPENSIVE' },
  { left: 'UGLY', right: 'BEAUTIFUL' },
  { left: 'QUIET', right: 'LOUD' },
  { left: 'SIMPLE', right: 'COMPLEX' },
  { left: 'SLOW', right: 'FAST' },
  { left: 'OLD', right: 'NEW' },
  { left: 'SMALL', right: 'LARGE' },
  { left: 'DARK', right: 'BRIGHT' },
  { left: 'SOFT', right: 'HARD' },
  { left: 'COMMON', right: 'RARE' },
  { left: 'SAFE', right: 'DANGEROUS' },
];

// Calculate points based on distance from target
function calculatePoints(dialPosition: number, targetPosition: number, maxPoints: number): number {
  const distance = Math.abs(dialPosition - targetPosition);
  
  // Define scoring zones (adjust these thresholds as needed)
  if (distance <= 5) return maxPoints; // Perfect - within 5%
  if (distance <= 10) return Math.max(1, maxPoints - 1); // Good - within 10%
  if (distance <= 20) return Math.max(1, maxPoints - 2); // Okay - within 20%
  return 0; // Miss
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'create': {
        const { roomId, roundNumber } = params;
        if (!roomId || roundNumber === undefined) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const randomConcepts = CONCEPT_PAIRS[Math.floor(Math.random() * CONCEPT_PAIRS.length)];
        const targetPosition = Math.random() * 100;

        const round = await createRound(roomId, roundNumber, randomConcepts.left, randomConcepts.right, targetPosition);
        return NextResponse.json({ success: true, round });
      }

      case 'update-hint': {
        const { roundId, hint } = params;
        if (!roundId || !hint) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await updateRoundHint(roundId, hint);
        return NextResponse.json({ success: true });
      }

      case 'lock-position': {
        const { roundId, playerId, playerName, position } = params;
        if (!roundId || !playerId || !playerName || position === undefined) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await lockDialPosition(roundId, playerId, playerName, position);
        return NextResponse.json({ success: true });
      }

      case 'reveal': {
        const { roundId, roomId, dialPosition, targetPosition, maxPoints } = params;
        if (!roundId || !roomId || dialPosition === undefined || targetPosition === undefined || !maxPoints) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const points = calculatePoints(dialPosition, targetPosition, maxPoints);
        await revealRound(roundId, points);

        // Update game score
        const livesChange = points > 0 ? 0 : -1; // Lose a life if no points scored
        await updateGameScore(roomId, points, livesChange);

        return NextResponse.json({ success: true, points, livesChange });
      }

      case 'advance': {
        const { roomId } = params;
        if (!roomId) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await advanceRound(roomId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error handling round action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to handle round action' },
      { status: 500 }
    );
  }
}
