# Environment Variables Template

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard at https://app.supabase.com

VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
```

## Example Values

```env
# Example (do not use these - they won't work):
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibnhreG54a3h4a3giLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjQwMDAwMCwiZXhwIjoxOTQ3OTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## How to Get Your Credentials

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Create a new project (or select existing one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_PUBLISHABLE_KEY`

## Important Notes

- ⚠️ The `.env` file is gitignored and should never be committed
- ⚠️ Never share your Supabase keys publicly
- ✅ The "anon/public" key is safe to use in frontend code
- ✅ Restart your dev server after creating/modifying the `.env` file

## Verify Setup

After creating your `.env` file, restart the development server:

```bash
npm run dev
```

Open the browser console (F12) and check for any Supabase connection errors. If configured correctly, you should see no errors related to Supabase.

