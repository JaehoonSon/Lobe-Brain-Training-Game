CREATE TABLE IF NOT EXISTS public.user_game_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    display_score INT4 NOT NULL,
    percentile FLOAT8 NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_game_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own game score history"
    ON public.user_game_score_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

ALTER TABLE public.user_game_score_history
    ADD CONSTRAINT uq_user_game_score_history_daily
    UNIQUE (user_id, game_id, snapshot_date);
