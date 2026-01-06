INSERT INTO categories (id, name, description, theme)
VALUES
('memory', 'Memory', 'Training for short-term and working memory.',
 '{"color_hex":"#7C8CFF","icon_key":"grid"}'::jsonb),
('math', 'Math', 'Mental calculation and numerical reasoning.',
 '{"color_hex":"#4CAF50","icon_key":"numbers"}'::jsonb),
('language', 'Language', 'Word usage and comprehension.',
 '{"color_hex":"#FF9800","icon_key":"chat"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
