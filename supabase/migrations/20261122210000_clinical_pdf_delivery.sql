create table public.clinical_document_deliveries(
 document_id uuid not null references public.clinical_documents(id),
 kind text not null check(kind in ('summary','prescription')),
 state text not null default 'processing' check(state in ('processing','accepted','failed','uncertain')),
 requested_by uuid not null references auth.users(id),
 provider_message_id text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 primary key(document_id,kind)
);
alter table public.clinical_document_deliveries enable row level security;
revoke all on public.clinical_document_deliveries from public,anon,authenticated;
grant select on public.clinical_document_deliveries to authenticated;
grant all on public.clinical_document_deliveries to service_role;
create policy clinical_delivery_read on public.clinical_document_deliveries for select to authenticated using(public.is_staff(auth.uid()));
create function public.claim_clinical_delivery(p_document uuid,p_kind text,p_confirmed_phone text) returns jsonb language plpgsql security definer set search_path=public as $$
declare d public.clinical_documents; phone text;
begin
 if not public.clinical_signing_ready() then raise exception 'CLINICAL_FORBIDDEN';end if;
 select * into d from public.clinical_documents where id=p_document and signed_by=auth.uid();
 if not found or p_kind not in ('summary','prescription') or (p_kind='prescription' and coalesce(trim(d.snapshot->'content'->>'medications'),'')='') then raise exception 'CLINICAL_INVALID';end if;
 select regexp_replace(p.phone,'[^0-9]','','g') into phone from public.patients p where p.id=d.patient_id;
 if left(phone,1)='0' then phone:='972'||substring(phone from 2);end if;
 if phone is null or phone !~ '^9725[0-9]{8}$' or phone is distinct from p_confirmed_phone then raise exception 'CLINICAL_RECIPIENT';end if;
 insert into public.clinical_document_deliveries(document_id,kind,requested_by) values(d.id,p_kind,auth.uid()) on conflict do nothing;
 if not found then raise exception 'CLINICAL_ALREADY_REQUESTED';end if;
 return jsonb_build_object('phone',phone);
end $$;
revoke all on function public.claim_clinical_delivery(uuid,text,text) from public,anon;
grant execute on function public.claim_clinical_delivery(uuid,text,text) to authenticated;
