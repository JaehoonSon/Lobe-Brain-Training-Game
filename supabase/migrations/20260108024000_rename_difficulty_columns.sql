-- Rename difficulty_level to difficulty_rating_used (user's target rating)
-- Add avg_question_difficulty (average of served questions)
-- Add avg_response_time_ms (average per-question response time)

ALTER TABLE public.game_sessions
RENAME COLUMN difficulty_level TO difficulty_rating_used;

ALTER TABLE public.game_sessions
ADD COLUMN avg_question_difficulty FLOAT4;

ALTER TABLE public.game_sessions
ADD COLUMN avg_response_time_ms INT4;

-- Backfill: set avg_question_difficulty from metadata if available, otherwise copy from difficulty_rating_used
UPDATE public.game_sessions
SET avg_question_difficulty = COALESCE(
  (metadata->>'avg_question_difficulty')::FLOAT4,
  difficulty_rating_used
);

-- Backfill avg_response_time_ms from metadata if available
UPDATE public.game_sessions
SET avg_response_time_ms = (metadata->>'avg_response_time_ms')::INT4
WHERE metadata->>'avg_response_time_ms' IS NOT NULL;

-- Make avg_question_difficulty NOT NULL after backfill
ALTER TABLE public.game_sessions
ALTER COLUMN avg_question_difficulty SET NOT NULL;

-- avg_response_time_ms stays nullable (some games don't track speed)

-- Add comments explaining the columns
COMMENT ON COLUMN public.game_sessions.difficulty_rating_used IS 'User target rating at session start (from user_game_performance.difficulty_rating)';
COMMENT ON COLUMN public.game_sessions.avg_question_difficulty IS 'Average difficulty (0-10) of questions actually served';
COMMENT ON COLUMN public.game_sessions.avg_response_time_ms IS 'Average response time per question in milliseconds (null for games without speed scoring)';
