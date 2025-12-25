import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, formData } = await req.json();

    if (!token || !formData) {
      return new Response(
        JSON.stringify({ error: "Token and form data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("intake_tokens")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .is("completed_at", null)
      .maybeSingle();

    if (tokenError || !tokenData) {
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

    // Prepare patient update data
    const updateData: any = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      id_number: formData.id_number || null,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      city: formData.city || null,
      occupation: formData.occupation || null,
      marital_status: formData.marital_status || null,
      num_children: formData.num_children ? parseInt(formData.num_children) : null,
      referral_source: formData.referral_source || null,
      emergency_contact_name: formData.emergency_contact_name || null,
      emergency_contact_phone: formData.emergency_contact_phone || null,
      insurance_provider: formData.insurance_provider || null,
      insurance_number: formData.insurance_number || null,
      allergies: formData.allergies ? formData.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : null,
      chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map((c: string) => c.trim()).filter(Boolean) : null,
      current_medications: formData.current_medications || null,
      previous_surgeries: formData.previous_surgeries || null,
      family_medical_history: formData.family_medical_history || null,
      smoking_status: formData.smoking_status || null,
      alcohol_consumption: formData.alcohol_consumption || null,
      exercise_frequency: formData.exercise_frequency || null,
      sleep_hours: formData.sleep_hours ? parseInt(formData.sleep_hours) : null,
      stress_level: formData.stress_level || null,
      main_complaint: formData.main_complaint || null,
      symptoms_duration: formData.symptoms_duration || null,
      previous_treatments: formData.previous_treatments || null,
      treatment_goals: formData.treatment_goals || null,
      preferred_contact_method: formData.preferred_contact_method || null,
      preferred_contact_time: formData.preferred_contact_time || null,
      medical_notes: formData.medical_notes || null,
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
    const { error: tokenUpdateError } = await supabaseAdmin
      .from("intake_tokens")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    if (tokenUpdateError) {
      console.error("Token completion error:", tokenUpdateError);
    }

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
