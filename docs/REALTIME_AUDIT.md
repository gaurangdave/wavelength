# Realtime Subscriptions Audit

## Summary
All realtime subscriptions in the codebase now have corresponding database tables properly configured for realtime updates.

## Realtime Subscription Use Cases

### 1. Game Room Status Updates
- **Hook**: `useGameRoomStatusUpdates`
- **File**: `/lib/hooks/useRealtimeSubscriptions.ts`
- **Table**: `game_rooms`
- **Purpose**: Non-host players detect when host starts the game
- **Events**: UPDATE
- **Filter**: `id=eq.{roomId}`
- **Status**: ✅ **ENABLED** (migration: `20241222000003_enable_realtime_for_game_rooms.sql`)

### 2. Dial Position Updates
- **Hook**: `useDialUpdates`
- **File**: `/lib/hooks/useRealtimeSubscriptions.ts`
- **Table**: `dial_updates`
- **Purpose**: Players (especially psychic) see other players' dial positions and lock status in real-time
- **Events**: * (all events: INSERT, UPDATE, DELETE)
- **Filter**: `room_id=eq.{roomId}`
- **Status**: ✅ **ENABLED** (migration: `20241222000001_enable_realtime_for_dial_updates.sql`)

### 3. Player List Updates
- **Hook**: `usePlayerListUpdates`
- **File**: `/lib/hooks/useRealtimeSubscriptions.ts`
- **Table**: `players`
- **Purpose**: All players in waiting room see when new players join
- **Events**: * (all events: INSERT, UPDATE, DELETE)
- **Filter**: `room_id=eq.{roomId}`
- **Status**: ✅ **ENABLED** (migration: `20241222000004_enable_realtime_for_players.sql`)

### 4. Round Updates (Target Position)
- **Hook**: `useRoundUpdates`
- **File**: `/lib/hooks/useRealtimeSubscriptions.ts`
- **Table**: `rounds`
- **Purpose**: Non-psychic players detect when psychic sets the target position
- **Events**: UPDATE
- **Filter**: `room_id=eq.{roomId}`
- **Status**: ✅ **ENABLED** (migration: `20241222000002_enable_realtime_for_rounds.sql`)

## Migration Files

All tables have been added to the `supabase_realtime` publication with `REPLICA IDENTITY FULL`:

1. **20241222000001_enable_realtime_for_dial_updates.sql**
   - Enables realtime for `dial_updates` table
   - Sets REPLICA IDENTITY FULL

2. **20241222000002_enable_realtime_for_rounds.sql**
   - Enables realtime for `rounds` table
   - Sets REPLICA IDENTITY FULL

3. **20241222000003_enable_realtime_for_game_rooms.sql**
   - Enables realtime for `game_rooms` table
   - Sets REPLICA IDENTITY FULL

4. **20241222000004_enable_realtime_for_players.sql**
   - Enables realtime for `players` table
   - Sets REPLICA IDENTITY FULL

## Configuration Details

### REPLICA IDENTITY FULL
All tables are set to `REPLICA IDENTITY FULL`, which means:
- All column values are included in the realtime update payload
- Enables better filtering and data access on the client side
- Slightly more overhead but necessary for the filtering patterns used in the app

### Publication
All tables are added to `supabase_realtime` publication, which:
- Enables Supabase to broadcast changes to subscribed clients
- Required for the Supabase client library's realtime subscriptions to work
- Must be explicitly configured per table

## Verification Checklist

- ✅ All subscription hooks identified
- ✅ All tables used in subscriptions identified
- ✅ Realtime enabled for `game_rooms`
- ✅ Realtime enabled for `dial_updates`
- ✅ Realtime enabled for `players`
- ✅ Realtime enabled for `rounds`
- ✅ REPLICA IDENTITY set to FULL for all tables
- ✅ Migrations applied successfully

## Testing Recommendations

1. **Game Room Status**: Have a non-host player in the waiting room while host starts game
2. **Dial Updates**: Have psychic monitor the screen while other players adjust their dials
3. **Player List**: Add a new player to a waiting room and verify others see the update
4. **Round Updates**: Have a non-psychic player wait while psychic sets target position

## Pattern Summary

The app follows this consistent pattern:
1. **Initial Fetch**: Hook fetches current data on mount
2. **Realtime Subscription**: Subscribe to postgres_changes for the table
3. **Callback on Update**: When realtime update received, re-fetch data for consistency
4. **Zustand Store**: Some hooks update Zustand store (e.g., `loadGameState`)
5. **Cleanup**: Unsubscribe from channel on unmount

This pattern ensures data consistency while leveraging realtime capabilities for instant updates.
