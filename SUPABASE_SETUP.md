# Supabase Setup Guide for Unlockly

## Quick Start - Cloud Storage Setup

### Step 1: Create Supabase Account & Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project:
   - Give it a name (e.g., "unlockly")
   - Create a strong database password
   - Choose a region close to you
   - Wait for the project to initialize (~2 minutes)

### Step 2: Create Database Table

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the following SQL:

```sql
-- Unlockly Storage Schema
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

-- Allow public read access
CREATE POLICY "Allow public read" ON public.unlocks
  FOR SELECT
  USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert" ON public.unlocks
  FOR INSERT
  WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update" ON public.unlocks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

5. Click **"Run"** button
6. You should see "Success" message

### Step 3: Get Your API Credentials

1. Go to **Settings** (bottom of left sidebar)
2. Click **API**
3. Find these values:
   - **Project URL** - Copy this (it's your SUPABASE_URL)
   - **Anon Key** - Copy this (it's your SUPABASE_ANON_KEY)

Example values look like:
```
URL: https://xyzxyzxyz.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Add Credentials to Unlockly

1. **For Local Development:**
   - Create a `.env` file in the unlockly root directory
   - Add your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **For GitHub Pages (Recommended):**
   - Fork or use the provided `index.html` with embedded credentials
   - Edit `storage.js` and replace the empty strings:
   ```javascript
   const SUPABASE_URL = "https://your-project.supabase.co";
   const SUPABASE_KEY = "your-anon-key-here";
   ```

### Step 5: Test It Works

1. Visit https://ashik4u.github.io/unlockly/
2. Create an unlock link with some tasks
3. Copy the generated link
4. Open it in a different browser or device
5. The link should work and load the same data!

## Verification Checklist

- [ ] Supabase project created
- [ ] SQL schema executed successfully
- [ ] API credentials copied
- [ ] Credentials added to storage.js or .env
- [ ] Test link created and accessed from different device
- [ ] localStorage still works as fallback

## Troubleshooting

**Links not persisting across devices:**
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Open browser DevTools (F12) → Console tab
- Check for any Supabase connection errors
- Verify the `unlocks` table exists in Supabase SQL Editor

**Getting CORS errors:**
- This is normal - Supabase handles cross-origin requests
- Check that you're using the Anon Key (not the Service Role Key)

**Links work locally but not on GitHub Pages:**
- Make sure credentials are embedded in `storage.js`
- Environment variables (.env) don't work on static GitHub Pages sites

## Database Size & Costs

- **Free tier:** 500MB storage, plenty for thousands of unlock links
- Each unlock link = ~200-500 bytes (very small)
- 30-day auto-expiry keeps database clean
- No costs unless you exceed free tier limits

## Optional: Setup Auto-Cleanup

If you want older links to automatically delete after 30 days:

1. In Supabase, go to **SQL Editor**
2. Run this query to enable pg_cron:
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at midnight UTC
SELECT cron.schedule(
  'delete-expired-unlocks',
  '0 0 * * *',
  'DELETE FROM public.unlocks WHERE expires_at < NOW()'
);
```

3. Done! Old links will auto-delete daily

## Support

If you need help:
- Check Supabase docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.io
- This app's GitHub issues: https://github.com/ashik4u/unlockly/issues
