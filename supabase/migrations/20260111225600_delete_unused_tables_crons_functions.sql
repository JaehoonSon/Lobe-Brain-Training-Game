-- Migration to delete unused tables, crons, and functions
-- This cleans up legacy scoring mechanisms replaced by global stats

-- 1. Unschedule crons
SELECT cron.unschedule('refresh-ability-scores');
SELECT cron.unschedule('refresh-norm-referenced-scores');

-- 2. Drop functions
DROP FUNCTION IF EXISTS public.refresh_ability_scores();
DROP FUNCTION IF EXISTS public.seed_game_norms();

-- 3. Drop tables
DROP TABLE IF EXISTS public.user_category_ability_scores;
DROP TABLE IF EXISTS public.user_game_ability_history;
DROP TABLE IF EXISTS public.user_game_ability_scores;
DROP TABLE IF EXISTS public.game_ability_norms;
