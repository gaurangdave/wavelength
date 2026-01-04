-- Enable realtime for players table
-- This allows all players to see when new players join the waiting room

-- Add the players table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- Set replica identity to FULL for complete column information in realtime
ALTER TABLE public.players REPLICA IDENTITY FULL;
