
-- 1. Enable RLS (Ensure it's on)
alter table public.profiles enable row level security;

-- 2. Drop existing policies to start fresh
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

-- 3. Create new, robust policies

-- ALLOW SELECT: Everyone can read basic profile info (needed for public pages)
create policy "Public profiles are viewable by everyone." 
on public.profiles for select 
using (true);

-- ALLOW INSERT: Authenticated users can create a profile if the ID matches their auth.uid()
create policy "Users can insert their own profile." 
on public.profiles for insert 
with check (
  auth.uid() = id
);

-- ALLOW UPDATE: Users can update their own profile
create policy "Users can update own profile." 
on public.profiles for update 
using (
  auth.uid() = id
);

-- 4. CRITICAL FIX: Grant permissions to authenticated users
-- Sometimes the role itself needs explicit grant
grant all on public.profiles to authenticated;
grant all on public.profiles to service_role;
