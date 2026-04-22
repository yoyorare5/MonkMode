# Fasting Mode

Fasting Mode is a Vite + React app in `monk-mode-app`.

## Current App Path

- App folder: `monk-mode-app`
- Build command: `npm --prefix monk-mode-app run build`
- Build output: `monk-mode-app/dist`

## Cloudflare Pages Hosting

Use Cloudflare Pages for the long-term personal deployment.

Cloudflare import settings:

```txt
Framework preset: Vite
Root directory: /
Build command: npm --prefix monk-mode-app run build
Build output directory: monk-mode-app/dist
Node version: 22
```

Environment variables to add in Cloudflare Pages:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_VAPID_PUBLIC_KEY
```

The repo includes Cloudflare-compatible files:

- `wrangler.toml` points Pages at `monk-mode-app/dist`.
- `monk-mode-app/public/_redirects` keeps hard-refresh and installed PWA routes working.
- `monk-mode-app/public/_headers` keeps security, asset cache, service worker, and manifest headers sane.

After Cloudflare creates the site, add the Cloudflare URL to Supabase Auth:

```txt
Site URL: https://YOUR-CLOUDFLARE-PAGES-DOMAIN.pages.dev
Redirect URLs:
https://YOUR-CLOUDFLARE-PAGES-DOMAIN.pages.dev
https://YOUR-CLOUDFLARE-PAGES-DOMAIN.pages.dev/*
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
