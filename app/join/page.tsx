'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JoinRoomForm from '@/components/screens/JoinRoomForm';
import { useGameStore } from '@/lib/store';

export default function JoinPage() {
  const router = useRouter();
  const { userId, playerName } = useGameStore();

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!userId || !playerName) {
      router.push('/');
    }
  }, [userId, playerName, router]);

  if (!userId || !playerName) {
    return null; // Will redirect
  }

  return <JoinRoomForm />;
}
