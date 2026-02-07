-- Rename original function to get_user_details and accept user_id param
CREATE OR REPLACE FUNCTION get_user_details(p_user_id uuid)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  result json;
BEGIN
  current_user_id := p_user_id;

  IF current_user_id IS NULL THEN
     RETURN NULL;
  END IF;

  WITH
  -- Profile Information
  profile_info AS (
    SELECT last_active_at 
    FROM profiles 
    WHERE id = current_user_id
  ),
  
  -- Streak Information
  streak_info AS (
    SELECT current_streak, best_streak, last_played_date 
    FROM user_streaks 
    WHERE user_id = current_user_id
  ),
  
  -- Global Stats
  global_stats AS (
    SELECT ability_score 
    FROM user_global_ability_scores 
    WHERE user_id = current_user_id
  ),
  
  -- Global Score History
  global_score_history AS (
    SELECT json_agg(
      json_build_object(
        'date', snapshot_date, 
        'score', ability_score
      ) ORDER BY snapshot_date
    ) as history
    FROM user_global_ability_history 
    WHERE user_id = current_user_id
  ),
  
  -- Category Stats and History
  category_stats_cte AS (
    SELECT 
      json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'score', ucas.ability_score,
          'history', (
            SELECT json_agg(
              json_build_object(
                'date', h.snapshot_date, 
                'score', h.ability_score
              ) ORDER BY h.snapshot_date
            )
            FROM user_category_ability_history h
            WHERE h.category_id = c.id AND h.user_id = current_user_id
          )
        )
      ) as stats
    FROM user_category_ability_scores ucas
    JOIN categories c ON ucas.category_id = c.id
    WHERE ucas.user_id = current_user_id
  ),
  
  -- Game Performance Stats
  game_stats_cte AS (
    SELECT 
      json_agg(
        json_build_object(
          'id', g.id,
          'name', g.name,
          'score', COALESCE(ugas.ability_score, 0),
          'percentile', COALESCE(ugas.percentile, 0),
          'total_score', COALESCE(ugp.total_score, 0),
          'high_score', COALESCE(ugp.highest_score, 0),
          'games_played', COALESCE(ugp.games_played_count, 0)
        )
      ) as stats
    FROM games g
    LEFT JOIN user_game_ability_scores ugas ON ugas.game_id = g.id AND ugas.user_id = current_user_id
    LEFT JOIN user_game_performance ugp ON ugp.game_id = g.id AND ugp.user_id = current_user_id
    WHERE ugas.user_id IS NOT NULL OR ugp.user_id IS NOT NULL
  ),
  
  -- Most Played Games (Favorite Games)
  favorite_games_cte AS (
    SELECT 
      json_agg(
        json_build_object(
          'id', sub.game_id,
          'name', sub.name,
          'play_count', sub.play_count
        )
      ) as games
    FROM (
      SELECT g.id as game_id, g.name, count(gs.id) as play_count
      FROM game_sessions gs
      JOIN games g ON gs.game_id = g.id
      WHERE gs.user_id = current_user_id
      GROUP BY g.id, g.name
      ORDER BY play_count DESC
      LIMIT 5
    ) sub
  )

  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM profile_info p),
    'streaks', (SELECT row_to_json(s) FROM streak_info s),
    'global_stats', (
      SELECT json_build_object(
        'current_score', (SELECT ability_score FROM global_stats),
        'history', (SELECT history FROM global_score_history)
      )
    ),
    'category_stats', (SELECT stats FROM category_stats_cte),
    'game_stats', (SELECT stats FROM game_stats_cte),
    'favorite_games', (SELECT games FROM favorite_games_cte)
  ) INTO result;

  RETURN result;
END;
$$;


-- Create new summary function for dashboard trends
CREATE OR REPLACE FUNCTION get_user_summary(p_user_id uuid)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  result json;
  
  -- Variables for calculations
  var_current_score numeric;
  var_score_7_days_ago numeric;
  var_global_percentile numeric;
  
  var_games_this_week int;
  var_games_last_week int;
  
  var_top_category_id text;
  var_top_category_name text;
  var_top_category_score numeric;
  var_top_category_percentile numeric;
BEGIN
  current_user_id := p_user_id;

  IF current_user_id IS NULL THEN RETURN NULL; END IF;

  -- 1. Global Stats
  SELECT ability_score INTO var_current_score
  FROM user_global_ability_scores
  WHERE user_id = current_user_id;

  -- Score 7 days ago (nearest snapshot on or before 7 days ago)
  SELECT ability_score INTO var_score_7_days_ago
  FROM user_global_ability_history
  WHERE user_id = current_user_id
    AND snapshot_date <= (CURRENT_DATE - INTERVAL '7 days')::date
  ORDER BY snapshot_date DESC
  LIMIT 1;
  
  -- Calculate Global Percentile rank
  WITH total_count AS (SELECT count(*) as cnt FROM user_global_ability_scores),
       lower_count AS (SELECT count(*) as cnt FROM user_global_ability_scores WHERE ability_score < var_current_score)
  SELECT 
    CASE 
      WHEN (SELECT cnt FROM total_count) = 0 THEN 0
      ELSE ((SELECT cnt FROM lower_count)::numeric / (SELECT cnt FROM total_count) * 100)
    END INTO var_global_percentile;

  -- 2. Activity Stats
  SELECT count(*) INTO var_games_this_week
  FROM game_sessions
  WHERE user_id = current_user_id
    AND created_at >= (now() - INTERVAL '7 days');

  SELECT count(*) INTO var_games_last_week
  FROM game_sessions
  WHERE user_id = current_user_id
    AND created_at >= (now() - INTERVAL '14 days')
    AND created_at < (now() - INTERVAL '7 days');

  -- 3. Top Category
  SELECT 
    c.id, c.name, s.ability_score
  INTO var_top_category_id, var_top_category_name, var_top_category_score
  FROM user_category_ability_scores s
  JOIN categories c ON s.category_id = c.id
  WHERE s.user_id = current_user_id
  ORDER BY s.ability_score DESC
  LIMIT 1;

  -- Calculate Top Category Percentile
  IF var_top_category_id IS NOT NULL THEN
     WITH total_cat_count AS (SELECT count(*) as cnt FROM user_category_ability_scores WHERE category_id = var_top_category_id),
          lower_cat_count AS (SELECT count(*) as cnt FROM user_category_ability_scores WHERE category_id = var_top_category_id AND ability_score < var_top_category_score)
     SELECT 
       CASE 
         WHEN (SELECT cnt FROM total_cat_count) = 0 THEN 0
         ELSE ((SELECT cnt FROM lower_cat_count)::numeric / (SELECT cnt FROM total_cat_count) * 100)
       END INTO var_top_category_percentile;
  END IF;

  -- Construct Result
  SELECT json_build_object(
    'profile', (SELECT json_build_object('last_active_at', last_active_at) FROM profiles WHERE id = current_user_id),
    'global_stats', json_build_object(
      'current_score', COALESCE(var_current_score, 0),
      'weekly_change_percent', CASE 
                                 WHEN var_score_7_days_ago IS NULL OR var_score_7_days_ago = 0 THEN 0 
                                 ELSE round(((var_current_score - var_score_7_days_ago) / var_score_7_days_ago * 100), 1)
                               END,
      'percentile', round(COALESCE(var_global_percentile, 0), 1)
    ),
    'top_category', CASE 
                      WHEN var_top_category_id IS NOT NULL THEN
                        json_build_object(
                          'id', var_top_category_id,
                          'name', var_top_category_name,
                          'score', var_top_category_score,
                          'percentile', round(COALESCE(var_top_category_percentile, 0), 1)
                        )
                      ELSE NULL
                    END,
    'activity', json_build_object(
      'games_played_this_week', var_games_this_week,
      'volume_change_percent', CASE 
                                 WHEN var_games_last_week = 0 THEN 
                                    CASE WHEN var_games_this_week > 0 THEN 100 ELSE 0 END 
                                 ELSE round(((var_games_this_week - var_games_last_week)::numeric / var_games_last_week * 100), 1)
                               END
    )
  ) INTO result;

  RETURN result;
END;
$$;
