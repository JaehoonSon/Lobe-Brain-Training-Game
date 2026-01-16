drop extension if exists "pg_net";


  create table "public"."user_performance" (
    "user_id" uuid not null,
    "game_id" text not null,
    "current_rating" real default 1.0,
    "highest_score" integer,
    "games_played_count" integer default 0,
    "last_played_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_performance" enable row level security;

CREATE UNIQUE INDEX user_performance_pkey ON public.user_performance USING btree (user_id, game_id);

alter table "public"."user_performance" add constraint "user_performance_pkey" PRIMARY KEY using index "user_performance_pkey";

alter table "public"."user_performance" add constraint "user_performance_game_id_fkey" FOREIGN KEY (game_id) REFERENCES public.games(id) not valid;

alter table "public"."user_performance" validate constraint "user_performance_game_id_fkey";

alter table "public"."user_performance" add constraint "user_performance_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_performance" validate constraint "user_performance_user_id_fkey";

grant delete on table "public"."user_performance" to "anon";

grant insert on table "public"."user_performance" to "anon";

grant references on table "public"."user_performance" to "anon";

grant select on table "public"."user_performance" to "anon";

grant trigger on table "public"."user_performance" to "anon";

grant truncate on table "public"."user_performance" to "anon";

grant update on table "public"."user_performance" to "anon";

grant delete on table "public"."user_performance" to "authenticated";

grant insert on table "public"."user_performance" to "authenticated";

grant references on table "public"."user_performance" to "authenticated";

grant select on table "public"."user_performance" to "authenticated";

grant trigger on table "public"."user_performance" to "authenticated";

grant truncate on table "public"."user_performance" to "authenticated";

grant update on table "public"."user_performance" to "authenticated";

grant delete on table "public"."user_performance" to "service_role";

grant insert on table "public"."user_performance" to "service_role";

grant references on table "public"."user_performance" to "service_role";

grant select on table "public"."user_performance" to "service_role";

grant trigger on table "public"."user_performance" to "service_role";

grant truncate on table "public"."user_performance" to "service_role";

grant update on table "public"."user_performance" to "service_role";


  create policy "Users can manage their own performance data"
  on "public"."user_performance"
  as permissive
  for all
  to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


