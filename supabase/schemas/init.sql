CREATE SCHEMA IF NOT EXISTS "graphql";
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE SCHEMA IF NOT EXISTS "vault";
create extension if not exists pg_net;

-- select vault.create_secret('value_here', 'SUPABASE_PROJECT_ID');
-- select vault.create_secret('value_here', 'SUPABASE_SERVICE_ROLE_KEY');