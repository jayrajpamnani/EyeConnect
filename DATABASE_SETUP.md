# Database Setup Guide

## ⚠️ IMPORTANT: You MUST Complete This Step!

The video call matching requires a database table in Supabase to work across different devices. Without this table, the app will show "connecting" and "listening" infinitely because devices can't see each other's requests.

## Quick Setup (5 minutes)

### Step 1: Log into Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your EyeConnect project

### Step 2: Run the Database Migration

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query** button
3. Copy the entire SQL code from `supabase/migrations/001_create_calls_table.sql`
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: ✅ **"Success. No rows returned"**

### Step 3: Verify the Table Was Created

1. Click **Table Editor** in the left sidebar
2. You should see a new table called **`calls`**
3. Click on it to view its structure

### Step 4: Enable Realtime (Critical!)

1. Still in **Table Editor**, click on the **`calls`** table
2. Look for the **Realtime** toggle at the top
3. Make sure it's **enabled** (turned ON)
4. If not enabled, click to enable it

### Step 5: Redeploy Your Vercel App

Since you've updated the code:

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Add database support for cross-device video call matching"
   git push origin main
   ```

2. Vercel will auto-deploy (or manually redeploy in Vercel dashboard)

### Step 6: Test!

Now test with two different devices:

**Device 1:**
1. Go to your website
2. Click "I Need Help"
3. Click "Start Request"
4. Wait...

**Device 2:**
1. Go to your website  
2. Click "I Want to Help"
3. Click "Start Volunteering"
4. You should immediately see "Incoming Help Request!"
5. Click "Accept"

**Both devices should now connect via video call!** 🎉

## What This Database Table Does

The `calls` table stores:
- **room_id**: Unique identifier for each video call room
- **status**: waiting, accepted, completed, or cancelled
- **helper_id**: The person requesting help
- **volunteer_id**: The volunteer who accepts
- **timestamps**: When created, accepted, completed

This allows devices to communicate across the internet instead of just within the same browser.

## Troubleshooting

### Error: "relation 'calls' does not exist"

**Solution**: You haven't run the SQL migration yet. Go to SQL Editor and run the migration file.

### Error: "Failed to create call request"

**Causes:**
1. SQL migration not run
2. Wrong Supabase credentials in Vercel environment variables
3. Realtime not enabled on the table

**Solutions:**
1. Run the SQL migration (Step 2 above)
2. Check Vercel environment variables match your Supabase project
3. Enable Realtime on the `calls` table (Step 4 above)

### Still Shows "Connecting" Forever

**Check:**
1. Open browser console (F12) on both devices
2. Look for error messages
3. Common errors:
   - "Failed to create call request" → Database not set up
   - "Invalid credentials" → Wrong Supabase env vars
   - No errors but not connecting → Realtime not enabled

### Table Not Showing Up in Table Editor

**Solution**: 
1. Refresh the page
2. Check SQL Editor for any errors when you ran the migration
3. Try running the migration again

## Advanced: Verify Everything Works

Run this test query in SQL Editor:

```sql
-- Test insert
INSERT INTO calls (room_id, status, helper_id)
VALUES ('test_room_123', 'waiting', 'test_helper');

-- Check it was inserted
SELECT * FROM calls WHERE room_id = 'test_room_123';

-- Clean up test data
DELETE FROM calls WHERE room_id = 'test_room_123';
```

If all three queries succeed, your database is set up correctly!

## Database Schema

For reference, here's what the table structure looks like:

```
calls
├── id (UUID, primary key)
├── room_id (TEXT, unique)
├── status (TEXT: 'waiting' | 'accepted' | 'completed' | 'cancelled')
├── helper_id (TEXT, nullable)
├── volunteer_id (TEXT, nullable)
├── created_at (TIMESTAMP)
├── accepted_at (TIMESTAMP, nullable)
├── completed_at (TIMESTAMP, nullable)
└── updated_at (TIMESTAMP)
```

## Automatic Cleanup

The database includes a cleanup function that removes old completed/cancelled calls after 1 hour. This keeps your database clean and performant.

## Security

- Row Level Security (RLS) is enabled
- Public access is allowed since the app doesn't have user authentication
- In production, you should add proper authentication and restrict access

---

**Need Help?** Check the browser console (F12) for error messages and refer to the troubleshooting section above.

