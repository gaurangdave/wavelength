'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import { useGameStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { userId, playerName } = useGameStore();

  useEffect(() => {
    // If user is already registered, redirect to dashboard
    if (userId && playerName) {
      router.push('/dashboard');
    }
  }, [userId, playerName, router]);

  return <WelcomeScreen />;
}
