-- Insert Word Unscramble into games table
INSERT INTO public.games (
  id,
  name,
  description,
  instructions,
  category_id,
  is_pro_only,
  is_active,
  recommended_rounds,
  icon_url,
  banner_url
) 
VALUES (
  'word_unscramble',
  'Word Unscramble',
  'Rearrange the scrambled letters to form the correct word.',
  'Tap letters from the pool to move them into the answer slots. Tap a placed letter to return it to the pool. Use the hint if you get stuck!',
  (SELECT id FROM public.categories WHERE name = 'Language' LIMIT 1),
  false,
  true,
  5,
  'brain_solving_puzzle.png', -- Placeholder or reuse existing assets
  'brain_solving_puzzle.png'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  category_id = EXCLUDED.category_id,
  is_active = EXCLUDED.is_active,
  recommended_rounds = EXCLUDED.recommended_rounds;
