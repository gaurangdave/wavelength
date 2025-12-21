import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/store';

/**
 * Hook to listen for game room status changes (waiting room -> game start)
 * Non-host players use this to detect when the host starts the game
 */
export function useGameRoomStatusUpdates(roomId: string | undefined, isHost: boolean) {
  const { isLoading, loadGameState } = useGameStore();

  useEffect(() => {
    if (!roomId || isHost) {
      console.log('[useGameRoomStatus] Skipping - no roomId or is host');
      return;
    }

    console.log('[useGameRoomStatus] Setting up subscription for room:', roomId);

    // Poll as backup
    const checkRoomStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('game_rooms')
          .select('status')
          .eq('id', roomId)
          .single();
        
        if (error) {
          console.error('[useGameRoomStatus] Error checking room status:', error);
          return;
        }
        
        if (data?.status === 'in_progress' && !isLoading) {
          console.log('[useGameRoomStatus] Game started via polling, loading state...');
          await loadGameState();
        }
      } catch (err) {
        console.error('[useGameRoomStatus] Error in status check:', err);
      }
    };

    checkRoomStatus();
    const pollInterval = setInterval(checkRoomStatus, 2000);
    
    // Realtime subscription
    const channel = supabase
      .channel(`game-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        async (payload) => {
          console.log('[useGameRoomStatus] Room updated:', payload);
          
          if (payload.new?.status === 'in_progress' && !isLoading) {
            console.log('[useGameRoomStatus] Game started via Realtime, loading state...');
            await loadGameState();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useGameRoomStatus] Subscription status:', status);
      });

    return () => {
      console.log('[useGameRoomStatus] Cleaning up');
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost, isLoading, loadGameState]);
}

/**
 * Hook to listen for dial position updates from other players
 * Returns [otherPlayerDials, setOtherPlayerDials] for local state management
 */
export function useDialUpdates(
  roomId: string | undefined,
  round: number | undefined,
  playerId: string | undefined,
  isLocked: boolean,
  onDialUpdate: (dials: Array<{playerId: string, playerName: string, position: number, isLocked: boolean}>) => void
) {
  useEffect(() => {
    if (!roomId || !round || !playerId) {
      console.log('[useDialUpdates] Skipping - missing required params');
      return;
    }

    console.log('[useDialUpdates] Setting up subscription');

    // Fetch existing dials
    const fetchExistingDials = async () => {
      try {
        const { data, error } = await supabase
          .from('dial_updates')
          .select('player_id, dial_position, is_locked')
          .eq('room_id', roomId)
          .eq('round_number', round)
          .neq('player_id', playerId);
        
        if (error) throw error;
        
        if (data) {
          const dials = data.map(d => ({
            playerId: d.player_id,
            playerName: 'Player',
            position: d.dial_position,
            isLocked: d.is_locked
          }));
          onDialUpdate(dials);
        }
      } catch (err) {
        console.error('[useDialUpdates] Failed to fetch dials:', err);
      }
    };

    // Initial fetch
    fetchExistingDials();

    // Polling fallback
    const pollInterval = setInterval(() => {
      if (!isLocked) {
        fetchExistingDials();
      }
    }, 2000);

    // Realtime subscription
    const channel = supabase
      .channel(`dial-updates-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dial_updates',
          filter: `room_id=eq.${roomId}`
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          console.log('[useDialUpdates] Dial update received:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const update = payload.new;
            
            if (update?.player_id === playerId) {
              console.log('[useDialUpdates] Ignoring own update');
              return;
            }
            
            // Fetch fresh data to ensure consistency
            fetchExistingDials();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useDialUpdates] Subscription status:', status);
      });

    return () => {
      console.log('[useDialUpdates] Cleaning up');
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [roomId, round, playerId, isLocked, onDialUpdate]);
}
