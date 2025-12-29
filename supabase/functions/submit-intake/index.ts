import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, validateInput, createAuditLog } from "../_shared/security-utils.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rate-limiter.ts";

// Input validation schema
const INTAKE_SCHEMA = {
  required: ['token', 'formData'],
  maxLength: {
    'first_name': 100,
    'last_name': 100,
    'phone': 20,
    'email': 255,
    'address': 500,
    'city': 100,
    'id_number': 20,
    'medical_notes': 5000,
    'main_complaint': 2000,
    'treatment_goals': 2000,
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit(supabaseAdmin, clientId, 'submit-intake');
    
    if (!rateLimit.allowed) {
      createAuditLog('submit-intake', 'rate_limit_exceeded', undefined, { clientId: clientId.substring(0, 20) });
      return createRateLimitResponse(rateLimit.resetIn);
    }

    const body = await req.json();
    const { token, formData } = body;

    // Validate input
    const validation = validateInput(body, { required: ['token', 'formData'] });
    if (!validation.valid) {
      createAuditLog('submit-intake', 'validation_failed', undefined, { error: validation.error });
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("intake_tokens")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .is("completed_at", null)
      .maybeSingle();

    if (tokenError || !tokenData) {
      createAuditLog('submit-intake', 'invalid_token', undefined, { tokenPrefix: token?.substring(0, 8) });
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokenData.patient_id) {
      return new Response(
        JSON.stringify({ error: "No patient associated with this token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Sanitize and validate form data lengths
    const sanitizeString = (val: unknown, maxLen: number): string | null => {
      if (typeof val !== 'string') return null;
      return val.trim().substring(0, maxLen) || null;
    };

    const sanitizeInt = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseInt(String(val), 10);
      return isNaN(num) ? null : num;
    };

    // Prepare patient update data with sanitization
    const updateData: Record<string, unknown> = {
      first_name: sanitizeString(formData.first_name, 100) || 'Unknown',
      last_name: sanitizeString(formData.last_name, 100) || 'Unknown',
      id_number: sanitizeString(formData.id_number, 20),
      date_of_birth: formData.date_of_birth || null,
      gender: sanitizeString(formData.gender, 20),
      phone: sanitizeString(formData.phone, 20),
      email: sanitizeString(formData.email, 255),
      address: sanitizeString(formData.address, 500),
      city: sanitizeString(formData.city, 100),
      occupation: sanitizeString(formData.occupation, 100),
      marital_status: sanitizeString(formData.marital_status, 50),
      num_children: sanitizeInt(formData.num_children),
      referral_source: sanitizeString(formData.referral_source, 100),
      emergency_contact_name: sanitizeString(formData.emergency_contact_name, 100),
      emergency_contact_phone: sanitizeString(formData.emergency_contact_phone, 20),
      insurance_provider: sanitizeString(formData.insurance_provider, 100),
      insurance_number: sanitizeString(formData.insurance_number, 50),
      allergies: formData.allergies ? String(formData.allergies).split(',').map((a: string) => a.trim().substring(0, 100)).filter(Boolean).slice(0, 50) : null,
      chronic_conditions: formData.chronic_conditions ? String(formData.chronic_conditions).split(',').map((c: string) => c.trim().substring(0, 100)).filter(Boolean).slice(0, 50) : null,
      current_medications: sanitizeString(formData.current_medications, 2000),
      previous_surgeries: sanitizeString(formData.previous_surgeries, 2000),
      family_history_father: sanitizeString(formData.family_history_father, 1000),
      family_history_mother: sanitizeString(formData.family_history_mother, 1000),
      family_history_other: sanitizeString(formData.family_history_other, 1000),
      smoking_status: sanitizeString(formData.smoking_status, 50),
      alcohol_consumption: sanitizeString(formData.alcohol_consumption, 50),
      exercise_frequency: sanitizeString(formData.exercise_frequency, 50),
      sleep_hours: sanitizeInt(formData.sleep_hours),
      stress_level: sanitizeString(formData.stress_level, 50),
      main_complaint: sanitizeString(formData.main_complaint, 2000),
      symptoms_duration: sanitizeString(formData.symptoms_duration, 200),
      previous_treatments: sanitizeString(formData.previous_treatments, 2000),
      treatment_goals: sanitizeString(formData.treatment_goals, 2000),
      preferred_contact_method: sanitizeString(formData.preferred_contact_method, 50),
      preferred_contact_time: sanitizeString(formData.preferred_contact_time, 50),
      medical_notes: sanitizeString(formData.medical_notes, 5000),
      consent_signed: true,
      consent_signed_at: new Date().toISOString(),
      gdpr_consent: true,
      gdpr_consent_at: new Date().toISOString(),
      intake_completed_at: new Date().toISOString(),
      intake_token_id: tokenData.id,
    };

    // Update patient record
    const { data: updatedPatient, error: updateError } = await supabaseAdmin
      .from("patients")
      .update(updateData)
      .eq("id", tokenData.patient_id)
      .select()
      .single();

    if (updateError) {
      console.error("Patient update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update patient record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as completed
    await supabaseAdmin
      .from("intake_tokens")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    createAuditLog('submit-intake', 'intake_completed', undefined, { 
      patientId: tokenData.patient_id,
      tokenId: tokenData.id 
    });

    return new Response(
      JSON.stringify({
        success: true,
        patientId: tokenData.patient_id,
        patientName: `${updateData.first_name} ${updateData.last_name}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in submit-intake:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});