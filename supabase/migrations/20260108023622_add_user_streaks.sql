-- Create user_streaks table for tracking daily training streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT4 NOT NULL DEFAULT 0,
    best_streak INT4 NOT NULL DEFAULT 0,
    last_played_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only READ their own streak data (system manages writes via triggers)
CREATE POLICY "Users can view their own streak data"
    ON public.user_streaks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to update user streak when a game session is created
CREATE OR REPLACE FUNCTION public.update_user_streak_from_session()
RETURNS TRIGGER AS $$
DECLARE
    today_date DATE := (NOW() AT TIME ZONE 'UTC')::DATE;
    user_last_played DATE;
    user_current_streak INT4;
    user_best_streak INT4;
BEGIN
    -- Skip if no user_id
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current streak data for user
    SELECT last_played_date, current_streak, best_streak
    INTO user_last_played, user_current_streak, user_best_streak
    FROM public.user_streaks
    WHERE user_id = NEW.user_id;

    -- If user has no streak record (edge case), create one
    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, best_streak, last_played_date, created_at, updated_at)
        VALUES (NEW.user_id, 1, 1, today_date, NOW(), NOW());
        RETURN NEW;
    END IF;

    -- If already played today, do nothing
    IF user_last_played = today_date THEN
        RETURN NEW;
    END IF;

    -- If played yesterday, increment streak
    IF user_last_played = today_date - 1 THEN
        user_current_streak := user_current_streak + 1;
    ELSE
        -- Streak broken, reset to 1
        user_current_streak := 1;
    END IF;

    -- Update best streak if current is higher
    IF user_current_streak > user_best_streak THEN
        user_best_streak := user_current_streak;
    END IF;

    -- Update the streak record
    UPDATE public.user_streaks
    SET current_streak = user_current_streak,
        best_streak = user_best_streak,
        last_played_date = today_date,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on game_sessions
DROP TRIGGER IF EXISTS trg_update_user_streak ON public.game_sessions;

CREATE TRIGGER trg_update_user_streak
AFTER INSERT ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_streak_from_session();

-- Update the existing handle_new_user function to also create a streak row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile (existing behavior)
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    
    -- Create streak record with initial values of 0
    INSERT INTO public.user_streaks (user_id, current_streak, best_streak, last_played_date, created_at, updated_at)
    VALUES (new.id, 0, 0, NULL, NOW(), NOW());
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE public.user_streaks IS 'Tracks daily training streaks for users based on game session activity';
