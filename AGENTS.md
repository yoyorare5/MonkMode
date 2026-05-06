# Fasting Mode Repo Rules

## App Location
- Real deployed app folder: `monk-mode-app`.
- Framework: Vite + React.
- Styling: Tailwind CSS plus app-specific CSS in `monk-mode-app/src/index.css`.
- Persistence: browser `localStorage`; preserve existing keys and migrate forward safely.

## Deploy Commands
- Build command: `npm --prefix monk-mode-app run build`.
- Publish directory: `monk-mode-app/dist`.
- Do not change the app folder or publish directory.

## Local Commands
- `npm --prefix monk-mode-app run build`
- `npm --prefix monk-mode-app run test:smoke`
- `npm --prefix monk-mode-app run lint`

## Product Direction
- Fasting Mode is a Christ-centered fasting and discipline operating system.
- Keep strict fasting commitments visually and logically primary.
- XP/actions/goals support execution but must not weaken the strict fast.
- Visual direction: mobile-first 9:16, premium dark iOS, glassmorphism, neon cyan/blue/lime accents, serious and disciplined tone.

## Engineering Rules
- Do not add dependencies unless clearly needed.
- Preserve existing user progress through migrations.
- Do not reintroduce Supabase/auth unless explicitly requested.
- Keep the app installable and iPhone-first.
