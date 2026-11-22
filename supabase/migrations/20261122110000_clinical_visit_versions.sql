-- Additive clinical workspace. Existing appointments and signed records remain intact.
create table public.clinical_visits (
 appointment_id uuid primary key references public.appointments(id),
 revision integer not null default 1 check (revision > 0),
 content jsonb not null check (jsonb_typeof(content) = 'object'),
 updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id)
);
create table public.clinical_visit_versions (
 appointment_id uuid not null references public.clinical_visits(appointment_id),
 revision integer not null,
 content jsonb not null,
 saved_at timestamptz not null default now(),
 saved_by uuid not null references auth.users(id),
 primary key(appointment_id, revision)
);
alter table public.clinical_visits enable row level security;
alter table public.clinical_visit_versions enable row level security;
create policy clinical_visits_read on public.clinical_visits for select to authenticated using(public.is_staff(auth.uid()));
create policy clinical_versions_read on public.clinical_visit_versions for select to authenticated using(public.is_staff(auth.uid()));
revoke all on public.clinical_visits, public.clinical_visit_versions from anon, authenticated;
grant select on public.clinical_visits, public.clinical_visit_versions to authenticated;
create function public.save_clinical_visit(p_appointment_id uuid, p_expected_revision integer, p_content jsonb)
returns public.clinical_visits language plpgsql security definer set search_path = public as $$
declare v public.clinical_visits; k text;
begin
 if auth.uid() is null or not (public.has_role(auth.uid(),'doctor') or public.has_role(auth.uid(),'admin')) then raise exception 'CLINICAL_FORBIDDEN'; end if;
 if p_expected_revision is null or p_expected_revision < 0 or p_content is null or jsonb_typeof(p_content) <> 'object' or octet_length(p_content::text) > 200000 then raise exception 'CLINICAL_INVALID'; end if;
 for k in select jsonb_object_keys(p_content) loop
  if k not in ('complaint','history','exam','assessment','plan','medications','followup') or jsonb_typeof(p_content->k) <> 'string' then raise exception 'CLINICAL_INVALID'; end if;
 end loop;
 -- Lock the parent, including on first creation, to serialize all writers.
 perform 1 from public.appointments where id=p_appointment_id for update;
 if not found then raise exception 'CLINICAL_NOT_FOUND'; end if;
 select * into v from public.clinical_visits where appointment_id=p_appointment_id;
 if coalesce(v.revision,0) <> p_expected_revision then raise exception 'CLINICAL_CONFLICT'; end if;
 insert into public.clinical_visits(appointment_id,revision,content,updated_by)
 values(p_appointment_id,p_expected_revision+1,p_content,auth.uid())
 on conflict(appointment_id) do update set revision=excluded.revision,content=excluded.content,updated_at=now(),updated_by=auth.uid()
 returning * into v;
 insert into public.clinical_visit_versions(appointment_id,revision,content,saved_by) values(v.appointment_id,v.revision,v.content,auth.uid());
 return v;
end $$;
revoke all on function public.save_clinical_visit(uuid,integer,jsonb) from public, anon;
grant execute on function public.save_clinical_visit(uuid,integer,jsonb) to authenticated;
