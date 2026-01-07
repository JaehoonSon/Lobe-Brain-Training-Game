-- Add onboarding_data JSONB column to store all onboarding form data
ALTER TABLE public.profiles
ADD COLUMN onboarding_data jsonb DEFAULT NULL;

-- Add a comment describing the column purpose
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Stores all collected onboarding data as a JSON object';
