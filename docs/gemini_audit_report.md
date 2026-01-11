# Wavelength Codebase Audit Report

**Date:** January 9, 2026
**Auditor:** Gemini CLI Agent

## 1. Executive Summary

The codebase implements a functional real-time game using Next.js and Supabase. While the core mechanics are in place, the application is **not production-ready** due to critical security vulnerabilities, architectural inconsistencies, and scalability issues. The most urgent concern is the complete disablement of Row Level Security (RLS), allowing any user to modify or delete data.

## 2. Critical Security Vulnerabilities

### 🚨 RLS Policies Set to "Allow All"
**File:** `supabase/migrations/20241222000005_fix_rls_policies_for_realtime.sql`

**Finding:** The migration explicitly drops restrictive policies and replaces them with blanket `USING (true)` policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on all core tables (`game_rooms`, `players`, `game_state`, `rounds`, `dial_updates`).

**Impact:** 
- **High Severity:** Any user (authenticated or anonymous) can delete all game rooms, manipulate scores, or impersonate other players by sending requests directly to the Supabase API.
- **Recommendation:** Implement strict RLS policies.
    - `game_rooms`: Read allowed for everyone; Insert allowed; Update/Delete only by host/creator.
    - `players`: Read allowed for room participants; Update only self.
    - `dial_updates`: Insert/Update only by the specific `player_id`.

## 3. Architecture & Flux Compliance

### ❌ Direct State Mutation in Components
**File:** `components/screens/ActiveGameScreen.tsx`

**Finding:** The component executes direct database mutations, bypassing the central store:
```typescript
// ActiveGameScreen.tsx
const updateDialPosition = async (position: number, locked: boolean) => {
  await supabase.from("dial_updates").upsert(...) // <--- VIOLATION
};
```

**Impact:** 
- Breaks the unidirectional data flow (Flux).
- Makes state changes hard to track and debug.
- Logic is tightly coupled to the UI component.

**Recommendation:** Move `updateDialPosition` to `lib/store.ts` as an action (e.g., `submitDialGuess`). The component should only dispatch this action.

## 4. Performance & Scalability

### ⚠️ Inefficient Realtime Strategy
**File:** `lib/hooks/useRealtimeSubscriptions.ts`

**Finding:** The application uses a "brute-force" synchronization strategy. When a realtime event is received (e.g., a player joins), the client re-fetches the entire game state.
```typescript
// useGameStateUpdates
const { loadGameState } = useGameStore.getState();
await loadGameState(); // <--- Fetches everything again
```

**Impact:**
- **N+1 Problem:** If 10 players are in a room and one updates a value, 10 clients immediately fire complex join/select queries to the database.
- **Latency:** Increases perceived lag as the UI waits for a full reload instead of applying the atomic change locally.

**Recommendation:** 
- Update the store optimistically or process the realtime payload directly (`payload.new`) to update the specific slice of state in Zustand, rather than refetching.

### ⚠️ Client-Side "Split Brain" Logic
**File:** `components/screens/ActiveGameScreen.tsx`

**Finding:** Critical game logic, such as determining if "All Players Locked In," is calculated independently on every client using `useEffect`.
```typescript
const allLocked = lockedCount === nonPsychicPlayerCount;
```
**Impact:** If one client misses a realtime packet (network blip), their local state will diverge, and the game might hang for them while proceeding for others.
**Recommendation:** Move authority to the database. The `rounds` table should have a `status` or `locked_count` that is updated via a Database Trigger or Edge Function. Clients should react to this source of truth.

## 5. Code Quality & Maintenance

### 📦 Inline UI Components
**File:** `components/screens/ActiveGameScreen.tsx`

**Finding:** Significant UI components (`GameHUD`, `PlayerStatusBar`, `DialPositionIndicator`) are defined inside the screen file.
**Recommendation:** Extract these to `components/ui/` to improve readability and enable reuse.

### 📝 Manual Type Definitions
**File:** `lib/supabase.ts`

**Finding:** TypeScript interfaces (`Player`, `GameRoom`) are manually defined and risk drifting from the actual database schema.
**Recommendation:** Use Supabase CLI to generate types automatically (`supabase gen types typescript`) to ensure 100% type safety.

## 6. Action Plan

1.  **SECURITY (P0):** Rewrite RLS policies in `supabase/migrations/` to restrict access based on `room_id` and `player_id`.
2.  **ARCHITECTURE (P1):** Move `updateDialPosition` and `handleLockIn` logic from `ActiveGameScreen` to `useGameStore`.
3.  **REFACTOR (P2):** Extract `GameHUD` and `PlayerStatusBar` into separate files.
4.  **PERFORMANCE (P2):** Refactor `useRealtimeSubscriptions` to update the local store directly from the payload instead of calling `loadGameState`.
5.  **CLEANUP (P3):** Remove `console.log` spam and manual type definitions.
