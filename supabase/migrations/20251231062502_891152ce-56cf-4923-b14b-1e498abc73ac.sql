-- Create a function to enforce patient field restrictions on UPDATE
-- Patients can only update non-clinical, non-identity fields
-- Staff retain full UPDATE permissions
CREATE OR REPLACE FUNCTION public.enforce_patient_field_restrictions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only apply restrictions if the user is not staff
  IF NOT is_staff(auth.uid()) THEN
    -- Revert clinical and identity fields to original values (ISO 27799 protected)
    -- Identity fields
    NEW.id_number := OLD.id_number;
    NEW.first_name := OLD.first_name;
    NEW.last_name := OLD.last_name;
    NEW.date_of_birth := OLD.date_of_birth;
    NEW.gender := OLD.gender;
    
    -- Insurance fields
    NEW.insurance_number := OLD.insurance_number;
    NEW.insurance_provider := OLD.insurance_provider;
    
    -- Clinical fields
    NEW.allergies := OLD.allergies;
    NEW.allergy_severity := OLD.allergy_severity;
    NEW.allergy_reaction_type := OLD.allergy_reaction_type;
    NEW.chronic_conditions := OLD.chronic_conditions;
    NEW.current_medications := OLD.current_medications;
    NEW.medical_notes := OLD.medical_notes;
    NEW.previous_surgeries := OLD.previous_surgeries;
    NEW.family_medical_history := OLD.family_medical_history;
    NEW.family_history_father := OLD.family_history_father;
    NEW.family_history_mother := OLD.family_history_mother;
    NEW.family_history_other := OLD.family_history_other;
    NEW.main_complaint := OLD.main_complaint;
    NEW.symptoms_duration := OLD.symptoms_duration;
    NEW.previous_treatments := OLD.previous_treatments;
    NEW.treatment_goals := OLD.treatment_goals;
    
    -- Consent/GDPR fields (managed through proper flows only)
    NEW.consent_signed := OLD.consent_signed;
    NEW.consent_signed_at := OLD.consent_signed_at;
    NEW.gdpr_consent := OLD.gdpr_consent;
    NEW.gdpr_consent_at := OLD.gdpr_consent_at;
    
    -- Administrative fields
    NEW.intake_completed_at := OLD.intake_completed_at;
    NEW.intake_token_id := OLD.intake_token_id;
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
    NEW.user_id := OLD.user_id;
    NEW.clinic_id := OLD.clinic_id;
    NEW.status := OLD.status;
    NEW.referral_source := OLD.referral_source;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger (drop if exists for idempotency)
DROP TRIGGER IF EXISTS enforce_patient_field_restrictions_trigger ON public.patients;

CREATE TRIGGER enforce_patient_field_restrictions_trigger
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_patient_field_restrictions();

-- Add comment for documentation
COMMENT ON FUNCTION public.enforce_patient_field_restrictions() IS 
'ISO 27799 compliance: Restricts patient self-updates to non-clinical, non-identity fields only. 
Patients can update: phone, email, address, city, emergency_contact_name, emergency_contact_phone, 
preferred_contact_method, preferred_contact_time, occupation, marital_status, num_children, 
smoking_status, alcohol_consumption, exercise_frequency, stress_level, sleep_hours.
Staff retain full UPDATE permissions.';