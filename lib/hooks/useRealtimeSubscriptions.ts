import { useEffect, useRef } from 'react';
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

    // Initial check
    const checkInitialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('game_rooms')
          .select('status')
          .eq('id', roomId)
          .single();
        
        if (error) {
          console.error('[useGameRoomStatus] Error checking initial room status:', error);
          return;
        }
        
        if (data?.status === 'in_progress' && !isLoading) {
          console.log('[useGameRoomStatus] Game already in progress, loading state...');
          await loadGameState();
        }
      } catch (err) {
        console.error('[useGameRoomStatus] Error in initial status check:', err);
      }
    };

    checkInitialStatus();
    
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
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost, isLoading, loadGameState]);
}

/**
 * Hook to listen for dial position updates from other players
 * Uses realtime subscriptions to detect when players lock in their guesses
 */
export function useDialUpdates(
  roomId: string | undefined,
  round: number | undefined,
  playerId: string | undefined,
  isLocked: boolean,
  onDialUpdate: (dials: Array<{playerId: string, playerName: string, position: number, isLocked: boolean}>) => void
) {
  const callbackRef = useRef(onDialUpdate);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onDialUpdate;
  }, [onDialUpdate]);

  useEffect(() => {
    if (!roomId || !round || !playerId) {
      console.log('[useDialUpdates] Skipping - missing required params');
      return;
    }

    console.log('[useDialUpdates] Setting up realtime subscription for dial updates');

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
          callbackRef.current(dials);
        }
      } catch (err) {
        console.error('[useDialUpdates] Failed to fetch dials:', err);
      }
    };

    // Initial fetch
    fetchExistingDials();

    // Realtime subscription
    const channelName = `dial-updates-${roomId}-${round}`;
    console.log('[useDialUpdates] Creating channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dial_updates',
          filter: `room_id=eq.${roomId}`
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          console.log('[useDialUpdates] ✅ Dial update received:', payload);
          
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
        if (status === 'SUBSCRIBED') {
          console.log('[useDialUpdates] ✅ Successfully subscribed to dial updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useDialUpdates] ❌ Channel error - subscription failed');
        } else if (status === 'TIMED_OUT') {
          console.error('[useDialUpdates] ❌ Subscription timed out');
        }
      });

    return () => {
      console.log('[useDialUpdates] Cleaning up channel:', channelName);
      supabase.removeChannel(channel);
    };
  }, [roomId, round, playerId]);
}

/**
 * Hook to listen for player list updates in waiting room
 */
export function usePlayerListUpdates(
  roomId: string | undefined,
  onPlayersUpdate: (players: Array<{id: string, player_name: string, is_host: boolean, is_psychic: boolean, is_connected: boolean}>) => void
) {
  const callbackRef = useRef(onPlayersUpdate);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onPlayersUpdate;
  }, [onPlayersUpdate]);

  useEffect(() => {
    if (!roomId) {
      console.log('[usePlayerListUpdates] Skipping - no roomId');
      return;
    }

    console.log('[usePlayerListUpdates] Setting up subscription for room:', roomId);

    // Fetch initial player list
    const fetchPlayers = async () => {
      try {
        console.log('[usePlayerListUpdates] Fetching players for room:', roomId);
        const { data, error } = await supabase
          .from('players')
          .select('id, player_name, is_host, is_psychic, is_connected')
          .eq('room_id', roomId)
          .order('joined_at', { ascending: true });
        
        if (error) throw error;
        
        console.log('[usePlayerListUpdates] Fetched players:', data);
        if (data) {
          callbackRef.current(data);
        }
      } catch (err) {
        console.error('[usePlayerListUpdates] Failed to fetch players:', err);
      }
    };

    // Initial fetch
    fetchPlayers();

    // Polling fallback - COMMENTED OUT (using realtime only)
    // const pollInterval = setInterval(() => {
    //   console.log('[usePlayerListUpdates] Polling for player updates...');
    //   fetchPlayers();
    // }, 2000);

    // Realtime subscription with unique channel name
    const channelName = `players-${roomId}-${Date.now()}`;
    console.log('[usePlayerListUpdates] Creating channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[usePlayerListUpdates] ✅ Player update received:', payload);
          // Refetch to ensure consistency and proper ordering
          fetchPlayers();
        }
      )
      .subscribe((status) => {
        console.log('[usePlayerListUpdates] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[usePlayerListUpdates] ✅ Successfully subscribed to player updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[usePlayerListUpdates] ❌ Channel error - subscription failed');
        } else if (status === 'TIMED_OUT') {
          console.error('[usePlayerListUpdates] ❌ Subscription timed out');
        }
      });

    return () => {
      console.log('[usePlayerListUpdates] Cleaning up channel:', channelName);
      // clearInterval(pollInterval); // COMMENTED OUT
      supabase.removeChannel(channel);
    };
  }, [roomId]);
}

/**
 * Hook to listen for round updates (specifically target_position changes)
 */
export function useRoundUpdates(
  roomId: string | undefined,
  roundNumber: number | undefined,
  onRoundUpdate: (round: {target_position: number | null}) => void
) {
  useEffect(() => {
    if (!roomId || !roundNumber) {
      console.log('[useRoundUpdates] Skipping - missing required params');
      return;
    }

    console.log('[useRoundUpdates] Setting up subscription for round:', roundNumber);

    // Fetch initial round data
    const fetchRound = async () => {
      try {
        const { data, error } = await supabase
          .from('rounds')
          .select('target_position')
          .eq('room_id', roomId)
          .eq('round_number', roundNumber)
          .single();
        
        if (error) throw error;
        
        if (data) {
          onRoundUpdate(data);
        }
      } catch (err) {
        console.error('[useRoundUpdates] Failed to fetch round:', err);
      }
    };

    // Initial fetch
    fetchRound();

    // Realtime subscription
    const channel = supabase
      .channel(`round-${roomId}-${roundNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rounds',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[useRoundUpdates] Round update received:', payload);
          
          // Check if this is the round we're watching
          if (payload.new && typeof payload.new === 'object' && 'round_number' in payload.new) {
            const newRound = payload.new as Record<string, unknown>;
            if (newRound.round_number === roundNumber) {
              fetchRound();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRoundUpdates] Subscription status:', status);
      });

    return () => {
      console.log('[useRoundUpdates] Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [roomId, roundNumber, onRoundUpdate]);
}
