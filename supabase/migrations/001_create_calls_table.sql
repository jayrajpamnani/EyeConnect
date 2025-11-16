-- Create calls table for matching helpers with volunteers
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'accepted', 'completed', 'cancelled')),
    helper_id TEXT,
    volunteer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_room_id ON public.calls(room_id);

-- Enable Row Level Security
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we don't have auth)
CREATE POLICY "Allow public read access" ON public.calls
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access" ON public.calls
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.calls
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete access" ON public.calls
    FOR DELETE
    USING (true);

-- Enable Realtime for the calls table
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row updates
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON public.calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clean up old completed/cancelled calls (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_calls()
RETURNS void AS $$
BEGIN
    DELETE FROM public.calls
    WHERE (status IN ('completed', 'cancelled'))
    AND updated_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

