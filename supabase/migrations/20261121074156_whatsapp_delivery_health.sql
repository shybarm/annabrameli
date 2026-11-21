BEGIN;
ALTER TABLE public.whatsapp_bot_settings ADD COLUMN last_incoming_at timestamptz, ADD COLUMN quota_exceeded_at timestamptz;
GRANT SELECT(setup_state,updated_at,last_incoming_at,quota_exceeded_at) ON public.whatsapp_bot_settings TO authenticated;
CREATE POLICY "Staff read WhatsApp connection health" ON public.whatsapp_bot_settings FOR SELECT TO authenticated USING(public.can_edit_appointments(auth.uid()));
CREATE OR REPLACE FUNCTION public.finish_clinic_whatsapp_outbox(p_id uuid,p_provider_id text,p_error text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE mid uuid; cid uuid;
BEGIN
 UPDATE public.whatsapp_outbox SET state=CASE WHEN p_provider_id IS NULL THEN 'failed' ELSE 'accepted' END,error_code=p_error,updated_at=now() WHERE id=p_id AND state='processing' RETURNING message_id INTO mid;
 IF mid IS NULL THEN RETURN; END IF;
 UPDATE public.whatsapp_messages SET provider_id=p_provider_id,status=CASE WHEN p_provider_id IS NULL THEN 'failed' ELSE 'accepted' END WHERE id=mid RETURNING conversation_id INTO cid;
 IF p_provider_id IS NULL THEN
   UPDATE public.whatsapp_conversations SET bot_stage='human',unread=true WHERE id=cid;
   UPDATE public.whatsapp_outbox o SET state='cancelled' FROM public.whatsapp_messages m WHERE m.id=o.message_id AND m.conversation_id=cid AND o.state='pending';
   UPDATE public.whatsapp_messages m SET status='cancelled' FROM public.whatsapp_outbox o WHERE o.message_id=m.id AND m.conversation_id=cid AND o.state='cancelled';
 END IF;
END $$;
COMMIT;
