-- Enable realtime for game_rooms table
-- This allows non-host players to receive updates when the host starts the game

-- Add the game_rooms table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;

-- Set replica identity to FULL for complete column information in realtime
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;
