-- Presentation correction only. Original approved snapshots remain untouched.
create table public.clinical_stamp_renderings(original_hash text primary key,stamp_data text not null);
alter table public.clinical_stamp_renderings enable row level security;
revoke all on public.clinical_stamp_renderings from public,anon,authenticated;
insert into public.clinical_stamp_renderings(original_hash,stamp_data)
 select '5b941a6118c819b9f5a127f9eafca3be',stamp_data from public.clinical_issuer
 where id=true and length(stamp_data)=1063790;
create function public.clinical_document_stamp(p_document uuid) returns text language plpgsql stable security definer set search_path=public as $$
declare doc public.clinical_documents; original text; corrected text;
begin
 select * into doc from public.clinical_documents where id=p_document;
 if auth.uid() is null or doc.id is null or not(public.is_staff(auth.uid()) or exists(select 1 from public.patients where id=doc.patient_id and user_id=auth.uid())) then raise exception 'CLINICAL_FORBIDDEN';end if;
 original:=doc.snapshot->'issuer'->>'stamp_data';
 select stamp_data into corrected from public.clinical_stamp_renderings where original_hash=md5(original);
 return coalesce(corrected,original);
end $$;
revoke all on function public.clinical_document_stamp(uuid) from public,anon;
grant execute on function public.clinical_document_stamp(uuid) to authenticated;
