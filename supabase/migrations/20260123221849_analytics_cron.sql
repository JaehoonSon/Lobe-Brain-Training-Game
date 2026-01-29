CREATE OR REPLACE FUNCTION get_daily_analytics_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_start_time timestamp with time zone := (now() - interval '24 hours');
  report_end_time timestamp with time zone := now();
  
  -- Metrics
  m_total_users bigint;
  m_new_users_24h bigint;
  m_onboarding_completed_total bigint;
  m_onboarding_completed_24h bigint;
  m_total_games_played bigint;
  m_games_played_24h bigint;
  m_active_users_24h bigint;
  m_avg_games_per_active_user numeric;
  
  result json;
BEGIN
  -- User Metrics
  SELECT count(*) INTO m_total_users FROM public.profiles;
  
  SELECT count(*) INTO m_new_users_24h FROM public.profiles
  WHERE created_at >= report_start_time;

  SELECT count(*) INTO m_onboarding_completed_total FROM public.profiles
  WHERE onboarding_completed_at IS NOT NULL;
  
  SELECT count(*) INTO m_onboarding_completed_24h FROM public.profiles
  WHERE onboarding_completed_at >= report_start_time;

  -- Game Metrics
  SELECT count(*) INTO m_total_games_played FROM public.game_sessions;
  
  SELECT count(*) INTO m_games_played_24h FROM public.game_sessions
  WHERE created_at >= report_start_time;
  
  SELECT count(distinct user_id) INTO m_active_users_24h FROM public.game_sessions
  WHERE created_at >= report_start_time;
  
  IF m_active_users_24h > 0 THEN
    m_avg_games_per_active_user := round((m_games_played_24h::numeric / m_active_users_24h::numeric), 2);
  ELSE
    m_avg_games_per_active_user := 0;
  END IF;

  -- Build JSON Result
  result := json_build_object(
    'timeframe', json_build_object(
      'start', report_start_time,
      'end', report_end_time
    ),
    'users', json_build_object(
      'total', m_total_users,
      'new_last_24h', m_new_users_24h,
      'onboarding_completed_total', m_onboarding_completed_total,
      'onboarding_completed_last_24h', m_onboarding_completed_24h
    ),
    'engagement', json_build_object(
      'total_games_played', m_total_games_played,
      'games_played_last_24h', m_games_played_24h,
      'active_users_last_24h', m_active_users_24h,
      'avg_games_per_active_user_last_24h', m_avg_games_per_active_user
    )
  );

  RETURN result;
END;
$$;
