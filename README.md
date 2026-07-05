# Unlockly

A small static link-locker app for private use. Create an unlock URL with task links, share the generated URL, and let visitors unlock the destination after opening each task link.

## Online Version

This repo is ready for GitHub Pages. After the Pages workflow runs, the site should be available at:

```text
https://ashik4u.github.io/unlockly/
```

Generated links use short path codes, for example:

```text
https://ashik4u.github.io/unlockly/7KQ2M
```

## Works on All Devices

Generated links are designed to work seamlessly across all devices:

- **Desktop**: Full functionality with keyboard and mouse navigation
- **Tablet**: Optimized touch interface with responsive layout
- **Mobile**: Mobile-friendly design with optimized task display

Example cross-device links:
- https://ashik4u.github.io/unlockly/7KQ2M
- https://ashik4u.github.io/unlockly/3XJ9L
- https://ashik4u.github.io/unlockly/K8M2Q

## Storage Options

### Local Storage (Default)
By default, unlock links are stored in the browser's `localStorage`. This works out of the box but has a limitation: short-code data is only available on the same device where it was created.

**Pros:**
- No setup required
- Works offline
- Maximum privacy (all data stays local)

**Cons:**
- Data not shared across devices
- Lost if localStorage is cleared

### Cloud Storage (Optional)
For public cross-device short links with persistent data, you can enable optional cloud storage using **Supabase**.

**Pros:**
- Links work across all devices
- Persistent storage
- 30-day auto-cleanup of expired links
- Offline queuing (syncs when connection restored)

**Cons:**
- Requires Supabase account setup

#### Setting Up Cloud Storage

1. **Create a Supabase project** at https://supabase.com
2. **Run the schema** in Supabase SQL editor:
   ```bash
   # Copy contents from supabase-schema.sql
   # Run in your Supabase SQL editor
   ```
3. **Get your credentials** from Supabase project settings:
   - Supabase URL
   - Anon Key

4. **Configure the app** - Create/update `.env` file:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Deploy** - The app will automatically use cloud storage when credentials are configured.

## Run Locally

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

## Notes

- This is a client-side convenience gate, not strong access control.
- Short-code data is stored in `localStorage` by default.
- Link tasks auto-check when opened.
- Progress is stored in `sessionStorage` for the current browser session.
- Cloud storage is optional and automatically handles offline scenarios.
