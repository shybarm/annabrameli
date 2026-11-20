-- Keep one delivery job per telephone appointment. Recipient and links are
-- resolved at delivery time so corrections or cancellations can be honored.
CREATE TABLE public.telephone_whatsapp_deliveries (
  appointment_id uuid PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','accepted','delivered','failed','cancelled')),
  provider_message_id text UNIQUE
);
ALTER TABLE public.telephone_whatsapp_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.telephone_whatsapp_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.telephone_whatsapp_deliveries TO service_role;

CREATE FUNCTION public.queue_telephone_whatsapp_delivery() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.telephone_whatsapp_deliveries(appointment_id)
  VALUES (NEW.id) ON CONFLICT (appointment_id) DO NOTHING;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.queue_telephone_whatsapp_delivery() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER queue_new_telephone_whatsapp
AFTER INSERT OR UPDATE OF modality ON public.appointments
FOR EACH ROW WHEN (NEW.modality='telephone' AND NEW.status IN ('scheduled','confirmed') AND NEW.scheduled_at > now())
EXECUTE FUNCTION public.queue_telephone_whatsapp_delivery();
