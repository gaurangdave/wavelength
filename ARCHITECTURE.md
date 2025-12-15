# Wavelength Backend Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         WAVELENGTH GAME                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐              ┌──────────────────────┐
│   Player 1 Browser   │              │   Player 2 Browser   │
│                      │              │                      │
│  ┌────────────────┐  │              │  ┌────────────────┐  │
│  │  React UI      │  │              │  │  React UI      │  │
│  │  Components    │  │              │  │  Components    │  │
│  └────────┬───────┘  │              │  └────────┬───────┘  │
│           │          │              │           │          │
│  ┌────────▼───────┐  │              │  ┌────────▼───────┐  │
│  │ useWavelengthP2P│ │◄─────P2P────►│  │ useWavelengthP2P│ │
│  │   React Hook    │  │   WebRTC    │  │   React Hook    │  │
│  └────────┬───────┘  │   Direct    │  └────────┬───────┘  │
│           │          │  Connection  │           │          │
│  ┌────────▼───────┐  │              │  ┌────────▼───────┐  │
│  │  API Client    │  │              │  │  API Client    │  │
│  └────────┬───────┘  │              │  └────────┬───────┘  │
└───────────┼──────────┘              └───────────┼──────────┘
            │                                     │
            │         HTTP/REST API               │
            └──────────────┬──────────────────────┘
                           │
            ┌──────────────▼──────────────┐
            │    Next.js API Routes       │
            │  /api/game/create           │
            │  /api/game/join             │
            │  /api/game/start            │
            │  /api/game/round            │
            │  /api/game/players          │
            │  /api/game/state            │
            └──────────────┬──────────────┘
                           │
            ┌──────────────▼──────────────┐
            │   Supabase Client Library   │
            │   (lib/supabase.ts)         │
            └──────────────┬──────────────┘
                           │
            ┌──────────────▼──────────────┐
            │   Supabase PostgreSQL DB    │
            │   (localhost:54321)         │
            │                             │
            │  ┌─────────────────────┐   │
            │  │  Tables:            │   │
            │  │  • game_rooms       │   │
            │  │  • players          │   │
            │  │  • game_state       │   │
            │  │  • rounds           │   │
            │  │  • dial_updates     │   │
            │  │  • signaling        │   │
            │  └─────────────────────┘   │
            └─────────────────────────────┘
```

## Data Flow Diagrams

### Creating a Game Flow

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│ Player  │────►│ API      │────►│Supabase │────►│ Database │
│ Browser │     │ /create  │     │ Client  │     │          │
└─────────┘     └──────────┘     └─────────┘     └──────────┘
     │                                                   │
     │          Room + Player                            │
     │◄──────────────────────────────────────────────────┘
     │          Records Created
     │
     │          ┌───────────┐
     └─────────►│ P2P       │
                │ Manager   │
                │ Join Room │
                └───────────┘
```

### Joining a Game Flow

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
│ Player  │────►│ API      │────►│Supabase │────►│ Database │
│ Browser │     │ /join    │     │ Client  │     │  Verify  │
└─────────┘     └──────────┘     └─────────┘     │RoomExists│
     │                                            └──────────┘
     │          Player Record                           │
     │◄─────────────────────────────────────────────────┘
     │          Created
     │
     │          ┌───────────┐
     └─────────►│ P2P       │
                │ Manager   │
                │ Connect   │
                │ to Peers  │
                └───────────┘
```

### Real-time Dial Sync

```
Player 1                     Player 2
   │                            │
   │  Move Dial                 │
   ├───┐                        │
   │   │ Update Local UI        │
   │◄──┘                        │
   │                            │
   │  sendDialUpdate()          │
   ├──────────P2P──────────────►│
   │      WebRTC Direct         │
   │                            ├───┐
   │                            │   │ onDialUpdate()
   │                            │   │ Update UI
   │                            │◄──┘
   │                            │
```

### Game Start Flow (with Round Creation)

```
┌──────┐      ┌─────────┐      ┌──────────┐      ┌───────────┐
│ Host │─────►│ API     │─────►│ Supabase │─────►│  Database │
│      │ POST │ /start  │      │          │      │           │
└──────┘      └─────────┘      └──────────┘      │ • Create  │
    │                                             │   game_   │
    │         Game State + Round                  │   state   │
    │◄────────────────────────────────────────────│ • Create  │
    │                                             │   round   │
    │                                             │ • Assign  │
    │                                             │   psychic │
    │                                             └───────────┘
    │
    │         sendGameStateSync()
    ├────────────────P2P─────────────────────────►All Players
    │
```

## WebRTC P2P Architecture

### Signaling Flow

```
Player A                 Supabase                Player B
   │                    Signaling                   │
   │                      Table                     │
   │                        │                       │
   │  1. Create Offer       │                       │
   ├───────────────────────►│                       │
   │  INSERT signaling      │                       │
   │  (type: 'offer')       │                       │
   │                        │  2. Subscribe         │
   │                        │  Realtime Channel     │
   │                        │◄──────────────────────┤
   │                        │  3. Receive Offer     │
   │                        ├──────────────────────►│
   │                        │                       │
   │                        │  4. Create Answer     │
   │                        │◄──────────────────────┤
   │  5. Receive Answer     │  INSERT signaling     │
   │◄───────────────────────┤  (type: 'answer')     │
   │                        │                       │
   │  6. Exchange ICE Candidates                    │
   │◄──────────────────────►│◄─────────────────────►│
   │                        │                       │
   │  7. Direct P2P Connection Established          │
   │◄═══════════════════════════════════════════════►│
   │         WebRTC Data Channel                    │
   │         (No server in middle!)                 │
```

### P2P Connection States

```
┌────────────┐
│ NEW        │  Initial state
└─────┬──────┘
      │ Create Peer Connection
      ▼
┌────────────┐
│ CONNECTING │  Exchanging ICE candidates
└─────┬──────┘
      │ ICE negotiation complete
      ▼
┌────────────┐
│ CONNECTED  │  ✅ Data channel open
└─────┬──────┘    Messages flowing
      │
      │ Network issue / user leaves
      ▼
┌────────────┐
│ CLOSED     │  Connection terminated
└────────────┘
```

## Database Schema Visual

```
┌─────────────────────────────────────────────────────────────┐
│                         game_rooms                          │
├──────────────┬──────────────┬───────────────────────────────┤
│ id (PK)      │ room_code    │ room_name                     │
│ host_player  │ status       │ settings (JSONB)              │
└──────────────┴──────────────┴───────────────────────────────┘
                      │ 1
                      │
                      │ N
┌─────────────────────────────────────────────────────────────┐
│                          players                            │
├──────────────┬──────────────┬───────────────────────────────┤
│ id (PK)      │ room_id (FK) │ player_name                   │
│ peer_id      │ is_host      │ is_psychic                    │
│ is_connected │              │                               │
└──────────────┴──────────────┴───────────────────────────────┘
                      │ 1
                      │
                      │ 1
┌─────────────────────────────────────────────────────────────┐
│                       game_state                            │
├──────────────┬──────────────┬───────────────────────────────┤
│ id (PK)      │ room_id (FK) │ current_round                 │
│ team_score   │ lives_remain │ current_psychic_id (FK)       │
└──────────────┴──────────────┴───────────────────────────────┘
                      │ 1
                      │
                      │ N
┌─────────────────────────────────────────────────────────────┐
│                          rounds                             │
├──────────────┬──────────────┬───────────────────────────────┤
│ id (PK)      │ room_id (FK) │ round_number                  │
│ left_concept │ right_concept│ psychic_hint                  │
│ target_pos   │ locked_pos   │ revealed                      │
└──────────────┴──────────────┴───────────────────────────────┘
```

## Message Flow Examples

### Dial Movement (P2P)

```
Time  Player 1                     Player 2
  │
  │   User drags dial
  │   position = 65%
  ├───┐
  │   │ Update local state
  │◄──┘ setDialPosition(65)
  │
  │   Send P2P message
  │   {
  │     type: 'dial-update',
  │     payload: {
  │       playerId: 'p1',
  │       playerName: 'Alice',
  │       position: 65,
  │       isLocked: false
  │     }
  │   }
  ├──────────────────────────────►│
  │                                │
  │                                ├───┐
  │                                │   │ onDialUpdate()
  │                                │   │ Update UI
  │                                │◄──┘
  │                                │   Show Alice's
  │                                │   dial at 65%
  ▼                                ▼
```

### Lock Guess (DB + P2P)

```
Time  Player 1                     Database                  Player 2
  │
  │   User clicks LOCK
  ├───┐
  │   │ setIsLocked(true)
  │◄──┘
  │
  │   Save to DB
  │   POST /api/game/round
  ├──────────────────────────────►│
  │   {action: 'lock-position'}   │
  │                                ├───┐
  │                                │   │ INSERT into rounds
  │   Success                      │◄──┘ locked_positions
  │◄───────────────────────────────┤
  │                                │
  │   Broadcast P2P
  │   {
  │     type: 'dial-update',
  │     payload: {
  │       playerId: 'p1',
  │       position: 65,
  │       isLocked: true ◄────────────── Important!
  │     }
  │   }
  ├──────────────────────────────────────────────────────────►│
  │                                │                           │
  │                                │                           ├───┐
  │                                │                           │   │ Update UI
  │                                │                           │◄──┘ Show locked
  ▼                                ▼                           ▼     icon
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                       │
│                 React Components                         │
│  • WelcomeScreen  • MainMenuScreen  • ActiveGameScreen  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              APPLICATION LAYER                          │
│               React Hooks & State                       │
│  • useWavelengthP2P  • useState  • useEffect           │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼─────┐   ┌──────▼──────┐  ┌─────▼──────┐
│  P2P Layer  │   │  API Layer  │  │   Types    │
│  WebRTC     │   │  REST APIs  │  │ TypeScript │
│  lib/       │   │  /api/game/ │  │  Interfaces│
│  wavelength │   │             │  │            │
│  -p2p.ts    │   │             │  │            │
└───────┬─────┘   └──────┬──────┘  └────────────┘
        │                │
        │         ┌──────▼──────┐
        │         │ Supabase    │
        │         │ Client      │
        │         │ lib/        │
        │         │ supabase.ts │
        │         └──────┬──────┘
        │                │
┌───────▼────────────────▼─────────────────┐
│          PERSISTENCE LAYER                │
│       Supabase PostgreSQL Database        │
│  Tables: game_rooms, players, rounds, etc │
└───────────────────────────────────────────┘
```

## Deployment Architecture (Future)

```
┌────────────────────────────────────────────────────────┐
│                    Production Setup                     │
└────────────────────────────────────────────────────────┘

┌──────────────┐                      ┌──────────────┐
│   Vercel     │                      │   Vercel     │
│   Next.js    │───────P2P───────────►│   Next.js    │
│   Player 1   │   WebRTC Direct      │   Player 2   │
└──────┬───────┘                      └──────┬───────┘
       │                                     │
       │          REST API Calls             │
       └─────────────┬───────────────────────┘
                     │
              ┌──────▼──────┐
              │  Vercel     │
              │  Edge Funcs │
              │  /api/*     │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  Supabase   │
              │  Cloud      │
              │  PostgreSQL │
              └─────────────┘

Optional TURN Server for NAT traversal:
┌─────────────┐
│   Twilio    │  For users behind
│   TURN      │  restrictive firewalls
└─────────────┘
```

---

This architecture provides:
- ✅ Low latency P2P communication
- ✅ Persistent storage in PostgreSQL
- ✅ Type-safe TypeScript throughout
- ✅ Scalable REST API design
- ✅ Real-time synchronization
- ✅ Offline-first capabilities
