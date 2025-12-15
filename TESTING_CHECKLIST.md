# Wavelength Backend Testing Checklist

## ✅ Setup Verification

### Initial Setup
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Run `./setup.sh` successfully
- [ ] Supabase running (`supabase status`)
- [ ] All migrations applied
- [ ] Supabase Studio accessible at `http://localhost:54323`
- [ ] Dev server running (`npm run dev`)

### Database Verification
Visit Supabase Studio (`http://localhost:54323`) and verify:
- [ ] `game_rooms` table exists
- [ ] `players` table exists
- [ ] `game_state` table exists
- [ ] `rounds` table exists
- [ ] `dial_updates` table exists
- [ ] `signaling` table exists

## 🧪 API Endpoint Testing

### Create Game API
```bash
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "Test Room",
    "roomCode": "TEST01",
    "playerName": "Alice",
    "peerId": "peer-test-1",
    "settings": {
      "numberOfLives": 3,
      "numberOfRounds": 5,
      "maxPoints": 4
    }
  }'
```

Expected Response:
```json
{
  "success": true,
  "room": { "id": "...", "room_code": "TEST01", ... },
  "player": { "id": "...", "player_name": "Alice", ... }
}
```

- [ ] API returns success
- [ ] Room created in database
- [ ] Player added to database
- [ ] Room code is unique

### Join Game API
```bash
curl -X POST http://localhost:3000/api/game/join \
  -H "Content-Type: application/json" \
  -d '{
    "roomCode": "TEST01",
    "playerName": "Bob",
    "peerId": "peer-test-2"
  }'
```

Expected Response:
```json
{
  "success": true,
  "room": { ... },
  "player": { "id": "...", "player_name": "Bob", ... }
}
```

- [ ] API returns success
- [ ] Player added to correct room
- [ ] Player peer_id is unique
- [ ] Multiple players can join same room

### Start Game API
First, get the room ID and a player ID from previous tests, then:

```bash
curl -X POST http://localhost:3000/api/game/start \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "<ROOM_ID>",
    "psychicPlayerId": "<PLAYER_ID>",
    "numberOfLives": 3
  }'
```

Expected Response:
```json
{
  "success": true,
  "gameState": { "current_round": 1, "team_score": 0, ... },
  "round": { "left_concept": "...", "right_concept": "...", ... }
}
```

- [ ] Game state created
- [ ] First round created with random concepts
- [ ] Psychic assigned
- [ ] Room status updated to 'in_progress'

### Get Players API
```bash
curl http://localhost:3000/api/game/players?roomId=<ROOM_ID>
```

- [ ] Returns list of players
- [ ] Player data includes peer_id
- [ ] Shows correct host/psychic flags

### Get Game State API
```bash
curl http://localhost:3000/api/game/state?roomId=<ROOM_ID>
```

- [ ] Returns current game state
- [ ] Returns current round
- [ ] Data matches database

## 🔌 P2P Connection Testing

### Two Browser Tabs Test

#### Tab 1 (Host)
1. [ ] Open `http://localhost:3000/wavelength`
2. [ ] Enter name "Alice"
3. [ ] Create room with settings
4. [ ] Note the room code (e.g., "ABC123")
5. [ ] Open browser DevTools → Console
6. [ ] Check for P2P connection logs
7. [ ] Wait in lobby

#### Tab 2 (Guest)
1. [ ] Open `http://localhost:3000/wavelength` in new tab
2. [ ] Enter name "Bob"
3. [ ] Join room with code from Tab 1
4. [ ] Open browser DevTools → Console
5. [ ] Check for P2P connection logs

### Verify P2P Connection
- [ ] Both tabs show peer connection logs
- [ ] Signaling messages in database (Supabase Studio → signaling table)
- [ ] WebRTC offers/answers exchanged
- [ ] Data channel established (check console for "Data channel opened")
- [ ] Connection state is "connected"

### Test Dial Sync
In your integration code:
- [ ] Move dial in Tab 1
- [ ] See position update in Tab 2 console
- [ ] Move dial in Tab 2
- [ ] See position update in Tab 1 console
- [ ] Latency < 100ms

## 🎮 Game Flow Testing

### Full Game Flow
1. [ ] **Welcome Screen**: Enter player name
2. [ ] **Main Menu**: Choose "Create Room"
3. [ ] **Create Room**: Set game parameters
   - Room name: "Test Game"
   - Lives: 3
   - Rounds: 5
   - Max Points: 4
4. [ ] **Lobby**: 
   - Room code displayed
   - Player list shows host
   - Host controls visible
5. [ ] **Second Player Joins**:
   - Second tab joins with room code
   - Player appears in both lobbies
   - P2P connection established
6. [ ] **Start Game** (Host):
   - Psychic assigned randomly
   - First round created
   - Concepts displayed
7. [ ] **Active Game Screen**:
   - Round info displayed
   - Dial interactive
   - Spectrum labels visible
8. [ ] **Dial Movement**:
   - Moving dial updates position
   - P2P syncs to other players
9. [ ] **Lock Guess**:
   - Click "Lock In"
   - Position saved to database
   - P2P broadcasts locked state
10. [ ] **Reveal** (Host):
    - Target position revealed
    - Points calculated
    - Score updated

## 🗄️ Database Integrity

### Check Data Consistency
In Supabase Studio:

#### game_rooms
- [ ] room_code is unique
- [ ] status values are valid ('waiting', 'in_progress', 'finished')
- [ ] settings is valid JSON
- [ ] host_player_id references valid player

#### players
- [ ] peer_id is unique
- [ ] room_id references valid room
- [ ] Only one host per room
- [ ] Player names unique per room

#### game_state
- [ ] One record per room (unique room_id)
- [ ] current_round > 0
- [ ] lives_remaining >= 0
- [ ] current_psychic_id references valid player

#### rounds
- [ ] round_number sequential (1, 2, 3, ...)
- [ ] target_position between 0 and 100
- [ ] locked_positions is valid JSON array
- [ ] Unique (room_id, round_number) combination

#### signaling
- [ ] Messages have valid type ('offer', 'answer', 'ice-candidate')
- [ ] payload is valid JSON
- [ ] Old messages marked as consumed

## 🌐 WebRTC Connection States

Check browser console for:
```
Connection state with peer-xxx: connecting
Connection state with peer-xxx: connected
Data channel opened with peer-xxx
```

Verify in code:
- [ ] ICE candidates exchanged
- [ ] Offers/answers exchanged
- [ ] Data channel state is "open"
- [ ] No connection errors in console

## 🔄 Reconnection Testing

### Disconnect Scenarios

#### Player Closes Tab
1. [ ] Player 1 and Player 2 connected
2. [ ] Player 1 closes tab
3. [ ] Player 2 sees disconnect event
4. [ ] Player 1 reopens and rejoins
5. [ ] P2P connection re-established

#### Network Interruption
1. [ ] Players connected
2. [ ] Disable network on one device
3. [ ] Other players see disconnect
4. [ ] Re-enable network
5. [ ] Player reconnects
6. [ ] Game state synced from database

## 📊 Performance Testing

### Latency Measurements
- [ ] P2P message latency < 100ms
- [ ] API response time < 500ms
- [ ] Database queries < 200ms
- [ ] Page load time < 2s

### Load Testing
- [ ] 4 players in one room
- [ ] All dials syncing smoothly
- [ ] No lag or dropped connections
- [ ] Database handles concurrent requests

## 🐛 Error Handling

### Test Error Cases

#### Invalid Room Code
```bash
curl -X POST http://localhost:3000/api/game/join \
  -H "Content-Type: application/json" \
  -d '{"roomCode": "INVALID", "playerName": "Test", "peerId": "peer-1"}'
```
- [ ] Returns 404 error
- [ ] Error message is clear

#### Duplicate Room Code
```bash
# Try to create two rooms with same code
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"roomCode": "TEST01", ...}'
```
- [ ] Second request fails
- [ ] Error indicates duplicate code

#### Duplicate Peer ID
```bash
# Try to join with same peer ID
curl -X POST http://localhost:3000/api/game/join \
  -H "Content-Type: application/json" \
  -d '{"roomCode": "TEST01", "playerName": "Charlie", "peerId": "peer-test-1"}'
```
- [ ] Request fails
- [ ] Error indicates duplicate peer ID

#### Join Game In Progress
1. [ ] Start a game
2. [ ] Try to join as new player
- [ ] Request fails with appropriate error

## 🔒 Security Checks

### RLS Policies
- [ ] RLS enabled on all tables
- [ ] Currently using allow-all policies (for development)
- [ ] Plan to restrict in production

### Input Validation
- [ ] API validates required fields
- [ ] Room codes are alphanumeric
- [ ] Names have length limits
- [ ] Settings values within ranges

## 📱 Cross-Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

Verify:
- [ ] P2P connections work
- [ ] UI renders correctly
- [ ] Touch events work on mobile
- [ ] No console errors

## 🚀 Production Readiness

### Before Production Deploy
- [ ] Update Supabase URL to production
- [ ] Update Supabase keys to production
- [ ] Implement proper RLS policies
- [ ] Add TURN servers for WebRTC
- [ ] Add error boundaries in React
- [ ] Add proper loading states
- [ ] Add user-friendly error messages
- [ ] Add analytics/monitoring
- [ ] Add rate limiting
- [ ] Add CORS configuration
- [ ] Test on production-like network
- [ ] Performance audit
- [ ] Security audit

## 📝 Documentation Completeness

- [ ] BACKEND_README.md reviewed
- [ ] INTEGRATION_GUIDE.md reviewed
- [ ] QUICK_REFERENCE.md reviewed
- [ ] ARCHITECTURE.md reviewed
- [ ] All code has comments
- [ ] API endpoints documented
- [ ] Database schema documented

## ✨ Final Verification

Run through complete game:
1. [ ] Create room
2. [ ] Join with second player
3. [ ] Start game
4. [ ] Play complete round
5. [ ] Reveal and score
6. [ ] Advance to next round
7. [ ] Complete all rounds
8. [ ] Game ends properly
9. [ ] Data persisted in database
10. [ ] No errors in console

If all boxes are checked, your backend is ready! 🎉

## 🛟 Troubleshooting Guide

### Issue: Supabase won't start
```bash
supabase stop
supabase start
```

### Issue: Migrations not applied
```bash
supabase db reset
```

### Issue: P2P not connecting
1. Check browser console for errors
2. Verify signaling messages in database
3. Check firewall/network settings
4. Try different browser

### Issue: API errors
1. Check Supabase is running
2. Verify database tables exist
3. Check API logs in terminal
4. Test with curl commands

### Issue: TypeScript errors
```bash
npm install
npm run dev
```

---

**Questions or issues?** Check the documentation:
- BACKEND_README.md - Full API docs
- INTEGRATION_GUIDE.md - Integration steps
- QUICK_REFERENCE.md - Quick commands
