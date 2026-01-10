BEGIN;

-- Update icon URLs for games with Supabase Storage square icons
UPDATE games
SET icon_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/memory-matrix-square.png'
WHERE id = 'memory_matrix';

UPDATE games
SET icon_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/mental-arithmetic-square.png'
WHERE id = 'mental_arithmetic';

UPDATE games
SET icon_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/mental-language-discrimination-square.png'
WHERE id = 'mental_language_discrimination';

UPDATE games
SET icon_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/wordle-square.png'
WHERE id = 'wordle';

COMMIT;
