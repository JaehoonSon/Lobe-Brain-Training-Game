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

-- Daily Analytics Email Cron
-- NOTE: You must replace PROJECT_REF and SERVICE_ROLE_KEY or ANON_KEY with actual values.
-- Ideally, use Supabase Dashboard -> Integrations -> Cron to manage Edge Function triggers securely.

select
  cron.schedule(
    'send-daily-analytics-email',
    '0 8 * * *',
    $$
    select
      net.http_post(
        url := 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/functions/v1/send-daily-analytics',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
              select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1
          )
        ),
        body := '{}'::jsonb
      ) as request_id;
    $$
  );

