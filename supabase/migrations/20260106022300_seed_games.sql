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

-- ======================
-- MEMORY
-- ======================
(
  'memory_matrix',
  'memory',
  'Memory Matrix',
  'Test and improve your visual working memory by remembering patterns on a grid.',
  'A grid of tiles will briefly light up in a pattern. Memorize the pattern before it disappears. When the grid resets, tap the tiles that were highlighted. Patterns become larger and more complex as you progress.',
  'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/icon.png',
  'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/banner.jpg',
  true
),

-- ======================
-- MATH
-- ======================
(
  'mental_arithmetic',
  'math',
  'Mental Arithmetic',
  'Solve math problems quickly and accurately using only mental calculation.',
  'You will be shown a math problem. Calculate the answer mentally and select or enter the correct result. Answer as quickly and accurately as possible. Difficulty and speed increase over time.',
  'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/icon.png',
  'https://rvpbpvbzmtwkmbcxegmg.supabase.co/storage/v1/object/public/game-assets/banner.jpg',
  true
),

-- ======================
-- LANGUAGE
-- ======================
(
  'mental_language_discrimination',
  'language',
  'Language Discrimination',
  'Improve language precision by choosing the correct word or phrase in context.',
  'You will see a sentence with a missing word or phrase. Select the option that best completes the sentence. Pay attention to grammar, meaning, and subtle differences between choices.',
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
