-- Enable realtime for dial_updates table
-- This allows clients to receive real-time updates when dial positions change

-- Add the dial_updates table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.dial_updates;

-- Set replica identity to FULL so all columns are available in realtime updates
-- This is important for filtering updates on the client side
ALTER TABLE public.dial_updates REPLICA IDENTITY FULL;
