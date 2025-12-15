# 🎮 Wavelength - Multiplayer Party Game

A web-based implementation of the Wavelength board game with Squid Game-inspired aesthetics. Features real-time multiplayer using WebRTC P2P and Supabase backend.

## ✨ Features

- 🎨 **Squid Game Aesthetic** - Dark, neon design with geometric shapes
- 🌐 **Real-time Multiplayer** - WebRTC peer-to-peer connections
- 💾 **Persistent Storage** - Supabase PostgreSQL database
- 🎯 **Interactive Gameplay** - Draggable dial with smooth animations
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔒 **Type-Safe** - Full TypeScript implementation

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- Supabase CLI installed (`npm install -g supabase`)

### Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup backend (starts Supabase and applies migrations)
chmod +x setup.sh
./setup.sh

# 3. Start development server
npm run dev

# 4. Open game
open http://localhost:3000/wavelength
```

That's it! 🎉

### Test Multiplayer

1. Open `http://localhost:3000/wavelength` in two browser tabs
2. Tab 1: Create a room and note the room code
3. Tab 2: Join with the room code
4. Move the dial and watch it sync!

## 📚 Documentation

### Getting Started
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - 5-minute setup guide (start here!)
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick commands and code snippets

### Backend Documentation
- **[BACKEND_README.md](BACKEND_README.md)** - Complete API documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture diagrams
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Step-by-step integration guide

### Implementation Details
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Comprehensive testing guide

## 🏗️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Real-time**: WebRTC (peer-to-peer)
- **API**: Next.js API Routes

## 📁 Project Structure

```
wavelength/
├── app/
│   ├── wavelength/page.tsx          # Main game orchestrator
│   └── api/game/                     # API routes
│       ├── create/                   # Create game
│       ├── join/                     # Join game
│       ├── start/                    # Start game
│       ├── round/                    # Round actions
│       ├── players/                  # Player management
│       └── state/                    # Game state
├── components/
│   ├── screens/                      # Game screens
│   │   ├── WelcomeScreen.tsx        # Name entry
│   │   ├── MainMenuScreen.tsx       # Create/Join menu
│   │   ├── CreateRoomForm.tsx       # Room creation
│   │   ├── GameWaitingRoom.tsx      # Lobby
│   │   └── ActiveGameScreen.tsx     # Main gameplay
│   └── examples/
│       └── GameIntegrationExample.tsx # Integration example
├── lib/
│   ├── supabase.ts                   # Database client & helpers
│   ├── wavelength-p2p.ts            # WebRTC P2P manager
│   ├── api-client.ts                # API wrapper functions
│   └── hooks/
│       └── useWavelengthP2P.ts      # React P2P hook
├── supabase/
│   └── migrations/                   # Database migrations
└── docs/                             # Documentation
```

## 🎮 Game Flow

1. **Welcome** - Enter player name
2. **Main Menu** - Create or join room
3. **Lobby** - Wait for players, assign psychic
4. **Active Game** - Play rounds with dial guessing
5. **Reveal** - Show target, calculate score
6. **Next Round** - Progress through game

## 🗄️ Database Schema

- **game_rooms** - Room info, settings, status
- **players** - Player data, peer IDs, roles
- **game_state** - Current round, score, lives
- **rounds** - Concepts, hints, target positions
- **dial_updates** - Real-time dial positions
- **signaling** - WebRTC connection data

## 🔌 API Endpoints

```
POST /api/game/create      - Create new game room
POST /api/game/join        - Join existing game
POST /api/game/start       - Start the game
POST /api/game/round       - Round actions (create/lock/reveal)
GET  /api/game/players     - Get players in room
GET  /api/game/state       - Get current game state
```

## 🌐 WebRTC P2P

Real-time communication using peer-to-peer connections:
- Direct player-to-player connections
- Low latency dial synchronization
- Automatic reconnection handling
- Signaling via Supabase Realtime

## 🧪 Testing

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for comprehensive testing guide.

### Quick Test

```bash
# Test API
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"roomName":"Test","roomCode":"TEST01","playerName":"Alice","peerId":"peer-1","settings":{"numberOfLives":3,"numberOfRounds":5,"maxPoints":4}}'

# View database
open http://localhost:54323
```

## 🛠️ Development

### Useful Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Check status
supabase status

# Reset database (reapply migrations)
supabase db reset

# View database
open http://localhost:54323

# Start dev server
npm run dev
```

### Code Examples

See [components/examples/GameIntegrationExample.tsx](components/examples/GameIntegrationExample.tsx) for complete working example.

## 🐛 Troubleshooting

### Supabase Not Starting
```bash
supabase stop && supabase start
```

### Migrations Not Applied
```bash
supabase db reset
```

### P2P Not Connecting
- Check both players in same room
- Look for WebRTC errors in console
- Verify signaling in database

See [GETTING_STARTED.md](GETTING_STARTED.md#-common-issues--fixes) for more solutions.

## 📖 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Supabase Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

### WebRTC Resources
- [WebRTC Guide](https://webrtc.org/getting-started/overview)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

## 🚀 Deployment

### Production Checklist
- [ ] Update Supabase URL to production
- [ ] Enable Row Level Security policies
- [ ] Add TURN servers for WebRTC
- [ ] Configure CORS
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Performance optimization

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md#-production-readiness) for complete checklist.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Inspired by the Wavelength board game
- Squid Game aesthetic design
- Built with Next.js and Supabase

---

**Need help?** Check [GETTING_STARTED.md](GETTING_STARTED.md) or [BACKEND_README.md](BACKEND_README.md)

**Ready to integrate?** Follow [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

**Want quick reference?** See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
