-- Migration: Refactor Daily Global Challenge
-- Created: 2026-01-10
-- 
-- Changes:
-- 1. Create a new function `get_daily_challenge()` that picks ONE game for everyone
-- 2. Count real sessions + add simulated buffer
-- 3. Drop the old `get_community_challenge_stats` function (replaced by this)

-- Create/Replace the unified Daily Challenge function
CREATE OR REPLACE FUNCTION public.get_daily_challenge()
RETURNS TABLE (
    game_id TEXT,
    game_name TEXT,
    game_description TEXT,
    sessions_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game_id TEXT;
    v_game_name TEXT;
    v_game_description TEXT;
    v_game_count INTEGER;
    v_day_offset INTEGER;
    v_real_count INTEGER;
    v_simulated_buffer INTEGER;
    v_seed_text TEXT;
    v_hash BIGINT;
BEGIN
    -- 1. Get total number of games
    SELECT COUNT(*)::INTEGER INTO v_game_count FROM public.games;
    
    IF v_game_count = 0 THEN
        RETURN; -- No games available
    END IF;
    
    -- 2. Calculate which game index to pick today (deterministic, same for everyone)
    -- Uses day of year modulo game count
    v_day_offset := (EXTRACT(DOY FROM CURRENT_DATE)::INTEGER % v_game_count);
    
    -- 3. Get today's challenge game (ordered by id for consistency)
    SELECT g.id, g.name, g.description
    INTO v_game_id, v_game_name, v_game_description
    FROM public.games g
    ORDER BY g.id
    LIMIT 1 OFFSET v_day_offset;
    
    -- 4. Count real sessions for this game today
    SELECT COALESCE(COUNT(*), 0)::INTEGER INTO v_real_count
    FROM public.game_sessions
    WHERE game_sessions.game_id = v_game_id
    AND game_sessions.created_at::DATE = CURRENT_DATE;
    
    -- 5. Calculate deterministic simulated buffer (300-800)
    -- Seed = game_id + current_date (same for everyone on same day)
    v_seed_text := v_game_id::TEXT || CURRENT_DATE::TEXT;
    v_hash := ('x' || substr(md5(v_seed_text), 1, 8))::bit(32)::bigint;
    v_simulated_buffer := 300 + (abs(v_hash) % 501); -- Range: 300 to 800
    
    -- 6. Return the challenge info
    RETURN QUERY SELECT 
        v_game_id,
        v_game_name,
        v_game_description,
        v_real_count + v_simulated_buffer;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_daily_challenge() TO authenticated, anon;

-- Note: We keep the old get_community_challenge_stats function for backward compatibility
-- but it's no longer the primary way to get challenge data
