BEGIN;
ALTER TABLE clinic_private.referral_settings ADD COLUMN public_started_at timestamptz;
ALTER TABLE clinic_private.referral_flows DROP CONSTRAINT referral_flows_source_check;
ALTER TABLE clinic_private.referral_flows ADD CONSTRAINT referral_flows_source_check CHECK(source IN ('contact_form','phone_ivr','whatsapp_inbound'));
ALTER FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) RENAME TO receive_clinic_whatsapp_before_inbound;
CREATE FUNCTION public.receive_clinic_whatsapp(p_phone text,p_provider_id text,p_body text,p_type text,p_timestamp timestamptz,p_from_staff boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cid uuid; mid uuid;
BEGIN
 PERFORM public.receive_clinic_whatsapp_before_inbound(p_phone,p_provider_id,p_body,p_type,p_timestamp,p_from_staff);
 IF p_from_staff OR p_type<>'text' OR trim(p_body)='' THEN RETURN; END IF;
 IF NOT EXISTS(SELECT 1 FROM clinic_private.referral_settings WHERE singleton AND enabled AND ai_enabled AND public_started_at IS NOT NULL AND p_timestamp>=public_started_at AND (NOT test_mode OR test_phone=p_phone)) THEN RETURN; END IF;
 SELECT id INTO cid FROM public.whatsapp_conversations WHERE phone=p_phone AND NOT opted_out AND whatsapp_consent_withdrawn_at IS NULL AND bot_started_at IS NULL FOR UPDATE;
 IF cid IS NULL OR EXISTS(SELECT 1 FROM clinic_private.referral_flows WHERE conversation_id=cid) THEN RETURN; END IF;
 SELECT id INTO mid FROM public.whatsapp_messages WHERE conversation_id=cid AND provider_id=p_provider_id AND direction='incoming';
 IF mid IS NULL OR EXISTS(SELECT 1 FROM public.whatsapp_messages WHERE conversation_id=cid AND id<>mid) THEN RETURN; END IF;
 IF lower(trim(p_body)) IN ('עצור','הסר','הסרה','stop','unsubscribe','ביטול','נציג','נציג אנושי','מענה אנושי','בן אדם','human') THEN RETURN; END IF;
 INSERT INTO clinic_private.referral_flows(conversation_id,source,state,due_at,created_at,ai_input_id,ai_questions)
 VALUES(cid,'whatsapp_inbound','ai_pending',now(),least(p_timestamp,now()),mid,ARRAY['phone_opening']);
 UPDATE public.whatsapp_conversations SET bot_started_at=now(),whatsapp_consent_at=now(),whatsapp_consent_scope='inbound_service_reply' WHERE id=cid;
END $$;
REVOKE ALL ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.receive_clinic_whatsapp(text,text,text,text,timestamptz,boolean) TO service_role;
UPDATE clinic_private.referral_settings SET enabled=true,ai_enabled=true,test_mode=false,public_started_at=clock_timestamp() WHERE singleton;
COMMIT;
