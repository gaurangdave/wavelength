-- Allow target_position to be NULL so psychic can set it manually
ALTER TABLE public.rounds 
ALTER COLUMN target_position DROP NOT NULL;

-- Add comment explaining the nullable column
COMMENT ON COLUMN public.rounds.target_position IS 'Target position (0-100). NULL until psychic sets it manually at the start of each round.';
