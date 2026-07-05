-- Unlockly Storage Schema for Supabase
-- Run this in your Supabase SQL editor to set up cloud storage

-- Create unlocks table
CREATE TABLE IF NOT EXISTS public.unlocks (
  id bigserial PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) + INTERVAL '30 days'
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_unlocks_code ON public.unlocks(code);
CREATE INDEX IF NOT EXISTS idx_unlocks_expires_at ON public.unlocks(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.unlocks ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can view an unlock via code)
CREATE POLICY "Allow public read" ON public.unlocks
  FOR SELECT
  USING (true);

-- Allow public insert (anyone can create unlocks)
CREATE POLICY "Allow public insert" ON public.unlocks
  FOR INSERT
  WITH CHECK (true);

-- Allow update (for upsert operations)
CREATE POLICY "Allow public update" ON public.unlocks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Auto-delete expired links (optional cleanup)
-- You can set up a cron job or use Supabase's pg_cron extension:
-- SELECT cron.schedule('delete-expired-unlocks', '0 0 * * *', 'DELETE FROM public.unlocks WHERE expires_at < NOW()');
