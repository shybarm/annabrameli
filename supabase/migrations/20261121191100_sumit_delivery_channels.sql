ALTER TABLE public.sumit_documents ALTER COLUMN recipient_email DROP NOT NULL;
ALTER TABLE public.sumit_documents
 ADD COLUMN delivery_channel text NOT NULL DEFAULT 'email' CHECK(delivery_channel IN ('email','whatsapp')),
 ADD COLUMN recipient_phone text,
 ADD COLUMN delivery_state text NOT NULL DEFAULT 'awaiting_document',
 ADD COLUMN delivery_not_before timestamptz;
CREATE TABLE clinic_private.sumit_whatsapp_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id uuid NOT NULL UNIQUE REFERENCES public.invoices(id),
 phone text NOT NULL, body text NOT NULL, not_before timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'pending',provider_message_id text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON clinic_private.sumit_whatsapp_jobs FROM PUBLIC,anon,authenticated;
ALTER TABLE clinic_private.sumit_whatsapp_jobs ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION clinic_private.sumit_whatsapp_not_before(p_paid_at timestamptz,p_now timestamptz)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE paid_local timestamp := coalesce(p_paid_at,p_now) AT TIME ZONE 'Asia/Jerusalem';
 candidate timestamptz; local_candidate timestamp;
BEGIN
 candidate := greatest(p_now, CASE WHEN paid_local::time>=time '21:00' THEN
  ((paid_local::date+1)+time '09:00') AT TIME ZONE 'Asia/Jerusalem'
  ELSE coalesce(p_paid_at,p_now) END);
 local_candidate := candidate AT TIME ZONE 'Asia/Jerusalem';
 IF local_candidate::time >= time '21:00' THEN
  RETURN ((local_candidate::date+1)+time '09:00') AT TIME ZONE 'Asia/Jerusalem';
 ELSIF local_candidate::time < time '09:00' THEN
  RETURN (local_candidate::date+time '09:00') AT TIME ZONE 'Asia/Jerusalem';
 END IF;
 RETURN candidate;
END $$;
REVOKE ALL ON FUNCTION clinic_private.sumit_whatsapp_not_before(timestamptz,timestamptz) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.issue_sumit_document(p_invoice_id uuid, p_document_type integer, p_channel text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE inv public.invoices; patient public.patients; existing public.sumit_documents;
 api_key text; request_body jsonb; items jsonb; received_payments jsonb; payment_total numeric; request_id bigint; recipient_phone text; due_at timestamptz;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'גישה לצוות המרפאה בלבד'; END IF;
 IF p_channel NOT IN ('email','whatsapp') OR p_channel IS NULL THEN RAISE EXCEPTION 'יש לבחור ערוץ שליחה'; END IF;
 IF p_document_type NOT IN (1,2) OR p_document_type IS NULL THEN RAISE EXCEPTION 'סוג מסמך אינו נתמך'; END IF;
 SELECT * INTO inv FROM public.invoices WHERE id=p_invoice_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'חיוב לא נמצא'; END IF;
 IF NOT inv.sumit_eligible THEN RAISE EXCEPTION 'חיוב ישן אינו מיועד להעברה ל-SUMIT'; END IF;
 SELECT * INTO existing FROM public.sumit_documents WHERE invoice_id=p_invoice_id;
 IF FOUND AND existing.state <> 'rejected' THEN RETURN to_jsonb(existing); END IF;
 IF inv.status <> 'paid' OR inv.total <= 0 OR inv.amount_paid IS NULL OR abs(inv.amount_paid-inv.total)>0.01 THEN
  RAISE EXCEPTION 'יש לרשום קבלת תשלום מלא לפני הפקת המסמך';
 END IF;
 IF coalesce(inv.currency,'ILS') NOT IN ('ILS','NIS','₪') THEN RAISE EXCEPTION 'נתמכת הפקה בשקלים בלבד'; END IF;
 SELECT * INTO patient FROM public.patients WHERE id=inv.patient_id;
 IF p_channel='email' AND (patient.email IS NULL OR patient.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN
  RAISE EXCEPTION 'יש לעדכן כתובת מייל תקינה בכרטיס המטופל';
 END IF;
 IF p_channel='whatsapp' THEN
  recipient_phone := regexp_replace(coalesce(patient.phone,''),'[^0-9]','','g');
  IF recipient_phone LIKE '00%' THEN recipient_phone:=substr(recipient_phone,3); END IF;
  IF recipient_phone LIKE '0%' THEN recipient_phone:='972'||substr(recipient_phone,2); END IF;
  IF recipient_phone !~ '^[1-9][0-9]{7,14}$' THEN RAISE EXCEPTION 'יש לעדכן מספר טלפון תקין בכרטיס המטופל'; END IF;
  due_at := clinic_private.sumit_whatsapp_not_before(inv.paid_at,now());
 END IF;
 SELECT sum(amount), jsonb_agg(jsonb_build_object('Amount',amount) ||
  CASE payment_method
   WHEN 'cash' THEN jsonb_build_object('Type',2,'Details_Cash','{}'::jsonb)
   WHEN 'bank_transfer' THEN jsonb_build_object('Type',3,'Details_BankTransfer',jsonb_build_object('Reference',payment_reference))
   WHEN 'bit' THEN jsonb_build_object('Type',6,'Details_Digital',jsonb_build_object('Type','bit','Description',payment_reference))
   WHEN 'credit_card' THEN jsonb_build_object('Type',5,'Details_CreditCard','{}'::jsonb)
   WHEN 'paybox' THEN jsonb_build_object('Type',6,'Details_Digital',jsonb_build_object('Type','PayBox','Description',payment_reference))
   ELSE jsonb_build_object('Type',8,'Details_Other',jsonb_build_object('Type',payment_method,'Description',payment_reference))
  END ORDER BY created_at,id) INTO payment_total,received_payments
 FROM public.payments WHERE invoice_id=p_invoice_id AND status='completed' AND amount>0;
 IF payment_total IS NULL THEN
  received_payments := jsonb_build_array(jsonb_build_object('Amount',inv.amount_paid,'Type',1,'Details_General','{}'::jsonb));
 ELSIF abs(payment_total-inv.total)>0.01 THEN
  RAISE EXCEPTION 'סכום רישומי התשלום צריך להתאים לסכום החיוב';
 END IF;
 SELECT jsonb_agg(jsonb_build_object('Quantity',quantity,'UnitPrice',unit_price,'TotalPrice',total,
  'Item',jsonb_build_object('Name',description,'SearchMode',1)) ORDER BY id) INTO items FROM public.invoice_items WHERE invoice_id=p_invoice_id;
 IF p_document_type=1 AND (items IS NULL OR abs((SELECT sum(total) FROM public.invoice_items WHERE invoice_id=p_invoice_id)-inv.total)>0.01) THEN
  RAISE EXCEPTION 'סכום פריטי החיוב צריך להתאים לסכום הכולל';
 END IF;
 SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name='anna_sumit_api_key';
 IF api_key IS NULL THEN RAISE EXCEPTION 'חיבור SUMIT טרם הוגדר'; END IF;
 request_body := jsonb_build_object(
  'Credentials',jsonb_build_object('CompanyID',2284425560,'APIKey',api_key),
  'Details',jsonb_build_object('IsDraft',false,'Type',p_document_type,'Currency',0,
   'ExternalReference','ihaveallergy:'||p_invoice_id::text,
   'Customer',jsonb_build_object('Name',concat_ws(' ',patient.first_name,patient.last_name),
    'EmailAddress',patient.email,'ExternalIdentifier','ihaveallergy:'||patient.id::text,'SearchMode',2),
   'SendByEmail',CASE WHEN p_channel='email' THEN jsonb_build_object('EmailAddress',patient.email,'Original',true,'SendAsPaymentRequest',false) ELSE NULL END),
  'Payments',received_payments,'VATIncluded',true,'VATRate',inv.tax_rate,
  'Items',CASE WHEN p_document_type=1 THEN items ELSE NULL END);
 SELECT net.http_post(url:='https://api.sumit.co.il/accounting/documents/create/',body:=request_body,timeout_milliseconds:=30000) INTO request_id;
 INSERT INTO public.sumit_documents(invoice_id,document_type,state,recipient_email,request_id,created_by,delivery_channel,recipient_phone,delivery_state,delivery_not_before)
 VALUES (p_invoice_id,p_document_type,'pending',patient.email,request_id,auth.uid(),p_channel,recipient_phone,'awaiting_document',due_at)
 ON CONFLICT (invoice_id) DO UPDATE SET document_type=EXCLUDED.document_type,state='pending',
 recipient_email=EXCLUDED.recipient_email,request_id=EXCLUDED.request_id,message=NULL,
 created_at=now(),updated_at=now(),created_by=EXCLUDED.created_by,delivery_channel=EXCLUDED.delivery_channel,
 recipient_phone=EXCLUDED.recipient_phone,delivery_state='awaiting_document',delivery_not_before=EXCLUDED.delivery_not_before RETURNING * INTO existing;
 RETURN to_jsonb(existing);
END $$;

REVOKE ALL ON FUNCTION public.issue_sumit_document(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.issue_sumit_document(uuid,integer,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.issue_sumit_document(p_invoice_id uuid,p_document_type integer)
 RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT public.issue_sumit_document(p_invoice_id,p_document_type,'email');
$$;

CREATE OR REPLACE FUNCTION clinic_private.collect_sumit_results()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE doc record; response record; payload jsonb;
BEGIN
 UPDATE clinic_private.sumit_whatsapp_jobs SET state='needs_review',updated_at=now()
 WHERE state='processing' AND updated_at<now()-interval '10 minutes';
 UPDATE public.sumit_documents d SET delivery_state='needs_review',
 message='סטטוס השליחה בוואטסאפ אינו ודאי. יש לבדוק לפני שליחה נוספת.',updated_at=now()
 FROM clinic_private.sumit_whatsapp_jobs j WHERE j.invoice_id=d.invoice_id AND j.state='needs_review';
 FOR doc IN SELECT * FROM public.sumit_documents WHERE state='pending' FOR UPDATE SKIP LOCKED LOOP
  SELECT * INTO response FROM net._http_response WHERE id=doc.request_id;
  IF NOT FOUND THEN
   IF doc.created_at < now()-interval '10 minutes' THEN
    UPDATE public.sumit_documents SET state='needs_review',message='לא התקבל אישור סופי. יש לבדוק ב-SUMIT לפני הפקה נוספת.',updated_at=now() WHERE invoice_id=doc.invoice_id;
   END IF;
   CONTINUE;
  END IF;
  BEGIN
   payload := response.content::jsonb;
  EXCEPTION WHEN OTHERS THEN payload := '{}'::jsonb;
  END;
  IF response.status_code=200 AND payload->>'Status'='0' AND payload#>>'{Data,DocumentID}' IS NOT NULL THEN
   UPDATE public.sumit_documents SET state='issued',
    document_id=(payload#>>'{Data,DocumentID}')::bigint,
    document_number=payload#>>'{Data,DocumentNumber}',
    download_url=payload#>>'{Data,DocumentDownloadURL}',
    delivery_state=CASE WHEN doc.delivery_channel='email' THEN 'email_queued' ELSE 'scheduled' END,
    message=CASE WHEN doc.delivery_channel='email' THEN 'המסמך הופק והועבר ל-SUMIT לשליחה במייל' ELSE 'המסמך הופק וממתין לשליחה בוואטסאפ' END,updated_at=now() WHERE invoice_id=doc.invoice_id;
   IF doc.delivery_channel='whatsapp' THEN
    IF coalesce(payload#>>'{Data,DocumentDownloadURL}','') LIKE 'https://%' THEN
     INSERT INTO clinic_private.sumit_whatsapp_jobs(invoice_id,phone,body,not_before)
     VALUES(doc.invoice_id,doc.recipient_phone,
      'שלום, מצורף המסמך החשבונאי מהמרפאה של ד״ר אנה ברמלי.'||chr(10)||
      (payload#>>'{Data,DocumentDownloadURL}'),
      clinic_private.sumit_whatsapp_not_before(doc.delivery_not_before,now()))
     ON CONFLICT(invoice_id) DO NOTHING;
     UPDATE public.sumit_documents d SET delivery_not_before=j.not_before
      FROM clinic_private.sumit_whatsapp_jobs j WHERE d.invoice_id=doc.invoice_id AND j.invoice_id=d.invoice_id;
    ELSE
     UPDATE public.sumit_documents SET delivery_state='needs_review',message='המסמך הופק, אך חסר קישור לשליחה. יש לבדוק ב-SUMIT.' WHERE invoice_id=doc.invoice_id;
    END IF;
   END IF;
  ELSIF response.status_code=200 AND payload->>'Status'='1' THEN
   UPDATE public.sumit_documents SET state='rejected',
    message=left(coalesce(payload->>'UserErrorMessage','SUMIT דחתה את בקשת ההפקה'),500),updated_at=now() WHERE invoice_id=doc.invoice_id;
  ELSE
   UPDATE public.sumit_documents SET state='needs_review',message='תוצאת ההפקה אינה ודאית. יש לבדוק ב-SUMIT לפני הפקה נוספת.',updated_at=now() WHERE invoice_id=doc.invoice_id;
  END IF;
 END LOOP;
END $function$;

CREATE OR REPLACE FUNCTION public.claim_clinic_whatsapp_outbox()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE job record;
BEGIN
 SELECT id,phone,body INTO job FROM clinic_private.sumit_whatsapp_jobs
 WHERE state='pending' AND not_before<=now()
 AND (now() AT TIME ZONE 'Asia/Jerusalem')::time >= time '09:00'
 AND (now() AT TIME ZONE 'Asia/Jerusalem')::time < time '21:00'
 ORDER BY not_before,id LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF FOUND THEN
  UPDATE clinic_private.sumit_whatsapp_jobs SET state='processing',updated_at=now() WHERE id=job.id;
  UPDATE public.sumit_documents d SET delivery_state='sending',updated_at=now()
   FROM clinic_private.sumit_whatsapp_jobs j WHERE j.id=job.id AND j.invoice_id=d.invoice_id;
  RETURN to_jsonb(job);
 END IF;
 SELECT o.id,m.id AS message_id,m.body,c.phone INTO job FROM public.whatsapp_outbox o
 JOIN public.whatsapp_messages m ON m.id=o.message_id JOIN public.whatsapp_conversations c ON c.id=m.conversation_id
 WHERE o.state='pending' AND NOT EXISTS(SELECT 1 FROM public.whatsapp_outbox earlier JOIN public.whatsapp_messages em ON em.id=earlier.message_id WHERE em.conversation_id=c.id AND earlier.ordinal<o.ordinal AND earlier.state IN ('pending','processing'))
 ORDER BY o.ordinal LIMIT 1 FOR UPDATE OF o SKIP LOCKED;
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.whatsapp_outbox SET state='processing',updated_at=now() WHERE id=job.id;
 UPDATE public.whatsapp_messages SET status='processing' WHERE id=job.message_id;
 RETURN to_jsonb(job);
END $function$;

CREATE OR REPLACE FUNCTION public.finish_clinic_whatsapp_outbox(p_id uuid, p_provider_id text, p_error text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE mid uuid; cid uuid;
BEGIN
 IF EXISTS(SELECT 1 FROM clinic_private.sumit_whatsapp_jobs WHERE id=p_id) THEN
  UPDATE clinic_private.sumit_whatsapp_jobs SET state=CASE WHEN p_provider_id IS NULL THEN 'needs_review' ELSE 'accepted' END,
   provider_message_id=p_provider_id,updated_at=now() WHERE id=p_id AND state='processing' RETURNING invoice_id INTO mid;
  IF mid IS NOT NULL THEN
   UPDATE public.sumit_documents SET delivery_state=CASE WHEN p_provider_id IS NULL THEN 'needs_review' ELSE 'whatsapp_accepted' END,
    message=CASE WHEN p_provider_id IS NULL THEN 'סטטוס השליחה בוואטסאפ אינו ודאי. יש לבדוק לפני שליחה נוספת.' ELSE 'המסמך נמסר לספק וואטסאפ לשליחה למטופל' END,updated_at=now() WHERE invoice_id=mid;
  END IF;
  RETURN;
 END IF;
 UPDATE public.whatsapp_outbox SET state=CASE WHEN p_provider_id IS NULL THEN 'failed' ELSE 'accepted' END,error_code=p_error,updated_at=now() WHERE id=p_id AND state='processing' RETURNING message_id INTO mid;
 IF mid IS NULL THEN RETURN; END IF;
 UPDATE public.whatsapp_messages SET provider_id=p_provider_id,status=CASE WHEN p_provider_id IS NULL THEN 'failed' ELSE 'accepted' END WHERE id=mid RETURNING conversation_id INTO cid;
 IF p_provider_id IS NULL THEN
   UPDATE public.whatsapp_conversations SET bot_stage='human',unread=true WHERE id=cid;
   UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=cid AND o.state='pending';
   UPDATE public.whatsapp_messages m SET status='cancelled' FROM public.whatsapp_outbox o WHERE o.message_id=m.id AND m.conversation_id=cid AND o.state='cancelled';
 END IF;
END $function$;

CREATE FUNCTION public.record_and_issue_sumit_document(p_invoice_id uuid,p_method text,p_reference text,p_document_type integer,p_channel text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 PERFORM public.record_external_invoice_payment(p_invoice_id,p_method,p_reference);
 RETURN public.issue_sumit_document(p_invoice_id,p_document_type,p_channel);
END $$;
REVOKE ALL ON FUNCTION public.record_and_issue_sumit_document(uuid,text,text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_and_issue_sumit_document(uuid,text,text,integer,text) TO authenticated;
