# Supabase Database Setup for Colooky

This guide will help you set up the Supabase database tables and Row Level Security (RLS) policies for your Colooky application.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your environment variables already configured in `.env.local`

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy the entire contents of `supabase_schema.sql` 
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

### Option 2: Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Run: `supabase db push`

## What This Creates

### Tables Created:

1. **user_profiles** - Stores GitHub user information
   - `id` (UUID, Primary Key)
   - `github_id` (Text, Unique) - GitHub user ID
   - `email` (Text, Unique) - User email
   - `name` (Text) - Display name
   - `username` (Text) - GitHub username
   - `avatar_url` (Text) - Profile picture URL
   - `bio` (Text) - User bio
   - `github_access_token` (Text) - OAuth token (encrypted)

2. **user_settings** - Stores user preferences
   - Theme preferences (dark/light/auto)
   - Notification settings (email/push)
   - Privacy settings
   - Visual preferences (animations, high contrast)

3. **analysis_history** - Stores code analysis sessions
   - Repository information
   - Files analyzed
   - Visualization data
   - Timestamps

4. **subscription_plans** - Stores Stripe billing information
   - Stripe customer/subscription IDs
   - Plan types and billing periods
   - Subscription status

### Security Features:

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Automatic user settings creation when profiles are created
- Automatic timestamp updates on record changes

## Testing the Integration

1. **Sign in with GitHub** - This should automatically create a user profile
2. **Visit Settings Page** - Should load settings from Supabase instead of localStorage
3. **Change preferences** - Should save to database and persist across sessions
4. **Check Supabase Dashboard** - You should see data in the user_profiles and user_settings tables

## Troubleshooting

### Common Issues:

1. **"Missing env.SUPABASE_URL" error**
   - Check your `.env.local` file has `SUPABASE_URL` set correctly

2. **"Row Level Security prevents access" error**
   - Make sure RLS policies are properly set up
   - Check that the user is properly authenticated

3. **Settings not saving**
   - Check browser console for API errors
   - Verify `/api/user/settings` endpoint is working
   - Check Supabase logs in the dashboard

### Debug Steps:

1. Check browser console for errors
2. Monitor Supabase logs: Dashboard → Logs → API
3. Test API endpoints directly: `/api/user/settings`
4. Verify environment variables are loaded

## Environment Variables Required

Make sure these are set in your `.env.local`:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps

After database setup:
1. Test user registration and settings
2. Configure Stripe webhooks for billing
3. Test the complete user flow
4. Deploy to production with proper environment variables

---

🎉 **Success!** Your Colooky application now has a real database backend with proper user authentication and settings persistence!