# handleNextRound Consolidation & Routing Fix

## Summary
This document describes the centralization of duplicate `handleNextRound` implementations and the routing fix to ensure all players (including the psychic) land on the same results page when all players lock in their guesses.

## Problems Addressed

### 1. Duplicate handleNextRound Implementations
**Problem**: Two separate implementations of `handleNextRound` existed:
- **ActiveGameScreen** (lines 508-545): Updated local state, no navigation
- **ResultsScreen** (lines 33-63): Handled game-over logic, navigated to lobby or play page

**Impact**: Code duplication, inconsistent logic, harder to maintain

### 2. Routing Split Issue
**Problem**: When all players locked in their guesses:
- **Psychic**: Stayed on `/play` page with inline results display
- **Non-psychic players**: Navigated to `/results` page

**Impact**: Players were on different pages, breaking the collaborative experience

## Solution

### 1. Centralized Round Advancement in Store

Created a single source of truth for advancing rounds in `lib/store.ts`:

```typescript
// Added to GameStore interface
interface GameStore {
  // ... existing properties
  advanceToNextRound: (router: any) => Promise<void>;
}

// Implementation
advanceToNextRound: async (router) => {
  const state = get();
  const gameData = state.gameData;
  const roundData = state.roundData;
  
  if (!gameData || !roundData) {
    console.error('[Store] Cannot advance round: missing game data');
    return;
  }
  
  const roomCode = gameData.roomCode || state.roomCode;
  const currentRound = roundData.gameState.current_round;
  const maxRounds = gameData.gameSettings.numberOfRounds;
  
  try {
    console.log('[Store] Advancing to next round...');
    
    // Check if game is finished
    if (currentRound >= maxRounds) {
      console.log('[Store] Game complete - redirecting to lobby');
      if (roomCode) {
        router.push(`/room/${roomCode}`);
      }
      return;
    }
    
    // Call API to advance round (will rotate psychic and create new round)
    const result = await api.advanceRound(gameData.roomId);
    console.log('[Store] Round advanced successfully:', result);
    
    // Navigate back to play screen for next round
    if (roomCode) {
      router.push(`/room/${roomCode}/play`);
    }
  } catch (err) {
    console.error('[Store] Failed to advance round:', err);
    throw err;
  }
}
```

**Benefits**:
- Single implementation handles game-over logic
- Consistent navigation across all components
- Easier to test and maintain

### 2. Updated ActiveGameScreen

**Before** (lines 356-367):
```typescript
if (isPsychic) {
  console.log("[ActiveGame] Showing results to psychic");
  setShowPsychicResults(true);  // STAYS ON /play
} else {
  const roomCodeToUse = gameData?.roomCode || storeRoomCode;
  setTimeout(() => {
    console.log("[ActiveGame] Transitioning to results screen");
    if (roomCodeToUse) {
      router.push(`/room/${roomCodeToUse}/results`);  // NAVIGATES AWAY
    }
  }, 2000);
}
```

**After** (lines 354-362):
```typescript
// Navigate ALL players (including psychic) to results screen
const roomCodeToUse = gameData?.roomCode || storeRoomCode;
setTimeout(() => {
  console.log("[ActiveGame] Transitioning to results screen");
  if (roomCodeToUse) {
    router.push(`/room/${roomCodeToUse}/results`);
  }
}, 2000);
```

**Changes**:
- Removed `setShowPsychicResults` state and inline results UI
- All players now navigate to `/results` page when all lock in
- Removed psychic-specific `handleNextRound` function (no longer needed)

### 3. Updated ResultsScreen

**Before**:
```typescript
const handleNextRound = async () => {
  if (!gameData) return;
  
  const roomCodeToUse = gameData?.roomCode || storeRoomCode;
  
  try {
    setAdvancingRound(true);
    console.log('[ResultsScreen] Advancing to next round...');
    
    // Check if game is finished
    if (round >= maxRounds) {
      console.log('[ResultsScreen] Game complete - redirecting to lobby');
      if (roomCodeToUse) {
        router.push(`/room/${roomCodeToUse}`);
      }
      return;
    }
    
    // Call API to advance round
    const result = await api.advanceRound(gameData.roomId);
    console.log('[ResultsScreen] Round advanced:', result);
    
    // Navigate back to play screen for next round
    if (roomCodeToUse) {
      router.push(`/room/${roomCodeToUse}/play`);
    }
  } catch (err) {
    console.error('[ResultsScreen] Failed to advance round:', err);
    setAdvancingRound(false);
  }
};
```

**After**:
```typescript
const handleNextRound = async () => {
  try {
    setAdvancingRound(true);
    const { advanceToNextRound } = useGameStore.getState();
    await advanceToNextRound(router);
  } catch (err) {
    console.error('[ResultsScreen] Failed to advance round:', err);
    setAdvancingRound(false);
  }
};
```

**Changes**:
- Uses centralized store method instead of duplicate implementation
- All game-over logic now handled in one place

## Code Removed

### ActiveGameScreen
- `showPsychicResults` state variable
- Psychic inline results UI (PlayerScoresTable variant="psychic" with Next Round button)
- Psychic-specific `handleNextRound` function
- Unused imports: `supabase`, `PlayerScoresTable`

## Files Modified

1. **lib/store.ts**
   - Added `advanceToNextRound` method to GameStore interface
   - Implemented centralized round advancement logic
   - Added `setRoundData`, `updateGameState`, `updateCurrentRound` methods to implementation

2. **components/screens/ActiveGameScreen.tsx**
   - Removed routing split (psychic vs non-psychic)
   - Removed `showPsychicResults` state
   - Removed psychic inline results UI
   - Removed unused `handleNextRound` function
   - All players navigate to `/results` page

3. **components/screens/ResultsScreen.tsx**
   - Updated `handleNextRound` to use centralized store method
   - Removed duplicate game-over logic
   - Removed unused imports: `supabase`, `api`

4. **app/api/game/state/route.ts**
   - Fixed type error where `current_round` could be null

## Additional Fixes

While consolidating, fixed several pre-existing TypeScript errors:
- `GameWaitingRoom.tsx`: Fixed `CornerAccents` and `StatusIndicator` props
- `JoinRoomForm.tsx`: Fixed `CornerAccents`, `ErrorMessage`, `Button`, and `StatusIndicator` props

## Benefits

### 1. Code Quality
- ✅ Eliminated code duplication
- ✅ Single source of truth for round advancement
- ✅ Easier to maintain and test
- ✅ Consistent behavior across all screens

### 2. User Experience
- ✅ All players now on same page (results) when round ends
- ✅ Consistent navigation flow for all player roles
- ✅ No more split screen experience between psychic and non-psychic

### 3. Development
- ✅ Build succeeds with zero TypeScript errors
- ✅ Cleaner component structure
- ✅ Better separation of concerns

## Testing Checklist

- [ ] All players land on `/results` page when all lock in guesses
- [ ] Psychic no longer sees inline results on `/play` page
- [ ] "Next Round" button works from `/results` page for all players
- [ ] Game-over navigation to lobby works correctly
- [ ] Round advancement updates state correctly
- [ ] No TypeScript compilation errors

## Implementation Date
December 2024

## Related Documents
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [UI_CONSOLIDATION.md](./UI_CONSOLIDATION.md) - UI component consolidation
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance optimizations
