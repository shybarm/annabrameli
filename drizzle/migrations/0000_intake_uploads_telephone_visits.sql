ALTER TABLE public.appointments ADD COLUMN modality text NOT NULL DEFAULT 'in_person', ADD COLUMN meeting_url text;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_modality_valid CHECK (modality IN ('in_person','telephone')), ADD CONSTRAINT appointments_meeting_url_valid CHECK (meeting_url IS NULL OR (modality = 'telephone' AND meeting_url ~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$'));
CREATE UNIQUE INDEX appointments_meeting_url_unique ON public.appointments(meeting_url) WHERE meeting_url IS NOT NULL;
ALTER TABLE public.patient_documents ADD COLUMN upload_key text;
CREATE UNIQUE INDEX patient_documents_upload_key_unique ON public.patient_documents(upload_key) WHERE upload_key IS NOT NULL;
CREATE OR REPLACE FUNCTION public.finish_patient_intake(p_token text, p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.intake_tokens; p public.patients;
BEGIN
 SELECT * INTO t FROM public.intake_tokens WHERE token=p_token AND expires_at>now() AND completed_at IS NULL AND patient_id IS NOT NULL FOR UPDATE;
 IF t.id IS NULL THEN RAISE EXCEPTION 'INVALID_TOKEN'; END IF;
 SELECT * INTO p FROM public.patients WHERE id=t.patient_id FOR UPDATE;
 IF p.id IS NULL THEN RAISE EXCEPTION 'INVALID_PATIENT'; END IF;
 p := jsonb_populate_record(p,p_data);
 UPDATE public.patients SET first_name=p.first_name,last_name=p.last_name,id_number=p.id_number,date_of_birth=p.date_of_birth,gender=p.gender,phone=p.phone,email=p.email,address=p.address,city=p.city,occupation=p.occupation,marital_status=p.marital_status,num_children=p.num_children,referral_source=p.referral_source,emergency_contact_name=p.emergency_contact_name,emergency_contact_phone=p.emergency_contact_phone,insurance_provider=p.insurance_provider,insurance_number=p.insurance_number,allergies=p.allergies,chronic_conditions=p.chronic_conditions,current_medications=p.current_medications,previous_surgeries=p.previous_surgeries,family_history_father=p.family_history_father,family_history_mother=p.family_history_mother,family_history_other=p.family_history_other,smoking_status=p.smoking_status,alcohol_consumption=p.alcohol_consumption,exercise_frequency=p.exercise_frequency,sleep_hours=p.sleep_hours,stress_level=p.stress_level,main_complaint=p.main_complaint,symptoms_duration=p.symptoms_duration,previous_treatments=p.previous_treatments,treatment_goals=p.treatment_goals,preferred_contact_method=p.preferred_contact_method,preferred_contact_time=p.preferred_contact_time,medical_notes=p.medical_notes,consent_signed=true,consent_signed_at=now(),gdpr_consent=true,gdpr_consent_at=now(),intake_completed_at=now(),intake_token_id=t.id WHERE id=t.patient_id;
 UPDATE public.intake_tokens SET completed_at=now() WHERE id=t.id;
 RETURN t.patient_id;
END $$;
REVOKE ALL ON FUNCTION public.finish_patient_intake(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_patient_intake(text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.record_token_document(p_token text,p_kind text,p_patient_id uuid,p_key text,p_path text,p_title text,p_mime text,p_size integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid; did uuid;
BEGIN
 IF p_kind='intake' THEN
 SELECT id INTO tid FROM public.intake_tokens WHERE token=p_token AND patient_id=p_patient_id AND expires_at>now() AND completed_at IS NULL FOR UPDATE;
 ELSIF p_kind='guest' THEN
 SELECT id INTO tid FROM public.upload_tokens WHERE token=p_token AND patient_id=p_patient_id AND expires_at>now() AND used_at IS NULL FOR UPDATE;
 END IF;
 IF tid IS NULL THEN RAISE EXCEPTION 'INVALID_TOKEN'; END IF;
 IF p_size<1 OR p_size>10485760 OR p_mime NOT IN ('image/jpeg','image/png','image/webp','application/pdf') OR p_path NOT LIKE p_patient_id::text || '/%' THEN RAISE EXCEPTION 'INVALID_FILE'; END IF;
 SELECT id INTO did FROM public.patient_documents WHERE upload_key=p_key AND patient_id=p_patient_id;
 IF did IS NULL THEN
 INSERT INTO public.patient_documents(patient_id,title,document_type,file_path,file_size,mime_type,upload_key) VALUES(p_patient_id,left(p_title,255),'other',p_path,p_size,p_mime,p_key) RETURNING id INTO did;
 END IF;
 INSERT INTO public.file_scan_queue(document_id,file_path,scan_status) VALUES(did,p_path,'pending') ON CONFLICT(document_id) DO NOTHING;
 RETURN did;
END $$;
REVOKE ALL ON FUNCTION public.record_token_document(text,text,uuid,text,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_token_document(text,text,uuid,text,text,text,text,integer) TO service_role;