'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ActiveGameScreen from '@/components/screens/ActiveGameScreen';
import { useGameStore } from '@/lib/store';

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const { userId, playerName, roomCode, setRoomCode } = useGameStore();
  
  const roomCodeFromUrl = params?.roomCode as string;

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!userId || !playerName) {
      router.push('/');
      return;
    }

    // Update store if URL has different roomCode
    if (roomCodeFromUrl && roomCodeFromUrl !== roomCode) {
      setRoomCode(roomCodeFromUrl);
    }
  }, [userId, playerName, roomCodeFromUrl, roomCode, setRoomCode, router]);

  if (!userId || !playerName || !roomCodeFromUrl) {
    return null; // Will redirect
  }

  return <ActiveGameScreen />;
}
