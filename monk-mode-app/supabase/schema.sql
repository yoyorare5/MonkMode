-- Fasting Mode Supabase schema.
-- Run this in the Supabase SQL editor before enabling Netlify env vars.

create extension if not exists pgcrypto;

create table if not exists public.fasting_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.fasting_state enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own fasting state" on public.fasting_state;
create policy "Users manage own fasting state"
on public.fasting_state
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions"
on public.push_subscriptions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists push_subscriptions_user_enabled_idx
on public.push_subscriptions (user_id, enabled);
