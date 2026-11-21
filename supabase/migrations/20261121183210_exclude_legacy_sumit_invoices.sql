-- Freeze existing test invoices out of the accounting integration.
ALTER TABLE public.invoices ADD COLUMN sumit_eligible boolean NOT NULL DEFAULT false;
ALTER TABLE public.invoices ALTER COLUMN sumit_eligible SET DEFAULT true;
CREATE OR REPLACE FUNCTION clinic_private.protect_sumit_eligibility() RETURNS trigger
 LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.sumit_eligible IS DISTINCT FROM OLD.sumit_eligible THEN
  RAISE EXCEPTION 'לא ניתן לשנות זכאות חיוב להעברה ל-SUMIT';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clinic_private.protect_sumit_eligibility() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_sumit_eligibility BEFORE UPDATE ON public.invoices
 FOR EACH ROW EXECUTE FUNCTION clinic_private.protect_sumit_eligibility();
CREATE OR REPLACE FUNCTION public.issue_sumit_document(p_invoice_id uuid, p_document_type integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE inv public.invoices; patient public.patients; existing public.sumit_documents;
 api_key text; request_body jsonb; items jsonb; received_payments jsonb; payment_total numeric; request_id bigint;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'גישה לצוות המרפאה בלבד'; END IF;
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
 IF patient.email IS NULL OR patient.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
  RAISE EXCEPTION 'יש לעדכן כתובת מייל תקינה בכרטיס המטופל';
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
   'SendByEmail',jsonb_build_object('EmailAddress',patient.email,'Original',true,'SendAsPaymentRequest',false)),
  'Payments',received_payments,'VATIncluded',true,'VATRate',inv.tax_rate,
  'Items',CASE WHEN p_document_type=1 THEN items ELSE NULL END);
 SELECT net.http_post(url:='https://api.sumit.co.il/accounting/documents/create/',body:=request_body,timeout_milliseconds:=30000) INTO request_id;
 INSERT INTO public.sumit_documents(invoice_id,document_type,state,recipient_email,request_id,created_by)
 VALUES (p_invoice_id,p_document_type,'pending',patient.email,request_id,auth.uid())
 ON CONFLICT (invoice_id) DO UPDATE SET document_type=EXCLUDED.document_type,state='pending',
 recipient_email=EXCLUDED.recipient_email,request_id=EXCLUDED.request_id,message=NULL,
 created_at=now(),updated_at=now(),created_by=EXCLUDED.created_by RETURNING * INTO existing;
 RETURN to_jsonb(existing);
END $$;
