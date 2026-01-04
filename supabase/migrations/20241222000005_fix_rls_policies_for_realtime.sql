-- Fix RLS policies for Realtime subscriptions
-- Realtime requires policies that explicitly work with the realtime role

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on game_rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Allow all operations on players" ON public.players;
DROP POLICY IF EXISTS "Allow all operations on game_state" ON public.game_state;
DROP POLICY IF EXISTS "Allow all operations on rounds" ON public.rounds;
DROP POLICY IF EXISTS "Allow all operations on dial_updates" ON public.dial_updates;

-- Create new policies that work with Realtime
-- These policies allow both authenticated and unauthenticated (anon) users

-- game_rooms policies
CREATE POLICY "Enable read access for all users" ON public.game_rooms
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.game_rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.game_rooms
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.game_rooms
    FOR DELETE USING (true);

-- players policies
CREATE POLICY "Enable read access for all users" ON public.players
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.players
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.players
    FOR DELETE USING (true);

-- game_state policies
CREATE POLICY "Enable read access for all users" ON public.game_state
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.game_state
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.game_state
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.game_state
    FOR DELETE USING (true);

-- rounds policies
CREATE POLICY "Enable read access for all users" ON public.rounds
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.rounds
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.rounds
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.rounds
    FOR DELETE USING (true);

-- dial_updates policies
CREATE POLICY "Enable read access for all users" ON public.dial_updates
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.dial_updates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.dial_updates
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.dial_updates
    FOR DELETE USING (true);
