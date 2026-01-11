CREATE OR REPLACE FUNCTION "public"."update_user_game_performance_from_session"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  acc float4;
  target_acc float4 := 0.80;
  error float4;
  delta float4;
  next_rating float4;
  old_rating float4;
BEGIN
  IF NEW.user_id IS NULL OR NEW.game_id IS NULL THEN
    RETURN NEW;
  END IF;

  acc := COALESCE(NEW.correct_count::float4 / NULLIF(NEW.total_questions, 0), 0);

  old_rating := COALESCE(
    (SELECT difficulty_rating FROM public.user_game_performance
     WHERE user_id = NEW.user_id AND game_id = NEW.game_id),
    COALESCE(NEW.difficulty_rating_used, 3.0)
  );

  error := acc - target_acc;
  delta := GREATEST(-0.6, LEAST(0.6, error)) * 1.5;
  next_rating := LEAST(10.0, GREATEST(1.0, old_rating + delta));

  INSERT INTO public.user_game_performance (
    user_id, game_id, difficulty_rating,
    games_played_count, highest_score, total_score, last_played_at
  )
  VALUES (
    NEW.user_id, NEW.game_id, next_rating,
    1, NEW.score, NEW.score, NEW.created_at
  )
  ON CONFLICT (user_id, game_id) DO UPDATE SET
    games_played_count = public.user_game_performance.games_played_count + 1,
    highest_score = GREATEST(COALESCE(public.user_game_performance.highest_score, EXCLUDED.highest_score), EXCLUDED.highest_score),
    total_score = public.user_game_performance.total_score + EXCLUDED.total_score,
    last_played_at = EXCLUDED.last_played_at,
    difficulty_rating = next_rating;

  RETURN NEW;
END;$$;
