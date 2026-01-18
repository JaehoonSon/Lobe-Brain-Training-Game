-- Seed categories
INSERT INTO public.categories (id, name, description)
VALUES
  ('attention', 'Attention', 'Improve focus and concentration.'),
  ('flexibility', 'Flexibility', 'Switch between tasks efficiently.'),
  ('language', 'Language', 'Word usage and comprehension.'),
  ('math', 'Math', 'Numerical agility and calculation.'),
  ('memory', 'Memory', 'Strengthen recall and retention.'),
  ('problem_solving', 'Problem Solving', 'Logic and reasoning challenges.'),
  ('speed', 'Speed', 'Process information rapidly.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;