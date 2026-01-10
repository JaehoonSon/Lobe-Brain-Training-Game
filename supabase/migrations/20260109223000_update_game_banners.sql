BEGIN;

-- Update banner URLs for games with Supabase Storage URLs
UPDATE games
SET banner_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/memory_matrix_game.jpg'
WHERE id = 'memory_matrix';

UPDATE games
SET banner_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/mental_arithmetic_game.jpg'
WHERE id = 'mental_arithmetic';

UPDATE games
SET banner_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/mental-language-discrimination-game.jpg'
WHERE id = 'mental_language_discrimination';

UPDATE games
SET banner_url = 'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/wordle-game.jpg'
WHERE id = 'wordle';

COMMIT;
