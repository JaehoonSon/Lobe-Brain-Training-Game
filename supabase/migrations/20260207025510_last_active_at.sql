-- Add last_active_at column to profiles table
alter table public.profiles
add column if not exists last_active_at timestamptz;

-- Add index for querying active users
create index if not exists idx_profiles_last_active_at
on public.profiles (last_active_at);
