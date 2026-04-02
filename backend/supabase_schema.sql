-- Smart AI Farming - Fresh Supabase setup
-- Paste this whole file into Supabase SQL Editor and run it once.
-- This schema is designed for the current backend, which uses the service-role key.

create extension if not exists pgcrypto;

create table if not exists public.users (
    id text primary key,
    name text not null,
    email text not null unique,
    hashed_password text not null default '',
    state text,
    phone text,
    fcm_token text,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crop_analyses (
    id text primary key,
    user_id text not null references public.users(id) on delete cascade,
    image_url text not null,
    public_id text not null,
    analysis jsonb not null,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weather_data (
    id text primary key,
    user_id text not null references public.users(id) on delete cascade,
    lat double precision not null,
    lon double precision not null,
    data jsonb not null,
    timestamp timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
    id text primary key,
    user_id text not null references public.users(id) on delete cascade,
    title text not null,
    body text,
    type text not null,
    read boolean not null default false,
    sent_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.voice_logs (
    id text primary key,
    user_id text not null references public.users(id) on delete cascade,
    query text not null,
    response text not null,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.government_schemes (
    id text primary key,
    name text not null,
    description text not null,
    benefits text not null,
    eligibility text not null,
    state text not null,
    crop_type text not null default 'All',
    apply_link text not null,
    ministry text not null,
    deadline text,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_users_email
    on public.users (email);

create index if not exists idx_crop_analyses_user_created_at
    on public.crop_analyses (user_id, created_at desc);

create index if not exists idx_notifications_user_read
    on public.notifications (user_id, read);

create index if not exists idx_notifications_user_sent_at
    on public.notifications (user_id, sent_at desc);

create index if not exists idx_voice_logs_user_created_at
    on public.voice_logs (user_id, created_at desc);

create index if not exists idx_weather_data_user_timestamp
    on public.weather_data (user_id, timestamp desc);

create index if not exists idx_government_schemes_state
    on public.government_schemes (state);

create index if not exists idx_government_schemes_crop_type
    on public.government_schemes (crop_type);

alter table public.users enable row level security;
alter table public.crop_analyses enable row level security;
alter table public.weather_data enable row level security;
alter table public.notifications enable row level security;
alter table public.voice_logs enable row level security;
alter table public.government_schemes enable row level security;

drop policy if exists "deny_all_users" on public.users;
drop policy if exists "deny_all_crop_analyses" on public.crop_analyses;
drop policy if exists "deny_all_weather_data" on public.weather_data;
drop policy if exists "deny_all_notifications" on public.notifications;
drop policy if exists "deny_all_voice_logs" on public.voice_logs;
drop policy if exists "deny_all_government_schemes" on public.government_schemes;

create policy "deny_all_users"
on public.users
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny_all_crop_analyses"
on public.crop_analyses
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny_all_weather_data"
on public.weather_data
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny_all_notifications"
on public.notifications
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny_all_voice_logs"
on public.voice_logs
for all
to anon, authenticated
using (false)
with check (false);

create policy "deny_all_government_schemes"
on public.government_schemes
for all
to anon, authenticated
using (false)
with check (false);

-- Optional: if you want government schemes to be readable directly from the frontend later,
-- remove the deny policy above and replace it with:
--
-- drop policy if exists "deny_all_government_schemes" on public.government_schemes;
-- create policy "public_read_government_schemes"
-- on public.government_schemes
-- for select
-- to anon, authenticated
-- using (true);
