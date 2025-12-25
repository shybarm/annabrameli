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
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First validate the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("intake_tokens")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .is("completed_at", null)
      .maybeSingle();

    if (tokenError) {
      console.error("Token validation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Error validating token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", valid: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If token has a patient_id, fetch patient data
    let patientData = null;
    if (tokenData.patient_id) {
      const { data: patient, error: patientError } = await supabaseAdmin
        .from("patients")
        .select("*")
        .eq("id", tokenData.patient_id)
        .maybeSingle();

      if (patientError) {
        console.error("Patient fetch error:", patientError);
      } else {
        patientData = patient;
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        tokenData: {
          id: tokenData.id,
          patient_id: tokenData.patient_id,
          expires_at: tokenData.expires_at,
        },
        patientData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-intake-patient:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
