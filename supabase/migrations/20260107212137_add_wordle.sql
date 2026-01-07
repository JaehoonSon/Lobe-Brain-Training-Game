BEGIN;

INSERT INTO games (
  id,
  category_id,
  name,
  description,
  instructions,
  icon_url,
  banner_url,
  is_active
) VALUES
(
  'wordle',
  'language',
  'Wordle',
  'Guess the hidden word by using letter clues from each attempt.',
  'You have a limited number of guesses to find the secret word. After each guess, letters will be highlighted: green means correct position, yellow means the letter exists but in a different position, and gray means the letter is not in the word.',
  'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/icon.png',
  'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/banner.jpg',
  true
)
ON CONFLICT (id) DO UPDATE SET
  category_id  = EXCLUDED.category_id,
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  icon_url     = EXCLUDED.icon_url,
  banner_url   = EXCLUDED.banner_url,
  is_active    = EXCLUDED.is_active;

COMMIT;
