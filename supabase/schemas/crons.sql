select
  cron.schedule (
    'process-daily-game-performance-snapshot',
    '0 0 * * *',
    $$ select public.zzz_process_daily_game_performance_snapshot() $$
  );

select
  cron.schedule (
    'process-daily-global-game-performance-snapshot',
    '30 0 * * *',
    $$ select public.zzz_process_daily_global_game_performance_snapshot() $$
  );
