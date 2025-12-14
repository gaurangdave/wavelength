-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (adjust based on your needs)
CREATE POLICY "Allow all operations on messages" ON public.messages
    FOR ALL USING (true);

-- Create an index on created_at for better performance when ordering
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);