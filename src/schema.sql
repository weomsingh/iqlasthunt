-- Copy this updated script and run it in the Supabase SQL Editor

-- 1. Create tables (only if they don't exist)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text,
  username text unique,
  nationality text,
  currency text,
  accepted_covenant boolean default false,
  wallet_balance numeric default 0,
  total_earnings numeric default 0,
  expertise text[],
  bio text,
  date_of_birth date,
  is_organization boolean default false,
  company_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.bounties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  reward numeric not null,
  currency text not null,
  status text default 'active',
  payer_id uuid references public.profiles(id),
  description text,
  requirements text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (safe to run multiple times)
alter table public.profiles enable row level security;
alter table public.bounties enable row level security;

-- 3. Drop existing policies to avoid conflicts (clean start)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

-- 4. Re-create Policies
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select 
  using ( true );

create policy "Users can insert their own profile." 
  on public.profiles for insert 
  with check ( auth.uid() = id );

create policy "Users can update own profile." 
  on public.profiles for update 
  using ( auth.uid() = id );

-- Bounties policies
drop policy if exists "Bounties are viewable by everyone." on public.bounties;
drop policy if exists "Payers can create bounties." on public.bounties;

create policy "Bounties are viewable by everyone." 
  on public.bounties for select 
  using ( true );

create policy "Payers can create bounties." 
  on public.bounties for insert 
  with check ( auth.uid() = payer_id );
