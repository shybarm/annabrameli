-- Original ink stamp is provisioned privately, never shipped in public JS/assets.
create table public.clinical_issuer (
 id boolean primary key default true check(id),
 user_id uuid not null references auth.users(id),
 name text not null,
 specialty text not null,
 license text not null default '',
 stamp_data text not null check(stamp_data ~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'),
 updated_at timestamptz not null default now()
);
alter table public.clinical_issuer enable row level security;
revoke all on public.clinical_issuer from anon, authenticated;
create table public.clinical_documents (
 id uuid primary key default gen_random_uuid(),
 appointment_id uuid not null references public.appointments(id),
 patient_id uuid not null references public.patients(id),
 revision integer not null,
 snapshot jsonb not null,
 signed_at timestamptz not null default now(),
 signed_by uuid not null references auth.users(id),
 unique(appointment_id,revision)
);
alter table public.clinical_documents enable row level security;
revoke all on public.clinical_documents from anon, authenticated;
grant select on public.clinical_documents to authenticated;
create policy clinical_documents_read on public.clinical_documents for select to authenticated using(
 public.is_staff(auth.uid()) or exists(select 1 from public.patients p where p.id=patient_id and p.user_id=auth.uid())
);
create function public.finalize_clinical_visit(p_appointment_id uuid,p_expected_revision integer,p_content jsonb)
returns public.clinical_documents language plpgsql security definer set search_path=public as $$
declare v public.clinical_visits; d public.clinical_documents; issuer public.clinical_issuer; a public.appointments; p public.patients;
begin
 select * into issuer from public.clinical_issuer where id=true;
 if auth.uid() is null or issuer.user_id is distinct from auth.uid() or not (public.has_role(auth.uid(),'doctor') or public.has_role(auth.uid(),'admin')) then raise exception 'CLINICAL_SIGNER_REQUIRED'; end if;
 select * into a from public.appointments where id=p_appointment_id and coalesce(is_deleted,false)=false for update;
 if not found then raise exception 'CLINICAL_NOT_FOUND'; end if;
 select * into p from public.patients where id=a.patient_id;
 if nullif(trim(p.first_name),'') is null or nullif(trim(p.last_name),'') is null or nullif(trim(p.id_number),'') is null then raise exception 'CLINICAL_PATIENT_ID_REQUIRED'; end if;
 if p_content is null or jsonb_typeof(p_content)<>'object' or not exists(select 1 from jsonb_each_text(p_content) x where length(trim(x.value))>0) then raise exception 'CLINICAL_EMPTY'; end if;
 select * into v from public.clinical_visits where appointment_id=p_appointment_id;
 if coalesce(v.revision,0) <> p_expected_revision then raise exception 'CLINICAL_CONFLICT'; end if;
 if v.content is distinct from p_content then
  select * into v from public.save_clinical_visit(p_appointment_id,p_expected_revision,p_content);
 end if;
 select * into d from public.clinical_documents where appointment_id=p_appointment_id and revision=v.revision;
 if found then return d; end if;
 insert into public.clinical_documents(appointment_id,patient_id,revision,signed_by,snapshot)
 values(a.id,p.id,v.revision,auth.uid(),jsonb_build_object(
 'content',v.content,'visit_date',a.scheduled_at,
 'patient',jsonb_build_object('name',p.first_name||' '||p.last_name,'id_number',p.id_number,'date_of_birth',p.date_of_birth),
 'issuer',jsonb_build_object('name',issuer.name,'specialty',issuer.specialty,'license',issuer.license,'stamp_data',issuer.stamp_data,'address','הטווס 3 הוד השרון')
 )) returning * into d;
 return d;
end $$;
revoke all on function public.finalize_clinical_visit(uuid,integer,jsonb) from public, anon;
grant execute on function public.finalize_clinical_visit(uuid,integer,jsonb) to authenticated;
create function public.clinical_signing_ready() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.clinical_issuer where user_id=auth.uid()) and (public.has_role(auth.uid(),'doctor') or public.has_role(auth.uid(),'admin'));
$$;
revoke all on function public.clinical_signing_ready() from public,anon;
grant execute on function public.clinical_signing_ready() to authenticated;
create table public.clinical_templates (
 id uuid primary key default gen_random_uuid(),name text not null check(length(trim(name)) between 1 and 100),
 field text not null check(field in ('complaint','history','exam','assessment','plan','medications','followup')),
 body text not null check(length(body) between 1 and 20000), created_by uuid not null default auth.uid() references auth.users(id)
);
alter table public.clinical_templates enable row level security;
revoke all on public.clinical_templates from anon,authenticated;
grant select,insert,delete on public.clinical_templates to authenticated;
create policy clinical_templates_read on public.clinical_templates for select to authenticated using(public.is_staff(auth.uid()));
create policy clinical_templates_insert on public.clinical_templates for insert to authenticated with check(created_by=auth.uid() and (public.has_role(auth.uid(),'doctor') or public.has_role(auth.uid(),'admin')));
create policy clinical_templates_delete on public.clinical_templates for delete to authenticated using(created_by=auth.uid() and (public.has_role(auth.uid(),'doctor') or public.has_role(auth.uid(),'admin')));
