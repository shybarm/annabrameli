create table public.clinic_call_messages (
  call_hash text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'queued', 'review'))
);
alter table public.clinic_call_messages enable row level security;
revoke all on public.clinic_call_messages from public, anon, authenticated;
grant select, insert, update on public.clinic_call_messages to service_role;
