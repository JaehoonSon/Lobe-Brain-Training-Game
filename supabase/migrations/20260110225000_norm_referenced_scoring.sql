CREATE TABLE IF NOT EXISTS public.game_norms (
    game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE PRIMARY KEY,
    mean_score FLOAT8 NOT NULL,
    std_score FLOAT8 NOT NULL,
    p50 FLOAT8,
    p90 FLOAT8,
    p99 FLOAT8,
    sample_size INT4 NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.game_norms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read game norms"
    ON public.game_norms
    FOR SELECT
    TO authenticated
    USING (true);

INSERT INTO public.game_norms (
    game_id,
    mean_score,
    std_score,
    p50,
    p90,
    p99,
    sample_size,
    window_start,
    window_end,
    updated_at
)
SELECT
    g.id,
    1000,
    250,
    NULL,
    NULL,
    NULL,
    0,
    NOW() - INTERVAL '90 days',
    NOW(),
    NOW()
FROM public.games g
ON CONFLICT (game_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.seed_game_norms()
RETURNS INT4 AS $$
DECLARE
    window_end TIMESTAMPTZ := NOW();
    window_start TIMESTAMPTZ := window_end - INTERVAL '90 days';
    inserted_count INT4;
BEGIN
    INSERT INTO public.game_norms (
        game_id,
        mean_score,
        std_score,
        p50,
        p90,
        p99,
        sample_size,
        window_start,
        window_end,
        updated_at
    )
    SELECT
        g.id,
        1000,
        250,
        NULL,
        NULL,
        NULL,
        0,
        window_start,
        window_end,
        NOW()
    FROM public.games g
    LEFT JOIN public.game_norms gn ON gn.game_id = g.id
    WHERE gn.game_id IS NULL;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS public.user_game_percentiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE,
    last_score_raw INT4 NOT NULL,
    percentile FLOAT8 NOT NULL,
    display_score INT4 NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, game_id)
);

ALTER TABLE public.user_game_percentiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own game percentiles"
    ON public.user_game_percentiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_category_scores (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    display_score INT4 NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, category_id)
);

ALTER TABLE public.user_category_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own category scores"
    ON public.user_category_scores
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_global_scores (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_score INT4 NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_global_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own global score"
    ON public.user_global_scores
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.refresh_norm_referenced_scores()
RETURNS VOID AS $$
DECLARE
    window_end TIMESTAMPTZ := NOW();
    window_start TIMESTAMPTZ := window_end - INTERVAL '90 days';
    seed_mean FLOAT8 := 1000;
    seed_std FLOAT8 := 250;
    seed_k INT4 := 500;
BEGIN
    INSERT INTO public.game_norms (
        game_id,
        mean_score,
        std_score,
        p50,
        p90,
        p99,
        sample_size,
        window_start,
        window_end,
        updated_at
    )
    SELECT
        gs.game_id,
        AVG(gs.score)::FLOAT8 AS mean_score,
        COALESCE(STDDEV_POP(gs.score), 0)::FLOAT8 AS std_score,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gs.score) AS p50,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY gs.score) AS p90,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY gs.score) AS p99,
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
        mean_score = EXCLUDED.mean_score,
        std_score = EXCLUDED.std_score,
        p50 = EXCLUDED.p50,
        p90 = EXCLUDED.p90,
        p99 = EXCLUDED.p99,
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
    DELETE FROM public.user_game_percentiles ugp
    WHERE NOT EXISTS (
        SELECT 1
        FROM latest_sessions ls
        WHERE ls.user_id = ugp.user_id
          AND ls.game_id = ugp.game_id
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
            COALESCE(gn.mean_score, seed_mean) AS mean_score,
            COALESCE(gn.std_score, seed_std) AS std_score,
            COALESCE(gn.sample_size, 0) AS sample_size
        FROM latest_sessions ls
        LEFT JOIN public.game_norms gn
            ON gn.game_id = ls.game_id
    ), blended AS (
        SELECT
            user_id,
            game_id,
            score,
            (mean_score * sample_size + seed_mean * seed_k) / (sample_size + seed_k) AS mean_blended,
            ((CASE WHEN std_score < 1 THEN seed_std ELSE std_score END) * sample_size + seed_std * seed_k)
                / (sample_size + seed_k) AS std_blended
        FROM norms
    )
    INSERT INTO public.user_game_percentiles (
        user_id,
        game_id,
        last_score_raw,
        percentile,
        display_score,
        updated_at
    )
    SELECT
        b.user_id,
        b.game_id,
        b.score AS last_score_raw,
        LEAST(
            1,
            GREATEST(
                0,
                1 / (1 + EXP(-1.702 * ((b.score - b.mean_blended) / NULLIF(b.std_blended, 0))))
            )
        ) AS percentile,
        ROUND(
            2000 * POWER(
                LEAST(
                    1,
                    GREATEST(
                        0,
                        1 / (1 + EXP(-1.702 * ((b.score - b.mean_blended) / NULLIF(b.std_blended, 0))))
                    )
                ),
                1.25
            )
        )::INT4 AS display_score,
        NOW()
    FROM blended b
    ON CONFLICT (user_id, game_id) DO UPDATE SET
        last_score_raw = EXCLUDED.last_score_raw,
        percentile = EXCLUDED.percentile,
        display_score = EXCLUDED.display_score,
        updated_at = EXCLUDED.updated_at;

    INSERT INTO public.user_game_score_history (
        user_id,
        game_id,
        display_score,
        percentile,
        snapshot_date,
        created_at
    )
    SELECT
        ugp.user_id,
        ugp.game_id,
        ugp.display_score,
        ugp.percentile,
        CURRENT_DATE,
        NOW()
    FROM public.user_game_percentiles ugp
    ON CONFLICT (user_id, game_id, snapshot_date) DO NOTHING;

    INSERT INTO public.user_category_scores (
        user_id,
        category_id,
        display_score,
        updated_at
    )
    SELECT
        ugp.user_id,
        g.category_id,
        ROUND(AVG(ugp.display_score))::INT4 AS display_score,
        NOW()
    FROM public.user_game_percentiles ugp
    JOIN public.games g ON g.id = ugp.game_id
    WHERE g.category_id IS NOT NULL
    GROUP BY ugp.user_id, g.category_id
    ON CONFLICT (user_id, category_id) DO UPDATE SET
        display_score = EXCLUDED.display_score,
        updated_at = EXCLUDED.updated_at;

    INSERT INTO public.user_global_scores (
        user_id,
        display_score,
        updated_at
    )
    SELECT
        ucs.user_id,
        ROUND(AVG(ucs.display_score))::INT4 AS display_score,
        NOW()
    FROM public.user_category_scores ucs
    GROUP BY ucs.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        display_score = EXCLUDED.display_score,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

SELECT cron.schedule(
    'refresh-norm-referenced-scores',
    '0 0 * * *',
    $$ SELECT public.refresh_norm_referenced_scores() $$
);
