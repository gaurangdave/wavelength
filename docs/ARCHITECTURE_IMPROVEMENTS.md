# Architecture Improvements - P1 Centralized Actions Layer

**Date:** January 11, 2026  
**Status:** ✅ P1 Complete - Centralized Actions Layer Implemented

## Problem Statement

**From Audit Report:**
> **Finding:** The component executes direct database mutations, bypassing the central store:
> ```typescript
> // ActiveGameScreen.tsx
> const updateDialPosition = async (position: number, locked: boolean) => {
>   await supabase.from("dial_updates").upsert(...) // <--- VIOLATION
> };
> ```
> 
> **Impact:** 
> - Breaks the unidirectional data flow (Flux).
> - Makes state changes hard to track and debug.
> - Logic is tightly coupled to the UI component.

## Solution Implemented

### 1. Created Centralized Actions Module

**File:** `lib/actions.ts`

A new module that provides a single point of entry for all database operations:

```typescript
// Architecture: Component → Action → Database → Store Update

export const actions = {
  updateDialPosition,
  getPlayerCount,
  getLockedGuessesWithScores,
  fetchGameState,
} as const;
```

**Benefits:**
- ✅ Maintains unidirectional data flow (Flux pattern)
- ✅ Makes state changes easy to track and debug
- ✅ Decouples business logic from UI components
- ✅ Provides consistent error handling
- ✅ Enables easier testing and mocking

### 2. Actions Implemented

#### Dial Position Actions

```typescript
export async function updateDialPosition(params: UpdateDialPositionParams): Promise<void>
```

**Before (in component):**
```typescript
const updateDialPosition = async (position: number, locked: boolean) => {
  await supabase.from("dial_updates").upsert({
    room_id: roomId,
    round_number: round,
    player_id: playerId,
    dial_position: position,
    is_locked: locked,
  }, { onConflict: "room_id,round_number,player_id" });
};
```

**After (centralized):**
```typescript
await actions.updateDialPosition({
  roomId,
  roundNumber: round,
  playerId,
  dialPosition: position,
  isLocked: locked,
});
```

**Benefits:**
- Type-safe parameters with interface
- Centralized error handling with logging
- No direct database access in component

#### Player Count Actions

```typescript
export async function getPlayerCount(roomId: string): Promise<number>
```

**Before (in component):**
```typescript
const { count, error } = await supabase
  .from("players")
  .select("id", { count: "exact", head: true })
  .eq("room_id", roomId);

if (error) throw error;
setTotalPlayers(count || 0);
```

**After (centralized):**
```typescript
const count = await actions.getPlayerCount(roomId);
setTotalPlayers(count);
```

**Benefits:**
- Simpler component code
- Consistent error messages
- Single location to update query logic

#### Results/Guesses Actions

```typescript
export async function getLockedGuessesWithScores(
  roomId: string,
  roundNumber: number,
  targetPosition: number,
  maxPoints: number
): Promise<PlayerGuess[]>
```

**Before (in ResultsScreen):**
```typescript
// Fetch dial updates
const { data: dialData } = await supabase
  .from('dial_updates')
  .select('player_id, dial_position')
  .eq('room_id', roomId)
  .eq('round_number', round)
  .eq('is_locked', true);

// Fetch player names
const { data: playersData } = await supabase
  .from('players')
  .select('id, player_name')
  .in('id', playerIds);

// Calculate distances and points
const guesses = dialData?.map(dial => {
  const distance = Math.abs(dial.dial_position - targetPosition);
  let points = 0;
  if (distance <= 5) points = 4;
  else if (distance <= 10) points = 3;
  // ... more scoring logic
  return { playerId, playerName, position, distance, points };
});

// Sort results
guesses.sort((a, b) => ...);
```

**After (centralized):**
```typescript
const guesses = await actions.getLockedGuessesWithScores(
  roomId,
  round,
  targetPosition,
  maxPoints
);
```

**Benefits:**
- 50+ lines of code → 5 lines
- Business logic extracted from UI
- Consistent scoring calculation
- Easier to test scoring logic

#### Game State Actions

```typescript
export async function fetchGameState(roomId: string): Promise<GameStateData>
```

**Usage:**
```typescript
const gameState = await actions.fetchGameState(roomId);
```

### 3. Components Refactored

#### ActiveGameScreen.tsx

**Changes:**
- ✅ Removed direct `supabase.from("dial_updates").upsert()`
- ✅ Removed direct `supabase.from("players").select()`
- ✅ Removed direct `supabase.from("game_state").select()`
- ✅ Now uses `actions.updateDialPosition()`
- ✅ Now uses `actions.getPlayerCount()`
- ✅ Now uses `actions.fetchGameState()`

**Line count reduction:** ~30 lines removed

#### ResultsScreen.tsx

**Changes:**
- ✅ Removed complex multi-query logic (dial updates + players)
- ✅ Removed inline scoring calculation
- ✅ Removed sorting logic
- ✅ Now uses `actions.getLockedGuessesWithScores()`

**Line count reduction:** ~50 lines removed

## Architecture Diagram

### Before (Tight Coupling)

```
┌─────────────────────┐
│  ActiveGameScreen   │
│  ┌───────────────┐  │
│  │ Component     │──────┐
│  │ Logic         │      │
│  └───────────────┘      │
│  ┌───────────────┐      │
│  │ Database      │      │ Direct coupling
│  │ Queries       │◄─────┘
│  └───────────────┘      │
└─────────────────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ Supabase │
                    └──────────┘
```

### After (Unidirectional Flow)

```
┌─────────────────────┐
│  ActiveGameScreen   │
│  ┌───────────────┐  │
│  │ Component     │  │
│  │ Logic         │  │
│  └───────┬───────┘  │
└──────────┼──────────┘
           │
           ▼
   ┌───────────────┐
   │    Actions    │ ◄── Centralized
   │  (lib/       │     Business Logic
   │   actions.ts)│
   └───────┬───────┘
           │
           ▼
      ┌──────────┐
      │ Supabase │
      └────┬─────┘
           │
           ▼
   ┌───────────────┐
   │  Realtime     │
   │  Broadcasts   │
   └───────┬───────┘
           │
           ▼
   ┌───────────────┐
   │  Store        │ ◄── State updated
   │  (Zustand)    │     via subscriptions
   └───────────────┘
```

## Benefits Analysis

### 1. Maintainability

**Before:** To change how player count is fetched, need to update in every component
**After:** Change once in `actions.getPlayerCount()`

### 2. Testability

**Before:**
```typescript
// Hard to test - need to mock Supabase in component tests
const { count } = await supabase.from("players").select(...)
```

**After:**
```typescript
// Easy to mock - just mock the actions module
jest.mock('@/lib/actions');
actions.getPlayerCount = jest.fn().mockResolvedValue(5);
```

### 3. Code Reusability

**Before:** Duplicate query logic across components
**After:** Single implementation used by all components

Example:
- `getLockedGuessesWithScores()` used by both ResultsScreen and future leaderboard

### 4. Error Handling

**Before:** Inconsistent error handling across components
**After:** Centralized error handling with consistent logging

```typescript
// All actions follow same pattern
try {
  const { data, error } = await supabase.from(...);
  if (error) throw new Error(`Failed to X: ${error.message}`);
  console.log('[Actions] ✅ Success');
  return data;
} catch (error) {
  console.error('[Actions] Failed:', error);
  throw error;
}
```

### 5. Type Safety

**Before:** Inline types or implicit typing
**After:** Explicit interfaces exported from actions

```typescript
export interface UpdateDialPositionParams {
  roomId: string;
  roundNumber: number;
  playerId: string;
  dialPosition: number;
  isLocked: boolean;
}

export interface PlayerGuess {
  playerId: string;
  playerName: string;
  dialPosition: number;
  distance: number;
  points: number;
}
```

## Performance Impact

### Query Optimization Opportunities

With centralized actions, we can now:

1. **Add caching** - Cache player counts, game state for short periods
2. **Batch queries** - Combine multiple actions into single transaction
3. **Add retry logic** - Centralized place for network error handling
4. **Monitor performance** - Log query times from one location

Example future optimization:
```typescript
// Add simple caching
const cache = new Map<string, { data: number; timestamp: number }>();

export async function getPlayerCount(roomId: string): Promise<number> {
  const cached = cache.get(roomId);
  if (cached && Date.now() - cached.timestamp < 5000) {
    return cached.data; // Cache for 5 seconds
  }
  
  const count = await /* ... fetch ... */;
  cache.set(roomId, { data: count, timestamp: Date.now() });
  return count;
}
```

## Testing Strategy

### Unit Tests

```typescript
// actions.test.ts
describe('updateDialPosition', () => {
  it('should upsert dial position with correct params', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from = jest.fn().mockReturnValue({ upsert: mockUpsert });

    await actions.updateDialPosition({
      roomId: 'room-123',
      roundNumber: 1,
      playerId: 'player-456',
      dialPosition: 50,
      isLocked: true,
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ dial_position: 50, is_locked: true }),
      expect.any(Object)
    );
  });
});
```

### Integration Tests

```typescript
// ActiveGameScreen.test.tsx
import { actions } from '@/lib/actions';

jest.mock('@/lib/actions');

describe('ActiveGameScreen', () => {
  it('should fetch player count on mount', async () => {
    (actions.getPlayerCount as jest.Mock).mockResolvedValue(5);
    
    render(<ActiveGameScreen />);
    
    await waitFor(() => {
      expect(actions.getPlayerCount).toHaveBeenCalledWith('room-123');
    });
  });
});
```

## Migration Checklist

- [x] Created `lib/actions.ts` with centralized functions
- [x] Implemented `updateDialPosition` action
- [x] Implemented `getPlayerCount` action
- [x] Implemented `getLockedGuessesWithScores` action
- [x] Implemented `fetchGameState` action
- [x] Refactored `ActiveGameScreen.tsx` to use actions
- [x] Refactored `ResultsScreen.tsx` to use actions
- [x] Verified TypeScript compilation
- [ ] Add unit tests for actions
- [ ] Add integration tests for components
- [ ] Document action usage in README

## Future Enhancements

### 1. Add More Actions

Candidate operations to move to actions layer:
- `setHint()` - Psychic sets hint for round
- `setTargetPosition()` - Psychic sets target
- `advanceRound()` - Move to next round (currently in api-client)
- `endGame()` - Finalize game results

### 2. Add Middleware

```typescript
// Add request logging middleware
export function createAction<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args) => {
    const startTime = Date.now();
    console.log(`[Action:${name}] Starting...`);
    
    try {
      const result = await fn(...args);
      console.log(`[Action:${name}] ✅ Completed in ${Date.now() - startTime}ms`);
      return result;
    } catch (error) {
      console.error(`[Action:${name}] ❌ Failed after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  }) as T;
}
```

### 3. Add Optimistic Updates

```typescript
export async function updateDialPosition(params: UpdateDialPositionParams) {
  // Optimistically update store
  const { updateDialInStore } = useGameStore.getState();
  updateDialInStore(params.playerId, params.dialPosition);
  
  try {
    await supabase.from('dial_updates').upsert(...);
  } catch (error) {
    // Revert on error
    updateDialInStore(params.playerId, previousPosition);
    throw error;
  }
}
```

## Audit Report Status

| Recommendation | Status | Notes |
|----------------|--------|-------|
| **P0: Fix RLS Policies** | ✅ Complete | Migration applied |
| **P1: Refactor Realtime** | ✅ Complete | Direct store updates |
| **P1: Centralized Actions** | ✅ Complete | This document |
| **P2: Server-side "all locked"** | ⏳ Next | Backend trigger needed |
| **P2: Generate Supabase types** | ⏳ Pending | Run codegen |
| **P3: Extract UI components** | ⏳ Pending | Refactoring task |

---

**Summary:** Successfully implemented centralized actions layer following Flux architecture principles. Components now dispatch actions instead of making direct database calls, improving maintainability, testability, and code organization. Reduced component complexity by ~80 lines total while making business logic more reusable.
