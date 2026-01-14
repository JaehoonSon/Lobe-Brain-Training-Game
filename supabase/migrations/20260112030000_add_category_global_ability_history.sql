CREATE TABLE IF NOT EXISTS public.user_category_ability_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    ability_score INT4 NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_category_ability_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own category ability history"
    ON public.user_category_ability_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

ALTER TABLE public.user_category_ability_history
    ADD CONSTRAINT uq_user_category_ability_history_daily
    UNIQUE (user_id, category_id, snapshot_date);

CREATE TABLE IF NOT EXISTS public.user_global_ability_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ability_score INT4 NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_global_ability_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own global ability history"
    ON public.user_global_ability_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

ALTER TABLE public.user_global_ability_history
    ADD CONSTRAINT uq_user_global_ability_history_daily
    UNIQUE (user_id, snapshot_date);

CREATE OR REPLACE FUNCTION public.refresh_ability_scores()
RETURNS VOID AS $$
DECLARE
    window_end TIMESTAMPTZ := NOW();
    window_start TIMESTAMPTZ := window_end - INTERVAL '90 days';
    seed_mean FLOAT8 := 1000;
    seed_std FLOAT8 := 200;
    seed_k INT4 := 50;
    sigma_floor FLOAT8 := 100;
    z_max FLOAT8 := 4;
BEGIN
    INSERT INTO public.game_ability_norms (
        game_id,
        mean_raw,
        std_raw,
        sample_size,
        window_start,
        window_end,
        updated_at
    )
    SELECT
        gs.game_id,
        AVG(gs.score)::FLOAT8 AS mean_raw,
        COALESCE(STDDEV_POP(gs.score), 0)::FLOAT8 AS std_raw,
        COUNT(*)::INT4 AS sample_size,
        window_start,
        window_end,
        NOW()
    FROM public.game_sessions gs
    WHERE gs.score IS NOT NULL
      AND gs.created_at >= window_start
      AND gs.created_at < window_end
    GROUP BY gs.game_id
    ON CONFLICT (game_id) DO UPDATE SET
        mean_raw = EXCLUDED.mean_raw,
        std_raw = EXCLUDED.std_raw,
        sample_size = EXCLUDED.sample_size,
        window_start = EXCLUDED.window_start,
        window_end = EXCLUDED.window_end,
        updated_at = EXCLUDED.updated_at;

    WITH latest_sessions AS (
        SELECT DISTINCT ON (gs.user_id, gs.game_id)
            gs.user_id,
            gs.game_id,
            gs.score,
            gs.created_at
        FROM public.game_sessions gs
        WHERE gs.score IS NOT NULL
          AND gs.created_at >= window_start
          AND gs.created_at < window_end
        ORDER BY gs.user_id, gs.game_id, gs.created_at DESC
    )
    DELETE FROM public.user_game_ability_scores uga
    WHERE NOT EXISTS (
        SELECT 1
        FROM latest_sessions ls
        WHERE ls.user_id = uga.user_id
          AND ls.game_id = uga.game_id
    );

    WITH latest_sessions AS (
        SELECT DISTINCT ON (gs.user_id, gs.game_id)
            gs.user_id,
            gs.game_id,
            gs.score,
            gs.created_at
        FROM public.game_sessions gs
        WHERE gs.score IS NOT NULL
          AND gs.created_at >= window_start
          AND gs.created_at < window_end
        ORDER BY gs.user_id, gs.game_id, gs.created_at DESC
    ), norms AS (
        SELECT
            ls.user_id,
            ls.game_id,
            ls.score,
            COALESCE(gan.mean_raw, seed_mean) AS mean_raw,
            COALESCE(gan.std_raw, seed_std) AS std_raw,
            COALESCE(gan.sample_size, 0) AS sample_size
        FROM latest_sessions ls
        LEFT JOIN public.game_ability_norms gan
            ON gan.game_id = ls.game_id
    ), blended AS (
        SELECT
            user_id,
            game_id,
            score,
            (mean_raw * sample_size + seed_mean * seed_k) / (sample_size + seed_k) AS mean_blended,
            ((CASE WHEN std_raw < 1 THEN seed_std ELSE std_raw END) * sample_size + seed_std * seed_k)
                / (sample_size + seed_k) AS std_blended
        FROM norms
    ), z_scores AS (
        SELECT
            user_id,
            game_id,
            score,
            GREATEST(
                -z_max,
                LEAST(
                    z_max,
                    (score - mean_blended) / NULLIF(GREATEST(std_blended, sigma_floor), 0)
                )
            ) AS z
        FROM blended
    ), scored AS (
        SELECT
            user_id,
            game_id,
            score,
            LEAST(
                1,
                GREATEST(
                    0,
                    1 / (1 + EXP(-1.702 * z))
                )
            ) AS percentile,
            ROUND(
                LEAST(
                    2000,
                    GREATEST(
                        0,
                        1000 + 200 * z
                    )
                )
            )::INT4 AS ability_score
        FROM z_scores
    )
    INSERT INTO public.user_game_ability_scores (
        user_id,
        game_id,
        last_score_raw,
        ability_score,
        percentile,
        updated_at
    )
    SELECT
        scored.user_id,
        scored.game_id,
        scored.score AS last_score_raw,
        scored.ability_score,
        scored.percentile,
        NOW()
    FROM scored
    ON CONFLICT (user_id, game_id) DO UPDATE SET
        last_score_raw = EXCLUDED.last_score_raw,
        ability_score = EXCLUDED.ability_score,
        percentile = EXCLUDED.percentile,
        updated_at = EXCLUDED.updated_at;

    INSERT INTO public.user_game_ability_history (
        user_id,
        game_id,
        ability_score,
        percentile,
        snapshot_date,
        created_at
    )
    SELECT
        uga.user_id,
        uga.game_id,
        uga.ability_score,
        uga.percentile,
        CURRENT_DATE,
        NOW()
    FROM public.user_game_ability_scores uga
    ON CONFLICT (user_id, game_id, snapshot_date) DO UPDATE SET
        ability_score = EXCLUDED.ability_score,
        percentile = EXCLUDED.percentile,
        created_at = NOW();

    INSERT INTO public.user_category_ability_scores (
        user_id,
        category_id,
        ability_score,
        updated_at
    )
    SELECT
        uga.user_id,
        g.category_id,
        ROUND(AVG(uga.ability_score))::INT4 AS ability_score,
        NOW()
    FROM public.user_game_ability_scores uga
    JOIN public.games g ON g.id = uga.game_id
    WHERE g.category_id IS NOT NULL
    GROUP BY uga.user_id, g.category_id
    ON CONFLICT (user_id, category_id) DO UPDATE SET
        ability_score = EXCLUDED.ability_score,
        updated_at = EXCLUDED.updated_at;

    INSERT INTO public.user_category_ability_history (
        user_id,
        category_id,
        ability_score,
        snapshot_date,
        created_at
    )
    SELECT
        ucas.user_id,
        ucas.category_id,
        ucas.ability_score,
        CURRENT_DATE,
        NOW()
    FROM public.user_category_ability_scores ucas
    ON CONFLICT (user_id, category_id, snapshot_date) DO UPDATE SET
        ability_score = EXCLUDED.ability_score,
        created_at = NOW();

    INSERT INTO public.user_global_ability_scores (
        user_id,
        ability_score,
        updated_at
    )
    SELECT
        ucas.user_id,
        ROUND(AVG(ucas.ability_score))::INT4 AS ability_score,
        NOW()
    FROM public.user_category_ability_scores ucas
    GROUP BY ucas.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        ability_score = EXCLUDED.ability_score,
        updated_at = EXCLUDED.updated_at;

    INSERT INTO public.user_global_ability_history (
        user_id,
        ability_score,
        snapshot_date,
        created_at
    )
    SELECT
        ugas.user_id,
        ugas.ability_score,
        CURRENT_DATE,
        NOW()
    FROM public.user_global_ability_scores ugas
    ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
        ability_score = EXCLUDED.ability_score,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
