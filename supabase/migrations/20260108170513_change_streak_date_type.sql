ALTER TABLE "public"."user_streaks" 
ALTER COLUMN "last_played_date" TYPE timestamptz 
USING "last_played_date"::timestamptz;

-- Update the function to handle TIMESTAMPTZ and store precise time
CREATE OR REPLACE FUNCTION public.update_user_streak_from_session()
RETURNS TRIGGER AS $$
DECLARE
    current_ts TIMESTAMPTZ := NOW();
    today_date DATE := (current_ts AT TIME ZONE 'UTC')::DATE;
    user_last_played_ts TIMESTAMPTZ;
    user_last_played_date DATE;
    user_current_streak INT4;
    user_best_streak INT4;
BEGIN
    -- Skip if no user_id
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current streak data for user
    SELECT last_played_date, current_streak, best_streak
    INTO user_last_played_ts, user_current_streak, user_best_streak
    FROM public.user_streaks
    WHERE user_id = NEW.user_id;

    -- If user has no streak record (edge case), create one
    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, best_streak, last_played_date, created_at, updated_at)
        VALUES (NEW.user_id, 1, 1, current_ts, current_ts, current_ts);
        RETURN NEW;
    END IF;

    -- Convert last played to date for comparison
    IF user_last_played_ts IS NOT NULL THEN
        user_last_played_date := (user_last_played_ts AT TIME ZONE 'UTC')::DATE;
    END IF;

    -- If already played today (UTC), just update the timestamp
    IF user_last_played_date = today_date THEN
        UPDATE public.user_streaks
        SET last_played_date = current_ts,
            updated_at = current_ts
        WHERE user_id = NEW.user_id;
        RETURN NEW;
    END IF;

    -- If played yesterday (UTC), increment streak
    IF user_last_played_date = today_date - 1 THEN
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
        last_played_date = current_ts,
        updated_at = current_ts
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
