-- Add unique constraint on dial_updates for upsert operations
-- Each player can only have one dial position per round

ALTER TABLE public.dial_updates 
ADD CONSTRAINT dial_updates_room_round_player_unique 
UNIQUE (room_id, round_number, player_id);
