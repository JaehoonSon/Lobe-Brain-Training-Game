-- Drop/Replace function to fix return type mismatch (real vs numeric)
CREATE OR REPLACE FUNCTION get_game_questions(
  p_game_id TEXT,
  p_count INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content JSONB,
  difficulty NUMERIC,
  pool_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_difficulty_rating NUMERIC;
  v_recommended_rounds INTEGER;
  v_target_count INTEGER;
  v_core_count INTEGER;
  v_stretch_count INTEGER;
  v_core_min NUMERIC;
  v_core_max NUMERIC;
  v_stretch_min NUMERIC;
  v_stretch_max NUMERIC;
BEGIN
  -- 1. Get current user
  v_user_id := auth.uid();
  
  -- 2. Get user's difficulty rating
  -- Default to 2 if no performance record exists
  SELECT COALESCE(difficulty_rating, 2)
  INTO v_difficulty_rating
  FROM user_game_performance
  WHERE user_id = v_user_id AND game_id = p_game_id;

  IF v_difficulty_rating IS NULL THEN
    v_difficulty_rating := 2;
  END IF;

  -- 3. Determine target count
  IF p_count IS NOT NULL THEN
    v_target_count := p_count;
  ELSE
    SELECT recommended_rounds
    INTO v_recommended_rounds
    FROM games
    WHERE games.id = p_game_id;
    
    v_target_count := COALESCE(v_recommended_rounds, 8);
  END IF;

  -- 4. Calculate Core vs Stretch counts
  -- Core: 75% (minimum 1)
  v_core_count := GREATEST(1, ROUND(v_target_count * 0.75));
  -- Stretch: Remainder (can be 0)
  v_stretch_count := GREATEST(0, v_target_count - v_core_count);

  -- 5. Define Difficulty Ranges
  v_core_min := GREATEST(0, v_difficulty_rating - 0.5);
  v_core_max := LEAST(10, v_difficulty_rating + 0.5);
  v_stretch_min := LEAST(10, v_difficulty_rating + 0.8);
  v_stretch_max := LEAST(10, v_difficulty_rating + 1.5);

  -- 6. Execute Query with ordered pools and EXPLICIT CAST to NUMERIC
  RETURN QUERY
  WITH core_questions AS (
    SELECT q.id, q.content, q.difficulty::NUMERIC, 'core'::TEXT as pool_type
    FROM questions q
    WHERE q.game_id = p_game_id
      AND q.difficulty >= v_core_min 
      AND q.difficulty <= v_core_max
    ORDER BY random()
    LIMIT v_core_count
  ),
  stretch_questions AS (
    SELECT q.id, q.content, q.difficulty::NUMERIC, 'stretch'::TEXT as pool_type
    FROM questions q
    WHERE q.game_id = p_game_id
      AND q.difficulty >= v_stretch_min 
      AND q.difficulty <= v_stretch_max
    ORDER BY random()
    LIMIT v_stretch_count
  )
  -- Combine and enforce order: Core -> Stretch
  SELECT * FROM core_questions
  UNION ALL
  SELECT * FROM stretch_questions;

END;
$$;
