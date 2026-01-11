-- Create global_game_performance_history table
create table if not exists public.global_game_performance_history (
    id uuid primary key default gen_random_uuid(),
    game_id text references public.games(id) on delete cascade not null,
    difficulty_rating float4 not null,
    games_played_count int4 not null,
    highest_score int4,
    total_score int4 not null,
    snapshot_date date not null default current_date,
    created_at timestamptz default now()
);

-- Add unique constraint for daily snapshots per game
alter table public.global_game_performance_history 
    add constraint uq_global_game_perf_history_daily 
    unique (game_id, snapshot_date);

-- Enable RLS
alter table public.global_game_performance_history enable row level security;

-- Policy: Everyone can read global history (public data)
create policy "Everyone can read global performance history"
    on public.global_game_performance_history
    for select
    to authenticated, anon
    using (true);

-- Function to snapshot global performance data (Averages)
create or replace function public.process_daily_global_game_performance_snapshot()
returns void as $$
begin
    insert into public.global_game_performance_history (
        game_id,
        difficulty_rating,
        games_played_count,
        highest_score,
        total_score,
        snapshot_date
    )
    select
        game_id,
        round(avg(difficulty_rating)::numeric, 2) as difficulty_rating,
        round(avg(games_played_count)) as games_played_count,
        round(avg(highest_score)) as highest_score,
        round(avg(total_score)) as total_score,
        current_date as snapshot_date
    from
        public.user_game_performance
    group by
        game_id
    on conflict (game_id, snapshot_date) do nothing;
end;
$$ language plpgsql;

-- Schedule the cron job to run daily at 00:30 (after the user snapshot job at 00:00)
select cron.schedule(
    'process-daily-global-game-performance-snapshot', -- job name
    '30 0 * * *', -- cron schedule (daily at 00:30)
    $$ select public.process_daily_global_game_performance_snapshot() $$
);
