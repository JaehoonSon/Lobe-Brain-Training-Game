create table public.push_delivery_logs (
    id uuid not null default gen_random_uuid(),
    user_id uuid null,
    push_token_id uuid null,
    push_token text not null,
    status text not null,
    payload jsonb not null,
    sent_at timestamp with time zone not null default now(),
    error_message text null,
    constraint push_delivery_logs_pkey primary key (id),
    constraint push_delivery_logs_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade,
    constraint push_delivery_logs_push_token_id_fkey foreign key (push_token_id) references push_tokens (id) on delete set null
);

comment on table public.push_delivery_logs is 'Logs of all push notifications sent to users.';

alter table public.push_delivery_logs enable row level security;

create policy "Users can view their own push delivery logs"
on public.push_delivery_logs
for select
using (auth.uid() = user_id);

-- Create an index on user_id for faster lookups
create index push_delivery_logs_user_id_idx on public.push_delivery_logs (user_id);

-- Create an index on sent_at for sorting/filtering
create index push_delivery_logs_sent_at_idx on public.push_delivery_logs (sent_at desc);
