-- Create rooms table for WebRTC connections
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    creator_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create participants table to track users in rooms
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    peer_id TEXT UNIQUE NOT NULL,
    is_connected BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create signaling table for WebRTC offers/answers/ICE candidates
CREATE TABLE IF NOT EXISTS public.signaling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    from_peer_id TEXT NOT NULL,
    to_peer_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate')),
    payload JSONB NOT NULL,
    is_consumed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signaling ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Allow all operations on rooms" ON public.rooms
    FOR ALL USING (true);

-- Policies for participants
CREATE POLICY "Allow all operations on participants" ON public.participants
    FOR ALL USING (true);

-- Policies for signaling
CREATE POLICY "Allow all operations on signaling" ON public.signaling
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS rooms_name_idx ON public.rooms(name);
CREATE INDEX IF NOT EXISTS participants_room_id_idx ON public.participants(room_id);
CREATE INDEX IF NOT EXISTS participants_peer_id_idx ON public.participants(peer_id);
CREATE INDEX IF NOT EXISTS signaling_room_id_idx ON public.signaling(room_id);
CREATE INDEX IF NOT EXISTS signaling_to_peer_id_idx ON public.signaling(to_peer_id);
CREATE INDEX IF NOT EXISTS signaling_created_at_idx ON public.signaling(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for rooms updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old signaling messages (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_signaling()
RETURNS void AS $$
BEGIN
    DELETE FROM public.signaling 
    WHERE created_at < (now() - interval '1 hour');
END;
$$ language 'plpgsql';