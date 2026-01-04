-- Enable realtime for rounds table
-- This allows non-psychic players to receive updates when the psychic sets target_position

-- Add the rounds table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;

-- Set replica identity to FULL for complete column information in realtime
ALTER TABLE public.rounds REPLICA IDENTITY FULL;
