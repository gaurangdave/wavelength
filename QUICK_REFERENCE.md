# Wavelength Backend - Quick Reference

## 🚀 Quick Start (3 Commands)

```bash
# 1. Setup backend
./setup.sh

# 2. Start dev server
npm run dev

# 3. Open game
open http://localhost:3000/wavelength
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Database types & helper functions |
| `lib/wavelength-p2p.ts` | WebRTC P2P manager |
| `lib/hooks/useWavelengthP2P.ts` | React hook for P2P |
| `lib/api-client.ts` | API wrapper functions |
| `supabase/migrations/*.sql` | Database schema |

## 🔌 API Endpoints

```typescript
// Create game
POST /api/game/create
Body: { roomName, roomCode, playerName, peerId, settings }

// Join game
POST /api/game/join
Body: { roomCode, playerName, peerId }

// Start game
POST /api/game/start
Body: { roomId, psychicPlayerId, numberOfLives }

// Round actions
POST /api/game/round
Body: { action: 'create' | 'update-hint' | 'lock-position' | 'reveal' | 'advance', ... }

// Players
GET /api/game/players?roomId=xxx
POST /api/game/players
Body: { action: 'assign-psychic' | 'update-connection', ... }

// Game state
GET /api/game/state?roomId=xxx
```

## 💻 Code Snippets

### Initialize P2P
```typescript
import { useWavelengthP2P } from '@/lib/hooks/useWavelengthP2P';
import { generatePeerId } from '@/lib/api-client';

const [peerId] = useState(generatePeerId());
const p2p = useWavelengthP2P({
  peerId,
  onDialUpdate: (id, name, pos, locked) => { /* ... */ },
  onGameStateSync: (round, score, lives, psychicId) => { /* ... */ }
});
```

### Create Game
```typescript
import { createGame, generateRoomCode } from '@/lib/api-client';

const result = await createGame({
  roomName: 'My Game',
  roomCode: generateRoomCode(),
  playerName: 'Alice',
  peerId,
  settings: { numberOfLives: 3, numberOfRounds: 5, maxPoints: 4 }
});

await p2p.joinRoom(result.room.id);
```

### Join Game
```typescript
import { joinGame } from '@/lib/api-client';

const result = await joinGame({
  roomCode: 'ABC123',
  playerName: 'Bob',
  peerId
});

await p2p.joinRoom(result.room.id);
```

### Send Dial Update
```typescript
p2p.sendDialUpdate(playerId, playerName, position, isLocked);
```

### Lock Guess
```typescript
import { handleRoundAction } from '@/lib/api-client';

await handleRoundAction({
  action: 'lock-position',
  roundId: currentRound.id,
  playerId: player.id,
  playerName: player.player_name,
  position: dialPosition
});
```

## 🗄️ Database Tables

```
game_rooms
├── id, room_code, room_name
├── host_player_id, status
└── settings (JSONB)

players
├── id, room_id, player_name
├── peer_id (for WebRTC)
├── is_host, is_psychic
└── is_connected

game_state
├── id, room_id
├── current_round, team_score
└── lives_remaining, current_psychic_id

rounds
├── id, room_id, round_number
├── left_concept, right_concept
├── psychic_hint, target_position
├── locked_positions (JSONB array)
└── revealed, points_earned

dial_updates (backup storage)
└── room_id, round_number, player_id, dial_position

signaling (WebRTC)
└── room_id, from_peer_id, to_peer_id, type, payload
```

## 🌐 P2P Messages

```typescript
// Dial update
{ type: 'dial-update', payload: { playerId, playerName, position, isLocked } }

// Game state sync
{ type: 'game-state-sync', payload: { round, score, lives, psychicId } }

// Reveal target
{ type: 'reveal', payload: { targetPosition, points } }
```

## 🛠️ Useful Commands

```bash
# Check Supabase status
supabase status

# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Reset database (reapply migrations)
supabase db reset

# View Supabase Studio
open http://localhost:54323

# Check migration history
supabase migration list
```

## 🔗 URLs

| Service | URL |
|---------|-----|
| **Game** | http://localhost:3000/wavelength |
| **Supabase API** | http://localhost:54321 |
| **Supabase Studio** | http://localhost:54323 |

## 📚 Documentation

- `BACKEND_README.md` - Full backend docs
- `INTEGRATION_GUIDE.md` - How to integrate
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `components/examples/GameIntegrationExample.tsx` - Working example

## ⚡ Common Tasks

### Test Locally (Single Player)
1. Create game → Check Supabase Studio → See data

### Test Multiplayer
1. Tab 1: Create game, copy room code
2. Tab 2: Join with room code
3. Move dial → See sync in other tab

### Debug Connection Issues
1. Check browser console for errors
2. Open Supabase Studio → signaling table
3. Verify P2P messages being sent

### Add New API Endpoint
1. Create `app/api/game/[name]/route.ts`
2. Add handler function in `lib/supabase.ts`
3. Add wrapper in `lib/api-client.ts`

## 🎯 Integration Checklist

- [ ] Generate peer ID on mount: `generatePeerId()`
- [ ] Initialize P2P hook with callbacks
- [ ] Call `createGame()` or `joinGame()` 
- [ ] Call `p2p.joinRoom(roomId)` after API call
- [ ] Send dial updates via `p2p.sendDialUpdate()`
- [ ] Save important actions to database via API
- [ ] Handle P2P callbacks to update UI
- [ ] Clean up with `p2p.leaveRoom()` on unmount

## 💡 Pro Tips

1. **Use both DB and P2P**: DB for persistence, P2P for real-time
2. **Poll database**: Backup for P2P failures (every 3-5 seconds)
3. **Unique peer IDs**: One per page load, not per player
4. **Error handling**: Always wrap API calls in try-catch
5. **Loading states**: Show feedback during async operations
6. **Connection status**: Display peer count in UI
7. **Reconnection**: Have players rejoin on disconnect

## 🐛 Quick Fixes

**Supabase won't start?**
```bash
supabase stop && supabase start
```

**Migrations not applied?**
```bash
supabase db reset
```

**P2P not connecting?**
- Both players in same room? Check database
- Check browser console for WebRTC errors
- Verify signaling table has messages

**TypeScript errors?**
```bash
npm install
```

---

**Need help?** Check the full documentation in `BACKEND_README.md` and `INTEGRATION_GUIDE.md`
