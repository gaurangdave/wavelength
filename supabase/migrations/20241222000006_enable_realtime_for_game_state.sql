-- Enable realtime for game_state table
-- This allows all players to receive updates when current_round changes (new round starts)

-- Add the game_state table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;

-- Set replica identity to FULL for complete column information in realtime
ALTER TABLE public.game_state REPLICA IDENTITY FULL;
