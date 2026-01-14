ALTER TABLE public.game_sessions
  ALTER COLUMN correct_count TYPE float4
  USING correct_count::float4;
