-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Create user_game_performance_history table
create table if not exists public.user_game_performance_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    game_id text references public.games(id) on delete cascade not null,
    difficulty_rating float4 not null,
    games_played_count int4 not null,
    highest_score int4,
    total_score int4 not null,
    last_played_at timestamptz,
    perf_created_at timestamptz,
    snapshot_date date not null default current_date,
    created_at timestamptz default now()
);

-- Add unique constraint for daily snapshots per user per game
alter table public.user_game_performance_history 
    add constraint uq_user_game_perf_history_daily 
    unique (user_id, game_id, snapshot_date);

-- Enable RLS
alter table public.user_game_performance_history enable row level security;

-- Policy: Users can read their own performance history
create policy "Users can read their own performance history"
    on public.user_game_performance_history
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Function to snapshot performance data
create or replace function public.process_daily_game_performance_snapshot()
returns void as $$
begin
    insert into public.user_game_performance_history (
        user_id,
        game_id,
        difficulty_rating,
        games_played_count,
        highest_score,
        total_score,
        last_played_at,
        perf_created_at,
        snapshot_date
    )
    select
        user_id,
        game_id,
        difficulty_rating,
        games_played_count,
        highest_score,
        total_score,
        last_played_at,
        created_at as perf_created_at,
        current_date as snapshot_date
    from
        public.user_game_performance
    on conflict (user_id, game_id, snapshot_date) do nothing;
end;
$$ language plpgsql;

-- Schedule the cron job to run daily at midnight
select cron.schedule(
    'process-daily-game-performance-snapshot', -- job name
    '0 0 * * *', -- cron schedule (daily at midnight)
    $$ select public.process_daily_game_performance_snapshot() $$
);
