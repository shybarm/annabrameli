begin;
create function public.clinic_mobile_number(value text) returns text
language sql immutable strict set search_path='' as $$
  select case when digits ~ '^05[0-9]{8}$' then '972'||substr(digits,2)
              when digits ~ '^9725[0-9]{8}$' then digits end
  from (select regexp_replace(value,'[^0-9]','','g') as digits) normalized
$$;

-- Bind the follow-up to the confirmed destination as part of the original claim.
alter table public.clinical_document_deliveries add column confirmed_mobile text;
create or replace function public.claim_clinical_delivery(p_document uuid,p_kind text,p_confirmed_phone text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare doc public.clinical_documents; mobile text;
begin
 if not public.clinical_signing_ready() then raise exception 'CLINICAL_FORBIDDEN';end if;
 select * into doc from public.clinical_documents where id=p_document and signed_by=auth.uid();
 if not found or p_kind not in ('summary','prescription') or (p_kind='prescription' and coalesce(trim(doc.snapshot->'content'->>'medications'),'')='') then raise exception 'CLINICAL_INVALID';end if;
 select public.clinic_mobile_number(p.phone) into mobile from public.patients p where p.id=doc.patient_id for share;
 if mobile is null or mobile is distinct from p_confirmed_phone then raise exception 'CLINICAL_RECIPIENT';end if;
 insert into public.clinical_document_deliveries(document_id,kind,requested_by,confirmed_mobile) values(doc.id,p_kind,auth.uid(),mobile) on conflict do nothing;
 if not found then raise exception 'CLINICAL_ALREADY_REQUESTED';end if;
 return jsonb_build_object('phone',mobile);
end $$;

create table public.visit_review_requests (
 appointment_id uuid primary key references public.appointments(id) on delete cascade,
 patient_id uuid not null references public.patients(id) on delete cascade,
 mobile text not null, due_at timestamptz not null, handled_at timestamptz,
 message_id uuid references public.whatsapp_messages(id)
);
alter table public.visit_review_requests enable row level security;
revoke all on public.visit_review_requests from public,anon,authenticated;
create index visit_reviews_due on public.visit_review_requests(due_at) where handled_at is null;

create function public.schedule_visit_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.visit_review_requests(appointment_id,patient_id,mobile,due_at)
 select appointment_id,patient_id,new.confirmed_mobile,now()+interval '3 days' from public.clinical_documents where id=new.document_id
 on conflict do nothing;
 return new;
end $$;
revoke all on function public.schedule_visit_review() from public,anon,authenticated;
create trigger after_new_document_delivery after update of state on public.clinical_document_deliveries
for each row when (new.state='accepted' and old.state is distinct from new.state and new.confirmed_mobile is not null)
execute function public.schedule_visit_review();

create function public.queue_due_visit_reviews() returns void language plpgsql security definer set search_path='' as $$
declare job record; thread uuid; queued uuid;
begin
 for job in select * from public.visit_review_requests where handled_at is null and due_at<=now() order by due_at limit 50 for update skip locked loop
   queued:=null;
   if exists(select 1 from public.patients p where p.id=job.patient_id and public.clinic_mobile_number(p.phone)=job.mobile)
   and not exists(select 1 from public.appointments a where a.id=job.appointment_id and (a.is_deleted or a.status in ('no_show','cancelled'))) then
     insert into public.whatsapp_conversations(phone,unread) values(job.mobile,false) on conflict do nothing;
     select id into thread from public.whatsapp_conversations where phone=job.mobile and not opted_out for update;
     if found then
       queued:=public.queue_whatsapp_text(thread,'תודה שביקרת במרפאת ד״ר אנה ברמלי. נשמח לשמוע על החוויה שלך בגוגל: https://share.google/yMYmOjmUzoxx1kXUX');
     end if;
   end if;
   update public.visit_review_requests set handled_at=now(),message_id=queued where appointment_id=job.appointment_id;
 end loop;
end $$;
revoke all on function public.queue_due_visit_reviews() from public,anon,authenticated;
grant execute on function public.queue_due_visit_reviews() to service_role;
select cron.schedule('clinic-visit-review-requests','*/15 * * * *','select public.queue_due_visit_reviews()');

-- A family number can serve multiple patients. Do not attribute that phone's history to a single chart.
create function public.patient_whatsapp_thread(p_patient uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare mobile text; thread public.whatsapp_conversations; recent jsonb;
begin
 if not coalesce(public.can_edit_appointments(auth.uid()),false) or not coalesce(public.can_view_patients(auth.uid()),false) then raise exception 'FORBIDDEN';end if;
 select public.clinic_mobile_number(phone) into mobile from public.patients where id=p_patient;
 if mobile is null then return jsonb_build_object('state','missing');end if;
 if exists(select 1 from public.patients where id<>p_patient and public.clinic_mobile_number(phone)=mobile) then return jsonb_build_object('state','shared');end if;
 select * into thread from public.whatsapp_conversations where phone=mobile;
 select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at,m.id),'[]') into recent from (
    select id,created_at,direction,body,status from public.whatsapp_messages where conversation_id=thread.id order by created_at desc,id desc limit 100
 ) m;
 return jsonb_build_object('state',case when thread.opted_out then 'stopped' else 'ready' end,'messages',recent);
end $$;
revoke all on function public.patient_whatsapp_thread(uuid) from public,anon;
grant execute on function public.patient_whatsapp_thread(uuid) to authenticated;

alter table public.whatsapp_messages add column staff_request_id uuid unique;
create function public.patient_whatsapp_reply(p_patient uuid,p_phone text,p_body text,p_request uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare mobile text; thread public.whatsapp_conversations; queued uuid;
begin
 if not coalesce(public.can_edit_appointments(auth.uid()),false) or not coalesce(public.can_view_patients(auth.uid()),false) then raise exception 'FORBIDDEN';end if;
 select public.clinic_mobile_number(phone) into mobile from public.patients where id=p_patient for share;
 if mobile is null or mobile is distinct from p_phone or exists(select 1 from public.patients where id<>p_patient and public.clinic_mobile_number(phone)=mobile) then raise exception 'RECIPIENT_CHANGED';end if;
 if p_request is null or coalesce(length(trim(p_body)),0) not between 1 and 4000 then raise exception 'INVALID_MESSAGE';end if;
 insert into public.whatsapp_conversations(phone,unread) values(mobile,false) on conflict do nothing;
 select * into strict thread from public.whatsapp_conversations where phone=mobile for update;
 select id into queued from public.whatsapp_messages where staff_request_id=p_request and conversation_id=thread.id and body=trim(p_body);
 if found then return queued;end if;
 if thread.opted_out then raise exception 'OPTED_OUT';end if;
 update public.whatsapp_conversations set bot_stage='human',updated_at=now() where id=thread.id;
 queued := public.queue_whatsapp_text(thread.id,trim(p_body));
 update public.whatsapp_messages set staff_request_id=p_request where id=queued;
 return queued;
end $$;
revoke all on function public.patient_whatsapp_reply(uuid,text,text,uuid) from public,anon;
grant execute on function public.patient_whatsapp_reply(uuid,text,text,uuid) to authenticated;
commit;
