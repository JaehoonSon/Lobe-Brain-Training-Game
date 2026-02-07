-- Enable pgmq extension
create extension if not exists pgmq cascade;

-- Enable pg_net for HTTP requests
create extension if not exists pg_net;

-- Add timezone to profiles
alter table public.profiles
add column if not exists timezone text default 'EST';

-- Ensure pg_cron is enabled
create extension if not exists pg_cron with schema extensions;

-- Create the notification queue (Idempotent check)
do $$
begin
  if not exists (
    select from information_schema.tables 
    where table_schema = 'pgmq' 
    and table_name = 'q_notifications'
  ) then
    perform pgmq.create('notifications');
  end if;
end
$$;

-- Main Scheduler Function
-- Schedules messages for the "next 6 PM" in the user's timezone
create or replace function public.schedule_daily_notifications()
returns void
language plpgsql
security definer
as $$
declare
  r record;
  user_tz text;
  now_utc timestamp with time zone := now();
  user_now timestamp without time zone;
  target_time timestamp without time zone;
  send_at timestamp with time zone;
  delay_seconds integer;
begin
  for r in
    select 
      pt.profile_id as user_id,
      pt.expo_push_token,
      coalesce(p.timezone, 'EST') as timezone
    from public.push_tokens pt
    join public.profiles p on pt.profile_id = p.id
    join auth.users u on pt.profile_id = u.id
    where 
      pt.is_active = true
      and u.last_sign_in_at > (now() - interval '5 days')
  loop
    -- 1. Determine local time
    user_tz := r.timezone;
    
    -- Get "now" in the user's timezone
    -- Note: This relies on Postgres knowing the timezone names (iana database)
    user_now := now() at time zone user_tz;
    
    -- 2. Target is 18:00 (6 PM) today
    target_time := date_trunc('day', user_now) + interval '18 hours';
    
    -- If 6 PM has passed locally, schedule for tomorrow 6 PM
    if user_now > target_time then
      target_time := target_time + interval '1 day';
    end if;
    
    -- 3. Convert target back to absolute UTC timestamp
    send_at := target_time at time zone user_tz;
    
    -- 4. Calculate delay in seconds
    delay_seconds := extract(epoch from (send_at - now_utc))::integer;
    
    -- Ensure non-negative delay
    if delay_seconds < 0 then
      delay_seconds := 0;
    end if;

    -- 5. Enqueue job
    perform pgmq.send(
      queue_name => 'notifications',
      msg => jsonb_build_object(
        'to', r.expo_push_token,
        'title', 'Time for your brain training!',
        'body', 'Your daily exercises are ready. Keep your streak alive!',
        'data', jsonb_build_object('url', '/(authenticated)/(tabs)/games')
      ),
      delay => delay_seconds
    );
  end loop;
end;
$$;

-- Securely Trigger Send Notification using Vault
create or replace function public.trigger_send_notification()
returns void
language plpgsql
security definer
as $$
declare
  service_key text;
  project_ref text;
  url text;
begin
  -- 1. Optimization: Check if messages exist before doing anything expensive
  if not exists (select 1 from pgmq.q_notifications where vt <= now() limit 1) then
    return;
  end if;

  -- 2. Get secrets from Vault
  -- Assumes secrets are stored with these exact names
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY' limit 1;
  select decrypted_secret into project_ref from vault.decrypted_secrets where name = 'SUPABASE_PROJECT_ID' limit 1;

  if service_key is null or project_ref is null then
    raise warning 'Missing Supabase secrets (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PROJECT_ID) in Vault';
    return;
  end if;

  -- 3. Construct URL
  url := 'https://' || project_ref || '.supabase.co/functions/v1/send-notification';

  -- 4. Call Edge Function
  perform net.http_post(
    url := url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );
end;
$$;

-- Schedule the Daily Job (Internal SQL only)
select cron.schedule(
  'schedule-daily-notifications',
  '0 0 * * *', -- At 00:00 UTC
  $$ select public.schedule_daily_notifications() $$
);

-- Schedule the Sender Job (Uses Vault)
select cron.schedule(
  'process-notification-queue',
  '* * * * *', -- Every minute
  $$ select public.trigger_send_notification() $$
);

-- wrapper to pop batch
-- wrapper to read batch
create or replace function pop_notifications_batch(
  batch_size integer
)
returns table (
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamp with time zone,
  vt timestamp with time zone,
  message jsonb,
  headers jsonb  -- Added this column to match the 6 columns returned by pgmq.read
)
language plpgsql
security definer
as $$
begin
  return query
  select * from pgmq.read('notifications'::text, 60, batch_size); -- 60s visibility, batch_size qty
end;
$$;

-- wrapper to delete batch
create or replace function delete_notifications_batch(
  msg_ids bigint[]
)
returns void
language plpgsql
security definer
as $$
begin
  perform pgmq.delete('notifications', msg_ids);
end;
$$;
