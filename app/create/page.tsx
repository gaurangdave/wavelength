'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateRoomForm from '@/components/screens/CreateRoomForm';
import { useGameStore } from '@/lib/store';

export default function CreatePage() {
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

  return <CreateRoomForm />;
}
