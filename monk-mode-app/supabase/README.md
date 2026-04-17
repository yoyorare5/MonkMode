# Fasting Mode Supabase Setup

Run `schema.sql` in the Supabase SQL editor, then add these Netlify environment variables:

```text
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anon public key>
```

Optional web push foundation:

```text
VITE_VAPID_PUBLIC_KEY=<public VAPID key for PushManager.subscribe>
```

The app stores the active fast, commitments, history, and settings in `fasting_state` under Row Level Security. Browser push subscriptions are stored in `push_subscriptions`.

Full scheduled push delivery still needs a server job or Supabase Edge Function that reads incomplete active fasts near the daily deadline and sends Web Push to saved subscriptions. The client-side permission flow, service worker, warning schedule, and subscription storage are already in place.
