


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_daily_challenge"() RETURNS TABLE("game_id" "text", "game_name" "text", "game_description" "text", "sessions_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_game_id TEXT;
    v_game_name TEXT;
    v_game_description TEXT;
    v_game_count INTEGER;
    v_day_offset INTEGER;
    v_real_count INTEGER;
    v_simulated_buffer INTEGER;
    v_seed_text TEXT;
    v_hash BIGINT;
BEGIN
    -- 1. Get total number of games
    SELECT COUNT(*)::INTEGER INTO v_game_count FROM public.games;
    
    IF v_game_count = 0 THEN
        RETURN; -- No games available
    END IF;
    
    -- 2. Calculate which game index to pick today (deterministic, same for everyone)
    -- Uses day of year modulo game count
    v_day_offset := (EXTRACT(DOY FROM CURRENT_DATE)::INTEGER % v_game_count);
    
    -- 3. Get today's challenge game (ordered by id for consistency)
    SELECT g.id, g.name, g.description
    INTO v_game_id, v_game_name, v_game_description
    FROM public.games g
    ORDER BY g.id
    LIMIT 1 OFFSET v_day_offset;
    
    -- 4. Count real sessions for this game today
    SELECT COALESCE(COUNT(*), 0)::INTEGER INTO v_real_count
    FROM public.game_sessions
    WHERE game_sessions.game_id = v_game_id
    AND game_sessions.created_at::DATE = CURRENT_DATE;
    
    -- 5. Calculate deterministic simulated buffer (300-800)
    -- Seed = game_id + current_date (same for everyone on same day)
    v_seed_text := v_game_id::TEXT || CURRENT_DATE::TEXT;
    v_hash := ('x' || substr(md5(v_seed_text), 1, 8))::bit(32)::bigint;
    v_simulated_buffer := 300 + (abs(v_hash) % 501); -- Range: 300 to 800
    
    -- 6. Return the challenge info
    RETURN QUERY SELECT 
        v_game_id,
        v_game_name,
        v_game_description,
        v_real_count + v_simulated_buffer;
END;
$$;


ALTER FUNCTION "public"."get_daily_challenge"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_insight"() RETURNS TABLE("id" "uuid", "content" "text", "source" "text", "source_url" "text", "category" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    days_since_epoch INT;
    rotated_day INT;
BEGIN
    -- Calculate days since Unix epoch
    days_since_epoch := EXTRACT(EPOCH FROM CURRENT_DATE)::INT / 86400;
    
    -- Use modulo to rotate through 40 facts (1-40)
    rotated_day := (days_since_epoch % 40) + 1;
    
    RETURN QUERY
    SELECT 
        di.id,
        di.content,
        di.source,
        di.source_url,
        di.category
    FROM daily_insights di
    WHERE di.day_of_year = rotated_day;
END;
$$;


ALTER FUNCTION "public"."get_daily_insight"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create profile (existing behavior)
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    
    -- Create streak record with initial values of 0
    INSERT INTO public.user_streaks (user_id, current_streak, best_streak, last_played_date, created_at, updated_at)
    VALUES (new.id, 0, 0, NULL, NOW(), NOW());
    
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_daily_game_performance_snapshot"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
    insert into public.user_game_performance_history (
        user_id,
        game_id,
        difficulty_rating,
        games_played_count,
        highest_score,
        total_score,
        last_played_at,
        perf_created_at,
        snapshot_date
    )
    select
        user_id,
        game_id,
        difficulty_rating,
        games_played_count,
        highest_score,
        total_score,
        last_played_at,
        created_at as perf_created_at,
        current_date as snapshot_date
    from
        public.user_game_performance
    on conflict (user_id, game_id, snapshot_date) do nothing;
end;
$$;


ALTER FUNCTION "public"."process_daily_game_performance_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_daily_global_game_performance_snapshot"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
    insert into public.global_game_performance_history (
        game_id,
        difficulty_rating,
        games_played_count,
        highest_score,
        total_score,
        snapshot_date
    )
    select
        game_id,
        round(avg(difficulty_rating)::numeric, 2) as difficulty_rating,
        round(avg(games_played_count)) as games_played_count,
        round(avg(highest_score)) as highest_score,
        round(avg(total_score)) as total_score,
        current_date as snapshot_date
    from
        public.user_game_performance
    group by
        game_id
    on conflict (game_id, snapshot_date) do nothing;
end;
$$;


ALTER FUNCTION "public"."process_daily_global_game_performance_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_norm_referenced_scores"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$DECLARE
    window_end TIMESTAMPTZ := NOW();
    window_start TIMESTAMPTZ := window_end - INTERVAL '90 days';
    seed_mean FLOAT8 := 1000;
    seed_std FLOAT8 := 250;
    seed_k INT4 := 50;
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
END;$$;


ALTER FUNCTION "public"."refresh_norm_referenced_scores"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_game_norms"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."seed_game_norms"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_game_performance_from_session"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  acc float4;
  target_acc float4 := 0.80;
  error float4;
  delta float4;
  next_rating float4;
  old_rating float4;
BEGIN
  IF NEW.user_id IS NULL OR NEW.game_id IS NULL THEN
    RETURN NEW;
  END IF;

  acc := COALESCE(NEW.correct_count::float4 / NULLIF(NEW.total_questions, 0), 0);

  -- First-time insert uses difficulty_rating_used or default 3.0
  old_rating := COALESCE(
    (SELECT difficulty_rating FROM public.user_game_performance
     WHERE user_id = NEW.user_id AND game_id = NEW.game_id),
    COALESCE(NEW.difficulty_rating_used, 3.0)
  );

  error := acc - target_acc;
  delta := GREATEST(-0.4, LEAST(0.4, error)) * 1.0; -- max ±0.24
  next_rating := LEAST(10.0, GREATEST(1.0, old_rating + delta));

  INSERT INTO public.user_game_performance (
    user_id, game_id, difficulty_rating,
    games_played_count, highest_score, total_score, last_played_at
  )
  VALUES (
    NEW.user_id, NEW.game_id, next_rating,
    1, NEW.score, NEW.score, NEW.created_at
  )
  ON CONFLICT (user_id, game_id) DO UPDATE SET
    games_played_count = public.user_game_performance.games_played_count + 1,
    highest_score = GREATEST(COALESCE(public.user_game_performance.highest_score, EXCLUDED.highest_score), EXCLUDED.highest_score),
    total_score = public.user_game_performance.total_score + EXCLUDED.total_score,
    last_played_at = EXCLUDED.last_played_at,
    difficulty_rating = next_rating;

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_user_game_performance_from_session"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_streak_from_session"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_user_streak_from_session"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "theme" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "source" "text",
    "source_url" "text",
    "day_of_year" integer NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daily_insights_day_of_year_check" CHECK ((("day_of_year" >= 1) AND ("day_of_year" <= 40)))
);


ALTER TABLE "public"."daily_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "question_id" "uuid",
    "response_time_ms" integer,
    "user_response" "jsonb",
    "generated_content" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accuracy" real NOT NULL
);


ALTER TABLE "public"."game_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_norms" (
    "game_id" "text" NOT NULL,
    "mean_score" double precision NOT NULL,
    "std_score" double precision NOT NULL,
    "p50" double precision,
    "p90" double precision,
    "p99" double precision,
    "sample_size" integer NOT NULL,
    "window_start" timestamp with time zone NOT NULL,
    "window_end" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."game_norms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "game_id" "text",
    "difficulty_rating_used" real,
    "total_questions" smallint,
    "correct_count" smallint,
    "duration_seconds" integer,
    "score" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "avg_question_difficulty" real NOT NULL,
    "avg_response_time_ms" integer
);


ALTER TABLE "public"."game_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."game_sessions"."difficulty_rating_used" IS 'User target rating at session start (from user_game_performance.difficulty_rating)';



COMMENT ON COLUMN "public"."game_sessions"."avg_question_difficulty" IS 'Average difficulty (0-10) of questions actually served';



COMMENT ON COLUMN "public"."game_sessions"."avg_response_time_ms" IS 'Average response time per question in milliseconds (null for games without speed scoring)';



CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "text" NOT NULL,
    "category_id" "text",
    "name" "text" NOT NULL,
    "description" "text",
    "instructions" "text",
    "icon_url" "text",
    "banner_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_pro_only" boolean DEFAULT false NOT NULL,
    "recommended_rounds" integer DEFAULT 3 NOT NULL
);


ALTER TABLE "public"."games" OWNER TO "postgres";


COMMENT ON COLUMN "public"."games"."recommended_rounds" IS 'Recommended number of rounds for this game type';



CREATE TABLE IF NOT EXISTS "public"."global_game_performance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "text" NOT NULL,
    "difficulty_rating" real NOT NULL,
    "games_played_count" integer NOT NULL,
    "highest_score" integer,
    "total_score" integer NOT NULL,
    "snapshot_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."global_game_performance_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "website" "text",
    "onboarding_data" "jsonb",
    "onboarding_completed_at" timestamp with time zone,
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."onboarding_data" IS 'Stores all collected onboarding data as a JSON object';



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "text",
    "difficulty" real NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_category_scores" (
    "user_id" "uuid" NOT NULL,
    "category_id" "text" NOT NULL,
    "display_score" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_category_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_game_percentiles" (
    "user_id" "uuid" NOT NULL,
    "game_id" "text" NOT NULL,
    "last_score_raw" integer NOT NULL,
    "percentile" double precision NOT NULL,
    "display_score" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_game_percentiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_game_performance" (
    "user_id" "uuid" NOT NULL,
    "game_id" "text" NOT NULL,
    "difficulty_rating" real DEFAULT 3.0 NOT NULL,
    "games_played_count" integer DEFAULT 0 NOT NULL,
    "highest_score" integer,
    "total_score" integer DEFAULT 0 NOT NULL,
    "last_played_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_game_performance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_game_performance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_id" "text" NOT NULL,
    "difficulty_rating" real NOT NULL,
    "games_played_count" integer NOT NULL,
    "highest_score" integer,
    "total_score" integer NOT NULL,
    "last_played_at" timestamp with time zone,
    "perf_created_at" timestamp with time zone,
    "snapshot_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_game_performance_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_game_score_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_id" "text" NOT NULL,
    "display_score" integer NOT NULL,
    "percentile" double precision NOT NULL,
    "snapshot_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_game_score_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_global_scores" (
    "user_id" "uuid" NOT NULL,
    "display_score" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_global_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_streaks" (
    "user_id" "uuid" NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "best_streak" integer DEFAULT 0 NOT NULL,
    "last_played_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_streaks" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_streaks" IS 'Tracks daily training streaks for users based on game session activity';



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_insights"
    ADD CONSTRAINT "daily_insights_day_of_year_key" UNIQUE ("day_of_year");



ALTER TABLE ONLY "public"."daily_insights"
    ADD CONSTRAINT "daily_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_answers"
    ADD CONSTRAINT "game_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_norms"
    ADD CONSTRAINT "game_norms_pkey" PRIMARY KEY ("game_id");



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_game_performance_history"
    ADD CONSTRAINT "global_game_performance_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_game_performance_history"
    ADD CONSTRAINT "uq_global_game_perf_history_daily" UNIQUE ("game_id", "snapshot_date");



ALTER TABLE ONLY "public"."user_game_performance_history"
    ADD CONSTRAINT "uq_user_game_perf_history_daily" UNIQUE ("user_id", "game_id", "snapshot_date");



ALTER TABLE ONLY "public"."user_game_score_history"
    ADD CONSTRAINT "uq_user_game_score_history_daily" UNIQUE ("user_id", "game_id", "snapshot_date");



ALTER TABLE ONLY "public"."user_category_scores"
    ADD CONSTRAINT "user_category_scores_pkey" PRIMARY KEY ("user_id", "category_id");



ALTER TABLE ONLY "public"."user_game_percentiles"
    ADD CONSTRAINT "user_game_percentiles_pkey" PRIMARY KEY ("user_id", "game_id");



ALTER TABLE ONLY "public"."user_game_performance_history"
    ADD CONSTRAINT "user_game_performance_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_game_performance"
    ADD CONSTRAINT "user_game_performance_pkey" PRIMARY KEY ("user_id", "game_id");



ALTER TABLE ONLY "public"."user_game_score_history"
    ADD CONSTRAINT "user_game_score_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_global_scores"
    ADD CONSTRAINT "user_global_scores_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_daily_insights_day_of_year" ON "public"."daily_insights" USING "btree" ("day_of_year");



CREATE INDEX "idx_questions_game_difficulty" ON "public"."questions" USING "btree" ("game_id", "difficulty");



CREATE OR REPLACE TRIGGER "trg_update_user_streak" AFTER INSERT ON "public"."game_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_streak_from_session"();



CREATE OR REPLACE TRIGGER "trg_user_game_performance_from_session" AFTER INSERT ON "public"."game_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_game_performance_from_session"();



ALTER TABLE ONLY "public"."game_answers"
    ADD CONSTRAINT "game_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");



ALTER TABLE ONLY "public"."game_answers"
    ADD CONSTRAINT "game_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_norms"
    ADD CONSTRAINT "game_norms_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id");



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."global_game_performance_history"
    ADD CONSTRAINT "global_game_performance_history_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id");



ALTER TABLE ONLY "public"."user_category_scores"
    ADD CONSTRAINT "user_category_scores_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_category_scores"
    ADD CONSTRAINT "user_category_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_percentiles"
    ADD CONSTRAINT "user_game_percentiles_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_percentiles"
    ADD CONSTRAINT "user_game_percentiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_performance"
    ADD CONSTRAINT "user_game_performance_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_performance_history"
    ADD CONSTRAINT "user_game_performance_history_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_performance_history"
    ADD CONSTRAINT "user_game_performance_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_performance"
    ADD CONSTRAINT "user_game_performance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_score_history"
    ADD CONSTRAINT "user_game_score_history_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_game_score_history"
    ADD CONSTRAINT "user_game_score_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_global_scores"
    ADD CONSTRAINT "user_global_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow read for authenticated users on categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read for authenticated users on games" ON "public"."games" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read for authenticated users on questions" ON "public"."questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read game norms" ON "public"."game_norms" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Everyone can read global performance history" ON "public"."global_game_performance_history" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own answers" ON "public"."game_answers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."game_sessions"
  WHERE (("game_sessions"."id" = "game_answers"."session_id") AND ("game_sessions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own game performance data" ON "public"."user_game_performance" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own sessions" ON "public"."game_sessions" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own category scores" ON "public"."user_category_scores" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own game percentiles" ON "public"."user_game_percentiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own game score history" ON "public"."user_game_score_history" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own global score" ON "public"."user_global_scores" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own performance history" ON "public"."user_game_performance_history" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own streak data" ON "public"."user_streaks" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_norms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."global_game_performance_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_category_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_game_percentiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_game_performance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_game_performance_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_game_score_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_global_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_streaks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."get_daily_challenge"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_challenge"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_challenge"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_insight"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_insight"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_insight"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_daily_game_performance_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_daily_game_performance_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_daily_game_performance_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_daily_global_game_performance_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_daily_global_game_performance_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_daily_global_game_performance_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_norm_referenced_scores"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_norm_referenced_scores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_norm_referenced_scores"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_game_norms"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_game_norms"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_game_norms"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_game_performance_from_session"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_game_performance_from_session"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_game_performance_from_session"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_streak_from_session"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_streak_from_session"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_streak_from_session"() TO "service_role";
























GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."daily_insights" TO "anon";
GRANT ALL ON TABLE "public"."daily_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_insights" TO "service_role";



GRANT ALL ON TABLE "public"."game_answers" TO "anon";
GRANT ALL ON TABLE "public"."game_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."game_answers" TO "service_role";



GRANT ALL ON TABLE "public"."game_norms" TO "anon";
GRANT ALL ON TABLE "public"."game_norms" TO "authenticated";
GRANT ALL ON TABLE "public"."game_norms" TO "service_role";



GRANT ALL ON TABLE "public"."game_sessions" TO "anon";
GRANT ALL ON TABLE "public"."game_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."global_game_performance_history" TO "anon";
GRANT ALL ON TABLE "public"."global_game_performance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."global_game_performance_history" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."user_category_scores" TO "anon";
GRANT ALL ON TABLE "public"."user_category_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_category_scores" TO "service_role";



GRANT ALL ON TABLE "public"."user_game_percentiles" TO "anon";
GRANT ALL ON TABLE "public"."user_game_percentiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_game_percentiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_game_performance" TO "anon";
GRANT ALL ON TABLE "public"."user_game_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."user_game_performance" TO "service_role";



GRANT ALL ON TABLE "public"."user_game_performance_history" TO "anon";
GRANT ALL ON TABLE "public"."user_game_performance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_game_performance_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_game_score_history" TO "anon";
GRANT ALL ON TABLE "public"."user_game_score_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_game_score_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_global_scores" TO "anon";
GRANT ALL ON TABLE "public"."user_global_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_global_scores" TO "service_role";



GRANT ALL ON TABLE "public"."user_streaks" TO "anon";
GRANT ALL ON TABLE "public"."user_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_streaks" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


