# Admin Panel Setup Guide

## Required Environment Variable

The admin panel now uses **service role key** to bypass RLS policies and access all data.

### Add Service Role Key

Add this to your `.env.local` file (or your environment variables):

```
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### How to Get Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Find **service_role** key (NOT the anon key)
4. Copy it and add it to your `.env.local` file

### Important Security Note

⚠️ **NEVER commit the service role key to git!**

- The service role key bypasses ALL RLS policies
- It has full access to your database
- Only use it in server-side code or secure environments
- In this case, it's used client-side but ONLY after verifying the user is admin via `isAdmin()` function

### What Changed

The admin functions (`getAllUsers`, `getAllAnalyses`, `getAllVideos`, `getAdminStats`) now:
1. First check if the user is admin using `isAdmin()`
2. If admin, use service role client to bypass RLS
3. If not admin, return empty array
4. If service role key is missing, fallback to regular client

This ensures the admin panel works even if RLS policies have issues.
