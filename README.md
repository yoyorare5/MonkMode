# Fasting Mode

Fasting Mode is a Vite + React app in `monk-mode-app`.

## Current App Path

- App folder: `monk-mode-app`
- Build command: `npm --prefix monk-mode-app run build`
- Build output: `monk-mode-app/dist`

## Cloudflare Workers Hosting

Cloudflare's current Workers & Pages flow can host this app as a Worker with static assets.

Worker build settings:

```txt
Project name: fasting-mode
Root directory: /
Build command: npm --prefix monk-mode-app run build
Deploy command: npx wrangler deploy
Non-production branch deploy command: npx wrangler deploy
Path: /
Node version: 22
```

Environment variables to add:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_VAPID_PUBLIC_KEY
```

`VITE_VAPID_PUBLIC_KEY` is optional until production push reminders are fully wired.

The repo includes Cloudflare-compatible files:

- `wrangler.toml` deploys `monk-mode-app/dist` through Cloudflare Workers static assets.
- `monk-mode-app/public/_redirects` keeps hard-refresh and installed PWA routes working on static hosts.
- `monk-mode-app/public/_headers` keeps security, asset cache, service worker, and manifest headers sane on static hosts that support it.

After Cloudflare creates the site, add the Worker URL to Supabase Auth:

```txt
Site URL: https://fasting-mode.youssefkareem1410.workers.dev
Redirect URLs:
https://fasting-mode.youssefkareem1410.workers.dev
https://fasting-mode.youssefkareem1410.workers.dev/*
```

If you attach a custom domain, also add:

```txt
https://yourdomain.com
https://yourdomain.com/*
```

## Existing Netlify Compatibility

The existing Netlify deploy path is still supported by `netlify.toml`:

```txt
Build command: npm --prefix monk-mode-app run build
Publish directory: monk-mode-app/dist
```
