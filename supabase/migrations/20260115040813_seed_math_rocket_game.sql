-- 1. Insert the Game (if not compatible, manually check ID)
INSERT INTO games (id, name, description, category_id, icon_url, instructions, recommended_rounds, is_active, is_pro_only)
VALUES (
    'math_rocket', 
    'Math Rocket', 
    'Keep your rocket afloat by solving math problems! Be quick!', 
    'math', 
    'rocket', 
    'Answer math questions to boost your rocket. Don''t let it crash!', 
    3, 
    true, 
    false
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    instructions = EXCLUDED.instructions,
    recommended_rounds = EXCLUDED.recommended_rounds,
    is_active = EXCLUDED.is_active;

-- 2. Clean up old questions for this game to avoid duplicates or stale data
DELETE FROM questions WHERE game_id = 'math_rocket';

-- 3. We will populate questions via the node script or seperate migration. 
-- Since I need to generate the seed content from the JSON files I just created.
-- I'll use the 'scripts/generate-seed-sql.ts' which the user has set up for this purpose (implied by file list).
