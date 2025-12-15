-- Create game_rooms table for Wavelength game
CREATE TABLE IF NOT EXISTS public.game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    room_name TEXT NOT NULL,
    host_player_id UUID,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'finished')),
    settings JSONB NOT NULL DEFAULT '{
        "numberOfLives": 3,
        "numberOfRounds": 5,
        "maxPoints": 4
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    peer_id TEXT UNIQUE NOT NULL,
    is_host BOOLEAN DEFAULT false,
    is_psychic BOOLEAN DEFAULT false,
    is_connected BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, player_name)
);

-- Create game_state table to track current game state
CREATE TABLE IF NOT EXISTS public.game_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID UNIQUE REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    current_round INTEGER DEFAULT 1,
    team_score INTEGER DEFAULT 0,
    lives_remaining INTEGER DEFAULT 3,
    current_psychic_id UUID REFERENCES public.players(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create rounds table to store round data
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    left_concept TEXT NOT NULL,
    right_concept TEXT NOT NULL,
    psychic_hint TEXT,
    target_position DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    locked_positions JSONB DEFAULT '[]'::jsonb, -- Array of {playerId, playerName, position, lockedAt}
    revealed BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, round_number)
);

-- Create dial_updates table for P2P synchronization backup
CREATE TABLE IF NOT EXISTS public.dial_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    dial_position DECIMAL(5,2) NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS game_rooms_room_code_idx ON public.game_rooms(room_code);
CREATE INDEX IF NOT EXISTS game_rooms_status_idx ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS players_room_id_idx ON public.players(room_id);
CREATE INDEX IF NOT EXISTS players_peer_id_idx ON public.players(peer_id);
CREATE INDEX IF NOT EXISTS rounds_room_id_round_number_idx ON public.rounds(room_id, round_number);
CREATE INDEX IF NOT EXISTS dial_updates_room_id_round_idx ON public.dial_updates(room_id, round_number);

-- Add RLS policies
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dial_updates ENABLE ROW LEVEL SECURITY;

-- Policies for game_rooms (allow all for now)
CREATE POLICY "Allow all operations on game_rooms" ON public.game_rooms
    FOR ALL USING (true);

-- Policies for players (allow all for now)
CREATE POLICY "Allow all operations on players" ON public.players
    FOR ALL USING (true);

-- Policies for game_state (allow all for now)
CREATE POLICY "Allow all operations on game_state" ON public.game_state
    FOR ALL USING (true);

-- Policies for rounds (allow all for now)
CREATE POLICY "Allow all operations on rounds" ON public.rounds
    FOR ALL USING (true);

-- Policies for dial_updates (allow all for now)
CREATE POLICY "Allow all operations on dial_updates" ON public.dial_updates
    FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_game_rooms_updated_at BEFORE UPDATE ON public.game_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at BEFORE UPDATE ON public.game_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON public.rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old dial updates
CREATE OR REPLACE FUNCTION cleanup_old_dial_updates()
RETURNS void AS $$
BEGIN
    DELETE FROM public.dial_updates 
    WHERE created_at < (NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;
