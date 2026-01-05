-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    theme JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.categories(id),
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    icon_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT REFERENCES public.games(id),
    difficulty FLOAT4 NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for progression queries
CREATE INDEX IF NOT EXISTS idx_questions_game_difficulty ON public.questions (game_id, difficulty);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT REFERENCES public.games(id),
    difficulty_level FLOAT4,
    total_questions INT2,
    correct_count INT2,
    duration_seconds INT4,
    score INT4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_answers table
CREATE TABLE IF NOT EXISTS public.game_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id),
    is_correct BOOLEAN NOT NULL,
    response_time_ms INT4,
    user_response JSONB,
    generated_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_performance table
CREATE TABLE IF NOT EXISTS public.user_performance (
    user_id UUID REFERENCES auth.users(id),
    game_id TEXT REFERENCES public.games(id),
    current_rating FLOAT4 DEFAULT 1.0,
    highest_score INT4,
    games_played_count INT4 DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, game_id)
);

-- Add RLS policies (simple defaults for now, allowing authenticated access)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;

-- Allow read access to categories and games for all authenticated users
CREATE POLICY "Allow read for authenticated users on categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users on games" ON public.games FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated users on questions" ON public.questions FOR SELECT TO authenticated USING (true);

-- User-specific access for sessions, answers, and performance
CREATE POLICY "Users can manage their own sessions" ON public.game_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own answers" ON public.game_answers FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.game_sessions 
        WHERE public.game_sessions.id = public.game_answers.session_id 
        AND public.game_sessions.user_id = auth.uid()
    )
);
CREATE POLICY "Users can manage their own performance data" ON public.user_performance FOR ALL TO authenticated USING (auth.uid() = user_id);
