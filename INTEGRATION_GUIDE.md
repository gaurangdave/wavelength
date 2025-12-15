# Integrating Backend with Wavelength Frontend

This guide shows how to integrate the backend APIs and P2P communication into your existing Wavelength UI components.

## Quick Start

1. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Visit the game**:
   Open `http://localhost:3000/wavelength`

## Integration Steps

### 1. Update Main Page Component

Update `/app/wavelength/page.tsx` to include backend integration:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useWavelengthP2P } from '@/lib/hooks/useWavelengthP2P';
import { 
  createGame, 
  joinGame, 
  startGame,
  getPlayers,
  generatePeerId,
  generateRoomCode 
} from '@/lib/api-client';
import { Player, GameRoom } from '@/lib/supabase';

export default function WavelengthGamePage() {
  // Generate unique peer ID for this player
  const [peerId] = useState(generatePeerId());
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  // Initialize P2P
  const p2p = useWavelengthP2P({
    peerId,
    onDialUpdate: (playerId, playerName, position, isLocked) => {
      // Handle dial updates from other players
      console.log(`${playerName} moved dial to ${position}`);
    },
    onGameStateSync: (round, score, lives, psychicId) => {
      // Sync game state
      console.log('Game state synced');
    }
  });

  // ... rest of your component
}
```

### 2. Update CreateRoomForm Component

Modify `/components/screens/CreateRoomForm.tsx` to call the backend:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const roomCode = generateRoomCode();
    const result = await createGame({
      roomName: settings.roomName,
      roomCode,
      playerName,
      peerId,
      settings: {
        numberOfLives: settings.numberOfLives,
        numberOfRounds: settings.numberOfRounds,
        maxPoints: settings.maxPoints
      }
    });

    // Save room and player data
    setRoom(result.room);
    setPlayer(result.player);

    // Join P2P room
    await p2p.joinRoom(result.room.id);

    // Navigate to lobby
    onCreateGame(settings);
  } catch (error) {
    console.error('Failed to create game:', error);
    alert('Failed to create game. Please try again.');
  }
};
```

### 3. Update GameWaitingRoom Component

Fetch real players from database:

```typescript
useEffect(() => {
  if (!roomId) return;

  const fetchPlayers = async () => {
    try {
      const result = await getPlayers(roomId);
      setPlayers(result.players);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  // Fetch immediately
  fetchPlayers();

  // Poll for updates every 2 seconds
  const interval = setInterval(fetchPlayers, 2000);

  return () => clearInterval(interval);
}, [roomId]);

const handleStartGame = async () => {
  try {
    // Randomly assign psychic
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    
    const result = await startGame({
      roomId: room.id,
      psychicPlayerId: randomPlayer.id,
      numberOfLives: settings.numberOfLives
    });

    // Broadcast game start to all peers
    p2p.sendGameStateSync(
      result.gameState.current_round,
      result.gameState.team_score,
      result.gameState.lives_remaining,
      randomPlayer.id
    );

    onStartGame();
  } catch (error) {
    console.error('Failed to start game:', error);
  }
};
```

### 4. Update ActiveGameScreen Component

Add P2P dial synchronization:

```typescript
// In ActiveGameScreen.tsx
const handleDialChange = (newPosition: number) => {
  setDialPosition(newPosition);
  
  // Broadcast dial position to all peers
  if (player) {
    p2p.sendDialUpdate(
      player.id,
      player.player_name,
      newPosition,
      false
    );
  }
};

const handleLockInGuess = async () => {
  try {
    setIsLocked(true);

    // Save to database
    await handleRoundAction({
      action: 'lock-position',
      roundId: currentRound.id,
      playerId: player.id,
      playerName: player.player_name,
      position: dialPosition
    });

    // Broadcast locked position
    p2p.sendDialUpdate(
      player.id,
      player.player_name,
      dialPosition,
      true
    );

    onLockInGuess(dialPosition);
  } catch (error) {
    console.error('Failed to lock guess:', error);
  }
};
```

### 5. Create Join Room Screen

Create `/components/screens/JoinRoomScreen.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { joinGame } from '@/lib/api-client';

interface JoinRoomScreenProps {
  playerName: string;
  peerId: string;
  onJoinSuccess: (room: any, player: any) => void;
  onBack: () => void;
}

export default function JoinRoomScreen({ 
  playerName, 
  peerId, 
  onJoinSuccess, 
  onBack 
}: JoinRoomScreenProps) {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await joinGame({
        roomCode: roomCode.toUpperCase(),
        playerName,
        peerId
      });

      onJoinSuccess(result.room, result.player);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl lg:text-5xl font-bold text-center mb-2 text-teal-400 tracking-widest uppercase">
          JOIN ROOM
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-teal-400 text-sm tracking-wider uppercase mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 bg-zinc-900 border-2 border-fuchsia-600 rounded text-white text-center text-2xl tracking-widest uppercase focus:outline-none focus:border-fuchsia-400"
              placeholder="ABC123"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || roomCode.length !== 6}
            className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold tracking-widest uppercase rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'JOINING...' : 'JOIN GAME'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-teal-400 font-bold tracking-widest uppercase rounded transition-colors"
          >
            BACK
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Key Concepts

### 1. Peer ID
Every player needs a unique peer ID for P2P connections:
```typescript
const [peerId] = useState(generatePeerId());
```

### 2. P2P Hook
Use the hook to manage P2P connections:
```typescript
const p2p = useWavelengthP2P({
  peerId,
  onDialUpdate: (playerId, playerName, position, isLocked) => {
    // Handle remote dial updates
  },
  onGameStateSync: (round, score, lives, psychicId) => {
    // Sync game state
  }
});

// Join room
await p2p.joinRoom(roomId);

// Send updates
p2p.sendDialUpdate(playerId, playerName, position, false);
```

### 3. Database Operations
Use the API client for database operations:
```typescript
import { 
  createGame, 
  joinGame, 
  startGame,
  handleRoundAction,
  getPlayers 
} from '@/lib/api-client';

// Create game
const result = await createGame({...});

// Join game
const result = await joinGame({...});

// Start game
const result = await startGame({...});
```

### 4. Real-time Updates
Combine database polling with P2P for best experience:

- **Database**: Source of truth, handles reconnections
- **P2P**: Real-time updates, low latency

```typescript
// Fetch from database periodically
useEffect(() => {
  const interval = setInterval(async () => {
    const result = await getPlayers(roomId);
    setPlayers(result.players);
  }, 3000);

  return () => clearInterval(interval);
}, [roomId]);

// Listen to P2P for immediate updates
p2p.onDialUpdate = (playerId, playerName, position, isLocked) => {
  // Update UI immediately
};
```

## Testing the Integration

### Single Player Testing
1. Open `http://localhost:3000/wavelength`
2. Create a game
3. Check Supabase Studio to see data

### Multiplayer Testing
1. Open two browser tabs
2. Create a game in tab 1
3. Note the room code
4. Join game in tab 2 with the room code
5. Move dial in one tab, see update in other tab

### Debug Tools
- **Supabase Studio**: `http://localhost:54323`
  - View all database tables
  - See real-time data changes
  - Check signaling messages

- **Browser Console**:
  - P2P connection logs
  - WebRTC status
  - Message broadcasts

## Common Issues

### 1. Supabase Not Running
```bash
supabase status
# If not running:
supabase start
```

### 2. Migrations Not Applied
```bash
supabase db reset
```

### 3. P2P Not Connecting
- Check browser console for WebRTC errors
- Ensure both players are in the same room
- Verify signaling messages in database

### 4. Dial Not Syncing
- Check P2P connection status
- Verify `sendDialUpdate` is being called
- Check `onDialUpdate` callback is set

## Production Checklist

- [ ] Update Supabase URL to production
- [ ] Enable Row Level Security (RLS) policies
- [ ] Add TURN servers for WebRTC
- [ ] Implement reconnection logic
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Test on different networks
- [ ] Add analytics/monitoring

## Next Steps

1. **Implement Join Room Screen**: Complete the UI for joining games
2. **Add Reconnection Logic**: Handle disconnects gracefully
3. **Improve Error Handling**: Show user-friendly error messages
4. **Add Loading States**: Better UX during API calls
5. **Optimize P2P**: Reduce bandwidth usage
6. **Add Game Logic**: Complete scoring and round progression

See `BACKEND_README.md` for detailed API documentation and `components/examples/GameIntegrationExample.tsx` for a complete working example.
