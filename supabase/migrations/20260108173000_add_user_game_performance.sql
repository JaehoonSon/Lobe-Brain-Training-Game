-- Create user_game_performance table for per-game aggregates and difficulty rating
CREATE TABLE IF NOT EXISTS public.user_game_performance (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE,
    difficulty_rating FLOAT4 NOT NULL DEFAULT 3.0,
    games_played_count INT4 NOT NULL DEFAULT 0,
    highest_score INT4,
    total_score INT4 NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, game_id)
);

ALTER TABLE public.user_game_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own game performance data"
    ON public.user_game_performance
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Update per-game aggregates and difficulty rating on session insert
CREATE OR REPLACE FUNCTION public.update_user_game_performance_from_session()
RETURNS TRIGGER AS $$
DECLARE
    normalized_rating FLOAT4;
    next_rating FLOAT4;
BEGIN
    IF NEW.user_id IS NULL OR NEW.game_id IS NULL OR NEW.score IS NULL THEN
        RETURN NEW;
    END IF;

    normalized_rating := LEAST(10.0, GREATEST(1.0, NEW.score / 70.0));

    INSERT INTO public.user_game_performance (
        user_id,
        game_id,
        difficulty_rating,
        games_played_count,
        highest_score,
        total_score,
        last_played_at
    )
    VALUES (
        NEW.user_id,
        NEW.game_id,
        normalized_rating,
        1,
        NEW.score,
        NEW.score,
        NEW.created_at
    )
    ON CONFLICT (user_id, game_id) DO UPDATE SET
        games_played_count = public.user_game_performance.games_played_count + 1,
        highest_score = GREATEST(
            COALESCE(public.user_game_performance.highest_score, EXCLUDED.highest_score),
            EXCLUDED.highest_score
        ),
        total_score = public.user_game_performance.total_score + EXCLUDED.total_score,
        last_played_at = EXCLUDED.last_played_at,
        difficulty_rating = LEAST(
            10.0,
            GREATEST(
                1.0,
                (public.user_game_performance.difficulty_rating * 0.8) + (normalized_rating * 0.2)
            )
        );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_game_performance_from_session ON public.game_sessions;

CREATE TRIGGER trg_user_game_performance_from_session
AFTER INSERT ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_game_performance_from_session();
