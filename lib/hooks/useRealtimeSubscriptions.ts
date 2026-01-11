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

/**
 * Hook to listen for game state updates (current_round changes)
 * PERFORMANCE OPTIMIZED: Updates store directly from payload instead of refetching
 */
export function useGameStateUpdates(
  roomId: string | undefined,
  onGameStateUpdate?: () => void
) {
  const callbackRef = useRef(onGameStateUpdate);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onGameStateUpdate;
  }, [onGameStateUpdate]);

  useEffect(() => {
    if (!roomId) {
      console.log('[useGameStateUpdates] Skipping - no roomId');
      return;
    }

    console.log('[useGameStateUpdates] Setting up subscription for game state updates');

    // Realtime subscription
    const channel = supabase
      .channel(`game-state-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_state',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[useGameStateUpdates] ✅ Game state update received:', payload);
          
          // PERFORMANCE: Update store directly from payload instead of refetching
          if (payload.new && typeof payload.new === 'object') {
            const newGameState = payload.new as Record<string, unknown>;
            const { updateGameState } = useGameStore.getState();
            
            // Extract the fields we care about
            const update: Partial<{
              current_round: number;
              team_score: number;
              lives_remaining: number;
              current_psychic_id: string;
            }> = {};
            
            if (typeof newGameState.current_round === 'number') {
              update.current_round = newGameState.current_round;
            }
            if (typeof newGameState.team_score === 'number') {
              update.team_score = newGameState.team_score;
            }
            if (typeof newGameState.lives_remaining === 'number') {
              update.lives_remaining = newGameState.lives_remaining;
            }
            if (typeof newGameState.current_psychic_id === 'string') {
              update.current_psychic_id = newGameState.current_psychic_id;
            }
            
            updateGameState(update);
          }
          
          // Still call callback if provided (for additional side effects)
          if (callbackRef.current) {
            callbackRef.current();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useGameStateUpdates] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useGameStateUpdates] ✅ Successfully subscribed to game state updates');
        }
      });

    return () => {
      console.log('[useGameStateUpdates] Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [roomId]);
}

/**
 * Hook to listen for player updates (for detecting psychic role changes)
 * PERFORMANCE OPTIMIZED: Checks if psychic status changed and triggers callback only then
 */
export function usePlayerUpdates(
  playerId: string | undefined,
  onPlayerUpdate?: () => void
) {
  const callbackRef = useRef(onPlayerUpdate);
  const lastPsychicStatusRef = useRef<boolean | null>(null);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onPlayerUpdate;
  }, [onPlayerUpdate]);

  useEffect(() => {
    if (!playerId) {
      console.log('[usePlayerUpdates] Skipping - no playerId');
      return;
    }

    console.log('[usePlayerUpdates] Setting up subscription for player updates:', playerId);

    // Realtime subscription
    const channel = supabase
      .channel(`player-${playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `id=eq.${playerId}`
        },
        (payload) => {
          console.log('[usePlayerUpdates] ✅ Player update received:', payload);
          
          // PERFORMANCE: Only trigger callback if psychic status actually changed
          if (payload.new && typeof payload.new === 'object') {
            const newPlayer = payload.new as Record<string, unknown>;
            const isPsychic = Boolean(newPlayer.is_psychic);
            
            // Check if psychic status changed
            if (lastPsychicStatusRef.current !== null && lastPsychicStatusRef.current !== isPsychic) {
              console.log('[usePlayerUpdates] 🔄 Psychic status changed:', lastPsychicStatusRef.current, '→', isPsychic);
              
              // Trigger callback for psychic role change
              if (callbackRef.current) {
                callbackRef.current();
              }
            }
            
            // Update last known status
            lastPsychicStatusRef.current = isPsychic;
          }
        }
      )
      .subscribe((status) => {
        console.log('[usePlayerUpdates] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[usePlayerUpdates] ✅ Successfully subscribed to player updates');
        }
      });

    return () => {
      console.log('[usePlayerUpdates] Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [playerId]);
}

/**
 * Hook to listen for new round INSERT events
 * PERFORMANCE OPTIMIZED: Updates store directly with new round data from payload
 */
export function useNewRoundInserts(
  roomId: string | undefined,
  onNewRound?: () => void
) {
  const callbackRef = useRef(onNewRound);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onNewRound;
  }, [onNewRound]);

  useEffect(() => {
    if (!roomId) {
      console.log('[useNewRoundInserts] Skipping - missing roomId');
      return;
    }

    console.log('[useNewRoundInserts] Setting up subscription for new rounds in room:', roomId);

    // Realtime subscription
    const channel = supabase
      .channel(`new-rounds-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rounds',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[useNewRoundInserts] New round created:', payload);
          
          // PERFORMANCE: Update store directly from payload
          if (payload.new && typeof payload.new === 'object') {
            const newRound = payload.new as Record<string, unknown>;
            const { updateCurrentRound, roundData } = useGameStore.getState();
            
            // Only update if this is the current round
            if (roundData && typeof newRound.round_number === 'number' && 
                newRound.round_number === roundData.gameState.current_round) {
              const roundUpdate: Partial<{
                id: string;
                round_number: number;
                left_concept: string;
                right_concept: string;
                psychic_hint: string;
                target_position: number;
              }> = {};
              
              if (typeof newRound.id === 'string') roundUpdate.id = newRound.id;
              if (typeof newRound.round_number === 'number') roundUpdate.round_number = newRound.round_number;
              if (typeof newRound.left_concept === 'string') roundUpdate.left_concept = newRound.left_concept;
              if (typeof newRound.right_concept === 'string') roundUpdate.right_concept = newRound.right_concept;
              if (typeof newRound.psychic_hint === 'string') roundUpdate.psychic_hint = newRound.psychic_hint;
              if (typeof newRound.target_position === 'number') roundUpdate.target_position = newRound.target_position;
              
              updateCurrentRound(roundUpdate);
            }
          }
          
          // Still call callback if provided
          if (callbackRef.current) {
            callbackRef.current();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useNewRoundInserts] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useNewRoundInserts] ✅ Successfully subscribed to new round inserts');
        }
      });

    return () => {
      console.log('[useNewRoundInserts] Cleaning up');
      supabase.removeChannel(channel);
    };
  }, [roomId]);
}
