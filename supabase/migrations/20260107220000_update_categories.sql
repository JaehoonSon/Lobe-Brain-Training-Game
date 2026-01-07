INSERT INTO categories (id, name, description, theme)
VALUES
('speed', 'Speed', 'Process information rapidly.', '{"color_hex":"#FF5722","icon_key":"zap"}'::jsonb),
('memory', 'Memory', 'Strengthen recall and retention.', '{"color_hex":"#7C8CFF","icon_key":"grid"}'::jsonb),
('attention', 'Attention', 'Improve focus and concentration.', '{"color_hex":"#FFC107","icon_key":"eye"}'::jsonb),
('flexibility', 'Flexibility', 'Switch between tasks efficiently.', '{"color_hex":"#9C27B0","icon_key":"shuffle"}'::jsonb),
('problem_solving', 'Problem Solving', 'Logic and reasoning challenges.', '{"color_hex":"#00BCD4","icon_key":"puzzle"}'::jsonb),
('math', 'Math', 'Numerical agility and calculation.', '{"color_hex":"#4CAF50","icon_key":"numbers"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    theme = EXCLUDED.theme;
