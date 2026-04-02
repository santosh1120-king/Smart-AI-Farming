create table if not exists public.users (
    id text primary key,
    name text not null,
    email text not null unique,
    hashed_password text not null,
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
    crop_type text default 'All',
    apply_link text not null,
    ministry text not null,
    deadline text,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_crop_analyses_user_created_at
    on public.crop_analyses (user_id, created_at desc);

create index if not exists idx_notifications_user_read
    on public.notifications (user_id, read);

create index if not exists idx_voice_logs_user_created_at
    on public.voice_logs (user_id, created_at desc);

create index if not exists idx_weather_data_user_timestamp
    on public.weather_data (user_id, timestamp desc);
