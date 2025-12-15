# 🎮 Wavelength Backend - Getting Started

Welcome! This guide will get you up and running with the Wavelength game backend in **5 minutes**.

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Supabase CLI (1 min)

```bash
# Using npm
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase
```

Verify installation:
```bash
supabase --version
# Should output: supabase version 1.x.x
```

### Step 2: Setup Backend (2 min)

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup (starts Supabase and applies migrations)
./setup.sh
```

You should see:
```
🎮 Setting up Wavelength Game Backend...
🐳 Starting Supabase...
✅ Setup complete!
```

### Step 3: Verify Setup (1 min)

Check Supabase is running:
```bash
supabase status
```

You should see:
```
API URL: http://localhost:54321
Studio URL: http://localhost:54323
...
```

Open Supabase Studio:
```bash
open http://localhost:54323
```

Navigate to "Table Editor" and verify you see these tables:
- game_rooms ✅
- players ✅
- game_state ✅
- rounds ✅
- dial_updates ✅
- signaling ✅

### Step 4: Start Dev Server (1 min)

```bash
npm run dev
```

Visit the game:
```bash
open http://localhost:3000/wavelength
```

## 🎯 What You Just Built

You now have a complete backend with:

✅ **PostgreSQL Database** - 6 tables for game management  
✅ **REST API** - 6 endpoints for game operations  
✅ **WebRTC P2P** - Real-time dial synchronization  
✅ **Type Safety** - Full TypeScript support  
✅ **React Hooks** - Easy P2P integration  

## 📚 Next Steps

### Option 1: Test with Example Component

View the example integration:
```bash
# Open the example file
code components/examples/GameIntegrationExample.tsx
```

This shows a complete working implementation you can reference.

### Option 2: Integrate with Existing UI

Follow the integration guide to connect your screens:
```bash
# Read the integration guide
open INTEGRATION_GUIDE.md
```

Key changes to make:
1. Generate peer ID in main page component
2. Add P2P hook to ActiveGameScreen
3. Call backend APIs instead of local state
4. Sync dial updates via P2P

### Option 3: Test API Directly

Test the API with curl:

**Create a game:**
```bash
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "Test Game",
    "roomCode": "TEST01",
    "playerName": "Alice",
    "peerId": "peer-alice-123",
    "settings": {
      "numberOfLives": 3,
      "numberOfRounds": 5,
      "maxPoints": 4
    }
  }'
```

You should get back:
```json
{
  "success": true,
  "room": { "id": "...", "room_code": "TEST01", ... },
  "player": { "id": "...", "player_name": "Alice", ... }
}
```

Check the database in Supabase Studio - you'll see the data!

## 🧪 Test Multiplayer

### Two-Tab Test

**Tab 1 (Create Game):**
1. Open `http://localhost:3000/wavelength`
2. Enter name: "Alice"
3. Create room
4. Note the room code (e.g., "ABC123")

**Tab 2 (Join Game):**
1. Open `http://localhost:3000/wavelength` in new tab
2. Enter name: "Bob"
3. Join with room code "ABC123"

**Verify P2P:**
- Open DevTools Console in both tabs
- Should see "Peer connected" messages
- Move dial in one tab → should sync to other tab

## 📖 Essential Documentation

### For Integration
- **INTEGRATION_GUIDE.md** - Step-by-step integration instructions
- **QUICK_REFERENCE.md** - Code snippets and commands

### For Understanding
- **BACKEND_README.md** - Complete API documentation
- **ARCHITECTURE.md** - System architecture diagrams

### For Testing
- **TESTING_CHECKLIST.md** - Comprehensive testing guide

## 💻 Code Examples

### Basic Integration Pattern

```typescript
// 1. Import utilities
import { useWavelengthP2P } from '@/lib/hooks/useWavelengthP2P';
import { createGame, generatePeerId, generateRoomCode } from '@/lib/api-client';

// 2. Initialize peer ID
const [peerId] = useState(generatePeerId());

// 3. Setup P2P hook
const p2p = useWavelengthP2P({
  peerId,
  onDialUpdate: (playerId, playerName, position, isLocked) => {
    console.log(`${playerName} moved dial to ${position}`);
    // Update your UI here
  }
});

// 4. Create game
const handleCreate = async () => {
  const result = await createGame({
    roomName: 'My Game',
    roomCode: generateRoomCode(),
    playerName: 'Alice',
    peerId,
    settings: {
      numberOfLives: 3,
      numberOfRounds: 5,
      maxPoints: 4
    }
  });
  
  // Join P2P room
  await p2p.joinRoom(result.room.id);
};

// 5. Send dial updates
const handleDialMove = (position: number) => {
  p2p.sendDialUpdate(playerId, playerName, position, false);
};
```

## 🎨 Integration Roadmap

Here's the recommended order to integrate the backend:

### Phase 1: Basic Setup (10 min)
- [x] Backend running
- [ ] Add peer ID to main page
- [ ] Initialize P2P hook

### Phase 2: Room Management (30 min)
- [ ] Update CreateRoomForm to call API
- [ ] Create JoinRoomScreen
- [ ] Update GameWaitingRoom to fetch real players

### Phase 3: P2P Integration (30 min)
- [ ] Add dial sync in ActiveGameScreen
- [ ] Broadcast dial movements
- [ ] Handle remote dial updates

### Phase 4: Game Logic (1 hour)
- [ ] Start game flow
- [ ] Lock guess flow
- [ ] Reveal and scoring
- [ ] Round progression

### Phase 5: Polish (30 min)
- [ ] Error handling
- [ ] Loading states
- [ ] Reconnection logic

## 🔍 Debugging Tips

### Check if Backend is Running

```bash
# Check Supabase status
supabase status

# Check if API responds
curl http://localhost:3000/api/game/players?roomId=test

# View database
open http://localhost:54323
```

### View P2P Connection Status

In browser console:
```javascript
// Should see these logs when P2P works:
"Connection state with peer-xxx: connected"
"Data channel opened with peer-xxx"
```

### Inspect Database

Open Supabase Studio → Table Editor:
- **game_rooms** - See created rooms
- **players** - See joined players
- **signaling** - See WebRTC messages

## 🛟 Common Issues & Fixes

### "supabase: command not found"
```bash
# Install Supabase CLI
npm install -g supabase
```

### "Supabase is not running"
```bash
# Start Supabase
supabase start
```

### "Port already in use"
```bash
# Stop existing Supabase
supabase stop

# Start again
supabase start
```

### "Migrations not applied"
```bash
# Reset database
supabase db reset
```

### "P2P not connecting"
1. Check both players in same room (check database)
2. Look for WebRTC errors in console
3. Verify signaling messages in database
4. Try different browser

### "TypeScript errors"
```bash
# Reinstall dependencies
npm install
```

## 📊 Success Metrics

You'll know everything is working when:

✅ `supabase status` shows all services running  
✅ Supabase Studio opens at `http://localhost:54323`  
✅ Can see 6 tables in Table Editor  
✅ `npm run dev` starts without errors  
✅ Game opens at `http://localhost:3000/wavelength`  
✅ Two browser tabs can connect via P2P  
✅ Moving dial in one tab updates the other  
✅ Data appears in Supabase Studio  

## 🎓 Learning Path

### Day 1: Setup & Understand
1. ✅ Run setup
2. 📖 Read BACKEND_README.md
3. 🧪 Test with curl commands
4. 👀 Inspect database in Studio

### Day 2: Basic Integration
1. 📝 Follow INTEGRATION_GUIDE.md
2. 🔌 Add peer ID generation
3. 🎣 Initialize P2P hook
4. 🧪 Test two-tab connection

### Day 3: Full Integration
1. 🏗️ Update all screen components
2. 🎮 Implement game flow
3. 🔄 Add dial synchronization
4. ✨ Polish UI/UX

### Day 4: Testing & Polish
1. ✅ Complete TESTING_CHECKLIST.md
2. 🐛 Fix any issues
3. 🚀 Optimize performance
4. 📝 Document custom changes

## 🎁 What's Included

### Backend Files (Created)
```
lib/
  ├── supabase.ts (Updated) - Database client & helpers
  ├── wavelength-p2p.ts - P2P manager
  ├── api-client.ts - API wrapper functions
  └── hooks/
      └── useWavelengthP2P.ts - React hook

app/api/game/
  ├── create/route.ts - Create game endpoint
  ├── join/route.ts - Join game endpoint
  ├── start/route.ts - Start game endpoint
  ├── round/route.ts - Round actions endpoint
  ├── players/route.ts - Player management endpoint
  └── state/route.ts - Game state endpoint

supabase/migrations/
  └── 20241214000002_create_wavelength_game_tables.sql
```

### Documentation (Created)
```
BACKEND_README.md - Complete API documentation
INTEGRATION_GUIDE.md - Step-by-step integration
QUICK_REFERENCE.md - Code snippets & commands
ARCHITECTURE.md - System diagrams
TESTING_CHECKLIST.md - Testing guide
IMPLEMENTATION_SUMMARY.md - What was built
```

### Examples (Created)
```
components/examples/
  └── GameIntegrationExample.tsx - Working example
```

## 🚀 Ready to Build?

You're all set! Here's what to do next:

1. **Quick Test**: Run the two-tab test above ☝️
2. **Read Integration Guide**: Open `INTEGRATION_GUIDE.md`
3. **Start Coding**: Update your components to use backend
4. **Join Community**: Share what you build!

## 💡 Pro Tips

1. **Use both DB and P2P**: Database for persistence, P2P for real-time
2. **Check Studio often**: Supabase Studio is great for debugging
3. **Console is your friend**: P2P logs help debug connections
4. **Start simple**: Get basic integration working before adding features
5. **Test early**: Use two browser tabs from the start

## 🎉 You're Ready!

Your Wavelength backend is up and running. Time to build an amazing multiplayer game!

**Need help?** Check the documentation or open an issue.

**Good luck!** 🍀

---

Quick commands to remember:
```bash
supabase start        # Start backend
supabase stop         # Stop backend
supabase status       # Check status
supabase db reset     # Reset database
npm run dev           # Start frontend
open http://localhost:54323  # View database
```
