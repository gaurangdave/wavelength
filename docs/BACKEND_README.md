# Wavelength Game Backend

## Overview

The Wavelength game backend uses **Supabase** for data storage and **WebRTC** for peer-to-peer (P2P) communication between players. This ensures real-time synchronization of game state, dial positions, and scores.

## Architecture

### Database (Supabase)
- **game_rooms**: Stores room information (code, name, host, settings, status)
- **players**: Stores player information (name, peer ID, host/psychic status)
- **game_state**: Tracks current game state (round, score, lives)
- **rounds**: Stores round data (concepts, hints, target position, locked guesses)
- **dial_updates**: Backup storage for dial position updates
- **signaling**: WebRTC signaling messages for peer connection establishment

### P2P Communication (WebRTC)
- Direct peer-to-peer connections between all players
- Real-time dial position updates
- Game state synchronization
- Low latency communication without server overhead

### API Routes
- `/api/game/create` - Create a new game room
- `/api/game/join` - Join an existing game room
- `/api/game/start` - Start the game
- `/api/game/round` - Handle round actions (create, update hint, lock position, reveal)
- `/api/game/players` - Manage players (assign psychic, update connection status)
- `/api/game/state` - Get current game state

## Setup Instructions

### 1. Start Local Supabase

Make sure you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Start Supabase locally
supabase start
```

This will start Supabase services on:
- API URL: `http://localhost:54321`
- Studio URL: `http://localhost:54323`

### 2. Run Database Migrations

Apply all migrations to create the necessary tables:

```bash
# Run all migrations
supabase db reset

# Or apply migrations manually
supabase migration up
```

### 3. Verify Database Setup

You can verify the tables were created by visiting:
- Supabase Studio: `http://localhost:54323`
- Navigate to "Table Editor" to see all tables

### 4. Environment Variables

The app uses default local Supabase credentials (already configured in `lib/supabase.ts`):
- URL: `http://localhost:54321`
- Anon Key: `eyJhb...` (default local key)

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000/wavelength`

## Database Schema

### game_rooms
```sql
- id: UUID (Primary Key)
- room_code: TEXT (Unique) - 6-character room code
- room_name: TEXT - Display name for the room
- host_player_id: UUID - Reference to host player
- status: TEXT - 'waiting' | 'in_progress' | 'finished'
- settings: JSONB - Game settings (lives, rounds, maxPoints)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### players
```sql
- id: UUID (Primary Key)
- room_id: UUID (Foreign Key -> game_rooms)
- player_name: TEXT - Player's display name
- peer_id: TEXT (Unique) - WebRTC peer identifier
- is_host: BOOLEAN - Is this player the host?
- is_psychic: BOOLEAN - Is this player the current psychic?
- is_connected: BOOLEAN - Is player currently connected?
- joined_at: TIMESTAMP
- last_seen: TIMESTAMP
```

### game_state
```sql
- id: UUID (Primary Key)
- room_id: UUID (Foreign Key -> game_rooms, Unique)
- current_round: INTEGER - Current round number
- team_score: INTEGER - Total team score
- lives_remaining: INTEGER - Lives left
- current_psychic_id: UUID (Foreign Key -> players)
- updated_at: TIMESTAMP
```

### rounds
```sql
- id: UUID (Primary Key)
- room_id: UUID (Foreign Key -> game_rooms)
- round_number: INTEGER
- left_concept: TEXT - Left spectrum concept
- right_concept: TEXT - Right spectrum concept
- psychic_hint: TEXT - Hint given by psychic
- target_position: DECIMAL(5,2) - Target position (0-100)
- locked_positions: JSONB - Array of player guesses
- revealed: BOOLEAN - Has target been revealed?
- points_earned: INTEGER - Points earned this round
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### dial_updates
```sql
- id: UUID (Primary Key)
- room_id: UUID (Foreign Key -> game_rooms)
- round_number: INTEGER
- player_id: UUID (Foreign Key -> players)
- dial_position: DECIMAL(5,2) - Current dial position
- is_locked: BOOLEAN - Is position locked?
- created_at: TIMESTAMP
```

### signaling
```sql
- id: UUID (Primary Key)
- room_id: UUID (Foreign Key -> rooms)
- from_peer_id: TEXT - Sender's peer ID
- to_peer_id: TEXT - Recipient's peer ID (nullable for broadcast)
- type: TEXT - 'offer' | 'answer' | 'ice-candidate'
- payload: JSONB - WebRTC signaling data
- is_consumed: BOOLEAN - Has message been processed?
- created_at: TIMESTAMP
```

## WebRTC P2P Communication

### Message Types

#### dial-update
Sent when a player moves their dial:
```typescript
{
  type: 'dial-update',
  payload: {
    playerId: string,
    playerName: string,
    position: number,
    isLocked: boolean
  },
  fromPeerId: string,
  timestamp: string
}
```

#### game-state-sync
Sent to synchronize game state across peers:
```typescript
{
  type: 'game-state-sync',
  payload: {
    round: number,
    score: number,
    lives: number,
    psychicId: string
  },
  fromPeerId: string,
  timestamp: string
}
```

#### reveal
Sent when revealing the target position:
```typescript
{
  type: 'reveal',
  payload: {
    targetPosition: number,
    points: number
  },
  fromPeerId: string,
  timestamp: string
}
```

### Connection Flow

1. **Player joins room**: Creates player record in database
2. **P2P Setup**: 
   - Player subscribes to signaling channel for room
   - Creates peer connections to all existing players
   - Exchanges WebRTC offers/answers via signaling table
3. **Data Channel**: Establishes direct P2P data channel for game messages
4. **Real-time Updates**: All game state changes broadcast via P2P

### Benefits of P2P Approach
- **Low Latency**: Direct connections between players
- **Scalability**: No server bottleneck for game messages
- **Resilience**: Game continues even if one peer disconnects
- **Bandwidth**: Server only handles signaling, not game data

## API Usage Examples

### Create a Game
```typescript
import { createGame, generateRoomCode, generatePeerId } from '@/lib/api-client';

const result = await createGame({
  roomName: 'My Game',
  roomCode: generateRoomCode(),
  playerName: 'Alice',
  peerId: generatePeerId(),
  settings: {
    numberOfLives: 3,
    numberOfRounds: 5,
    maxPoints: 4
  }
});

// result.room - Game room data
// result.player - Player data
```

### Join a Game
```typescript
import { joinGame, generatePeerId } from '@/lib/api-client';

const result = await joinGame({
  roomCode: 'ABC123',
  playerName: 'Bob',
  peerId: generatePeerId()
});
```

### Use P2P Hook
```typescript
import { useWavelengthP2P } from '@/lib/hooks/useWavelengthP2P';

const MyComponent = () => {
  const p2p = useWavelengthP2P({
    peerId: myPeerId,
    onDialUpdate: (playerId, playerName, position, isLocked) => {
      console.log(`${playerName} moved dial to ${position}`);
    },
    onGameStateSync: (round, score, lives, psychicId) => {
      console.log(`Game state: Round ${round}, Score ${score}`);
    }
  });

  useEffect(() => {
    p2p.joinRoom(roomId);
    return () => p2p.leaveRoom();
  }, [roomId]);

  // Send dial update
  const handleDialMove = (position: number) => {
    p2p.sendDialUpdate(playerId, playerName, position, false);
  };

  return <div>Connected to {p2p.connectedPeers.length} peers</div>;
};
```

## Troubleshooting

### Supabase Not Starting
```bash
# Check if services are running
supabase status

# Stop and restart
supabase stop
supabase start
```

### Migrations Not Applying
```bash
# Reset database and reapply all migrations
supabase db reset

# Check migration status
supabase migration list
```

### WebRTC Connection Issues
- Ensure both players are on compatible networks
- Check browser console for WebRTC errors
- STUN servers may not work behind restrictive firewalls
- Consider adding TURN server for production

### Database Connection Errors
- Verify Supabase is running: `supabase status`
- Check API URL in `lib/supabase.ts`
- Ensure migrations have been applied

## Next Steps

1. **Run migrations**: `supabase db reset`
2. **Start dev server**: `npm run dev`
3. **Test the game**: Create a room and join from another browser tab
4. **Check Supabase Studio**: View real-time data at `http://localhost:54323`

## Production Deployment

For production deployment:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Update environment variables with production credentials
3. Push migrations: `supabase db push`
4. Configure TURN servers for WebRTC (for restrictive networks)
5. Enable RLS policies for security (currently set to allow all)
