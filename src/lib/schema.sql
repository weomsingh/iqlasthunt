-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('hunter', 'payer')),
  username text unique not null,
  email text not null,
  nationality text not null check (nationality in ('india', 'global')),
  currency text not null check (currency in ('INR', 'USD')),
  
  -- Hunter-specific fields
  expertise text[],
  bio text,
  portfolio_url text,
  date_of_birth date,
  
  -- Payer-specific fields
  is_organization boolean default false,
  company_name text,
  company_logo_url text,
  
  -- Financial fields
  wallet_balance decimal(10,2) default 0,
  total_earnings decimal(10,2) default 0,
  total_spent decimal(10,2) default 0,
  
  -- Stats
  bounties_won integer default 0,
  bounties_participated integer default 0,
  bounties_posted integer default 0,
  win_rate decimal(5,2) default 0,
  
  -- Metadata
  accepted_covenant boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. BOUNTIES
create table public.bounties (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid references public.profiles not null,
  title text not null,
  description text not null,
  requirements text not null,
  category text not null,
  reward decimal(10,2) not null check (reward >= 999),
  currency text not null,
  stake_amount decimal(10,2) default 10,
  deadline timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  total_slots integer default 12,
  slots_filled integer default 0,
  status text default 'active' check (status in ('active', 'in_progress', 'reviewing', 'completed', 'cancelled')),
  winner_id uuid references public.profiles,
  winner_bonus decimal(10,2) default 0,
  is_funded boolean default false,
  funding_utr text,
  views integer default 0
);

-- 3. BOUNTY PARTICIPANTS
create table public.bounty_participants (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid references public.bounties on delete cascade,
  hunter_id uuid references public.profiles,
  joined_at timestamp with time zone default now(),
  stake_paid boolean default false,
  stake_amount decimal(10,2),
  submitted boolean default false,
  submission_url text,
  submission_notes text,
  submitted_at timestamp with time zone,
  passes_review boolean,
  review_notes text,
  is_winner boolean default false,
  is_runner_up boolean default false,
  refund_amount decimal(10,2) default 0,
  unique(bounty_id, hunter_id)
);

-- 4. TRANSACTIONS
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  type text not null check (type in ('deposit', 'withdrawal', 'stake', 'earning', 'refund', 'bonus')),
  amount decimal(10,2) not null,
  currency text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'completed', 'rejected')),
  utr text,
  upi_id text,
  admin_notes text,
  bounty_id uuid references public.bounties,
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);

-- 5. MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid references public.bounties on delete cascade,
  sender_id uuid references public.profiles,
  message text not null,
  created_at timestamp with time zone default now(),
  deleted boolean default false
);

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.bounties enable row level security;
alter table public.bounty_participants enable row level security;
alter table public.transactions enable row level security;
alter table public.messages enable row level security;

-- Profiles: Public read, self update
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Bounties: Public read, Payer create/update
create policy "Bounties are viewable by everyone." on public.bounties for select using (true);
create policy "Payers can create bounties." on public.bounties for insert with check (auth.uid() = payer_id);
create policy "Payers can update their own bounties." on public.bounties for update using (auth.uid() = payer_id);
