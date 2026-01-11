# API Audit and Cleanup Analysis

## Date: December 21, 2025

---

## 📋 Summary

This document provides a comprehensive analysis of all APIs in the `/app/api` directory, their usage across the codebase, and recommendations for safe deletion.

---

## 🗂️ Current API Inventory

### Game APIs (Core Wavelength Game)
Located in `/app/api/game/`:

1. **`/api/game/create`** - Create new game room
2. **`/api/game/join`** - Join existing game room
3. **`/api/game/start`** - Start the game
4. **`/api/game/round`** - Handle round actions (create/update/lock/reveal)
5. **`/api/game/players`** - Manage players (GET/POST)
6. **`/api/game/state`** - Get current game state

### WebRTC/P2P APIs (Old Implementation)
Located in `/app/api/`:

7. **`/api/rooms`** - Create and fetch WebRTC rooms
8. **`/api/participants`** - Manage room participants
9. **`/api/signaling`** - WebRTC signaling messages
10. **`/api/messages`** - Chat messages

---

## 📊 API Usage Analysis

### ✅ **Active APIs (Used in Wavelength Game)**

#### 1. `/api/game/create` (POST)
- **Purpose**: Create new game room with settings
- **Used in**:
  - `lib/api-client.ts` - `createGame()` function
  - `components/screens/CreateRoomForm.tsx` - When host creates a game
- **Status**: ✅ **KEEP** - Core game functionality

#### 2. `/api/game/join` (POST)
- **Purpose**: Join existing game with room code
- **Used in**:
  - `lib/api-client.ts` - `joinGame()` function
  - `components/screens/JoinRoomForm.tsx` - When player joins a game
- **Status**: ✅ **KEEP** - Core game functionality

#### 3. `/api/game/start` (POST)
- **Purpose**: Start the game and create first round
- **Used in**:
  - `lib/api-client.ts` - `startGame()` function
  - `components/screens/GameWaitingRoom.tsx` - Host starts the game
- **Status**: ✅ **KEEP** - Core game functionality

#### 4. `/api/game/players` (GET/POST)
- **Purpose**: Get players in room, assign psychic
- **Used in**:
  - `lib/api-client.ts` - `getPlayers()`, `handlePlayerAction()`, `assignRandomPsychic()`
  - `components/screens/GameWaitingRoom.tsx` - Fetch and display players
- **Status**: ✅ **KEEP** - Core game functionality

#### 5. `/api/game/state` (GET)
- **Purpose**: Get current game state (round, score, lives)
- **Used in**:
  - `lib/api-client.ts` - `getGameState()` function
  - `components/screens/GameWaitingRoom.tsx` - Non-host players check game status
- **Status**: ✅ **KEEP** - Core game functionality

#### 6. `/api/game/round` (POST)
- **Purpose**: Handle round actions (lock positions, reveal, advance)
- **Used in**:
  - `lib/api-client.ts` - `handleRoundAction()`, `lockDialPosition()`
- **Status**: ✅ **KEEP** - Core game functionality

---

### ❌ **Deprecated APIs (Can Be Deleted)**

#### 7. `/api/rooms` (GET/POST/PATCH/DELETE)
- **Purpose**: Create/manage WebRTC rooms (old P2P implementation)
- **Used in**:
  - `lib/webrtc.ts` - Old WebRTC implementation
  - `app/hellowebrtc/page.tsx` - Test page only
- **Used by**:
  - ❌ **NOT used in main game**
  - ❌ Only used in test/example page (`hellowebrtc`)
- **Status**: ❌ **DELETE** - Old P2P implementation, replaced by Supabase Realtime

#### 8. `/api/participants` (GET/POST/DELETE)
- **Purpose**: Manage room participants (old P2P implementation)
- **Used in**:
  - `lib/webrtc.ts` - Old WebRTC implementation
  - `app/hellowebrtc/page.tsx` - Test page only
- **Used by**:
  - ❌ **NOT used in main game**
  - ❌ Only used in test/example page (`hellowebrtc`)
- **Status**: ❌ **DELETE** - Old P2P implementation

#### 9. `/api/signaling` (POST/PATCH/GET)
- **Purpose**: WebRTC signaling messages (old P2P implementation)
- **Used in**:
  - `lib/webrtc.ts` - Old WebRTC implementation
  - `app/hellowebrtc/page.tsx` - Test page only
- **Used by**:
  - ❌ **NOT used in main game**
  - ❌ Only used in test/example page (`hellowebrtc`)
- **Status**: ❌ **DELETE** - Old P2P implementation

#### 10. `/api/messages` (GET/POST)
- **Purpose**: Store/retrieve chat messages
- **Used in**:
  - `app/hellosupa/page.tsx` - Test page only
- **Used by**:
  - ❌ **NOT used in main game**
  - ❌ Only used in test page (`hellosupa`)
- **Status**: ❌ **DELETE** - Test page only, not part of game

---

## 🧹 Files/Folders Safe to Delete

### API Routes to Delete:
```
app/api/rooms/route.ts              (WebRTC - old P2P)
app/api/participants/route.ts       (WebRTC - old P2P)
app/api/signaling/route.ts          (WebRTC - old P2P)
app/api/messages/route.ts           (Test page only)
```

### Supporting Files to Delete (Optional):
```
lib/webrtc.ts                       (Old WebRTC implementation)
lib/wavelength-p2p.ts               (Old P2P wrapper)
lib/hooks/useWavelengthP2P.ts       (Old P2P hook)
app/hellowebrtc/page.tsx            (Test page)
app/hellosupa/page.tsx              (Test page)
components/examples/GameIntegrationExample.tsx  (Example/reference only)
```

---

## 📦 API Dependencies

### Current Game Uses:
- **Supabase Tables**: 
  - `game_rooms`, `players`, `game_state`, `rounds`, `dial_updates`
- **Supabase Realtime**: 
  - Game room status updates
  - Player dial position updates
  - Live player list updates
- **Game APIs** (6 endpoints in `/api/game/`)

### Old Implementation Used (Can Remove):
- **Supabase Tables**: 
  - `rooms`, `participants`, `signaling`, `messages`
- **WebRTC P2P**: 
  - SimplePeer library (can keep, may be useful later)
  - Custom WebRTC manager
  - Custom signaling

---

## 🎯 Recommendation Summary

### ✅ Keep (Core Game - 6 APIs)
```
✓ /api/game/create
✓ /api/game/join
✓ /api/game/start
✓ /api/game/players
✓ /api/game/state
✓ /api/game/round
```

### ❌ Delete (Old/Test - 4 APIs)
```
✗ /api/rooms           (WebRTC - old P2P)
✗ /api/participants    (WebRTC - old P2P)
✗ /api/signaling       (WebRTC - old P2P)
✗ /api/messages        (Test page only)
```

### 🗂️ Additional Files to Delete
```
✗ lib/webrtc.ts
✗ lib/wavelength-p2p.ts
✗ lib/hooks/useWavelengthP2P.ts
✗ app/hellowebrtc/page.tsx
✗ app/hellosupa/page.tsx
✗ components/examples/GameIntegrationExample.tsx
```

---

## ⚠️ Migration Notes

The current Wavelength game uses:
- ✅ Supabase Realtime for real-time updates
- ✅ REST APIs for game actions
- ✅ Zustand for state management
- ✅ Database polling as fallback

The old implementation used:
- ❌ WebRTC P2P connections
- ❌ Custom signaling server
- ❌ Different database schema

**All game screens now use the new implementation. The old P2P code is not referenced anywhere in the active game flow.**

---

## 🎬 Cleanup Status

1. ✅ Review completed
2. ✅ **APPROVED** for deletion
3. ✅ **COMPLETED** - All deprecated files deleted:
   - ✅ Deleted 4 API routes (rooms, participants, signaling, messages)
   - ✅ Deleted 2 test pages (hellowebrtc, hellosupa)
   - ✅ Deleted 3 old P2P implementation files
   - ✅ Deleted 1 example component folder
   
**Total: 10 files/folders removed**

### Remaining (Clean Architecture):
- ✅ 6 game APIs in `/app/api/game/`
- ✅ 1 main game page (`app/page.tsx`)
- ✅ 7 game screens in `/components/screens/`
- ✅ Core libraries: `api-client.ts`, `supabase.ts`, `store.ts`

---

## 📝 Notes

- All current game screens (`WelcomeScreen`, `MainMenuScreen`, `CreateRoomForm`, `JoinRoomForm`, `GameWaitingRoom`, `ActiveGameScreen`, `ResultsScreen`) use only the `/api/game/*` endpoints
- The `hellowebrtc` and `hellosupa` pages were test/demo pages
- The `GameIntegrationExample` component is documentation/reference only
- The old P2P implementation is completely replaced by Supabase Realtime
