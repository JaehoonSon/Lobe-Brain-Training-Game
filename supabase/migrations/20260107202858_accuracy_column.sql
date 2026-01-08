-- Migration: Replace is_correct (boolean) with accuracy (float) in game_answers
-- This allows partial credit scoring (e.g., 4/5 tiles correct = 0.8)

-- 1. Add new accuracy column
ALTER TABLE game_answers ADD COLUMN accuracy real;

-- 2. Migrate existing data (is_correct -> accuracy)
UPDATE game_answers SET accuracy = CASE WHEN is_correct THEN 1.0 ELSE 0.0 END;

-- 3. Make accuracy NOT NULL after data migration
ALTER TABLE game_answers ALTER COLUMN accuracy SET NOT NULL;

-- 4. Drop old is_correct column
ALTER TABLE game_answers DROP COLUMN is_correct;
