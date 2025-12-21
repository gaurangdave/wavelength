-- Fix signaling table to reference game_rooms instead of rooms
-- This aligns the signaling table with the Wavelength game architecture

-- Drop the old foreign key constraint
ALTER TABLE public.signaling 
DROP CONSTRAINT IF EXISTS signaling_room_id_fkey;

-- Add new foreign key constraint referencing game_rooms
ALTER TABLE public.signaling 
ADD CONSTRAINT signaling_room_id_fkey 
FOREIGN KEY (room_id) 
REFERENCES public.game_rooms(id) 
ON DELETE CASCADE;

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS signaling_room_id_idx ON public.signaling(room_id);
