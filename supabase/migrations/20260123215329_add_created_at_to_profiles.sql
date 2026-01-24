-- 1. Add column if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- 2. Backfill only rows that still need it
UPDATE public.profiles t
SET created_at = u.created_at
FROM auth.users u
WHERE t.id = u.id
  AND t.created_at IS NULL;

-- 3. Ensure default is set (safe to run multiple times)
ALTER TABLE public.profiles
ALTER COLUMN created_at SET DEFAULT now();
