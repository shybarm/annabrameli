import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "חסר טוקן אימות", code: "MISSING_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the verification record
    const { data: verification, error: verifyError } = await supabase
      .from("email_verifications")
      .select("id, patient_id, email, expires_at, verified_at")
      .eq("token", token)
      .maybeSingle();

    if (verifyError || !verification) {
      console.error("Verification lookup error:", verifyError);
      return new Response(
        JSON.stringify({ error: "הקישור לא תקין או שפג תוקפו", code: "INVALID_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified (one-time use)
    if (verification.verified_at) {
      return new Response(
        JSON.stringify({ error: "הקישור כבר נוצל", code: "ALREADY_USED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "הקישור פג תוקף", code: "EXPIRED_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark verification as used
    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Error marking verification as used:", updateError);
      return new Response(
        JSON.stringify({ error: "שגיאה באימות" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there are other patients with the same email that could be merged
    // This is for deduplication - find other patient records with matching email
    const { data: matchingPatients } = await supabase
      .from("patients")
      .select("id")
      .eq("email", verification.email)
      .neq("id", verification.patient_id);

    // Log deduplication opportunity (actual merging would be a staff action)
    if (matchingPatients && matchingPatients.length > 0) {
      console.log(`Deduplication opportunity: Patient ${verification.patient_id} verified email ${verification.email}, found ${matchingPatients.length} other patient(s) with same email.`);
    }

    console.log(`Email verified successfully: patient=${verification.patient_id}, email=${verification.email}`);

    // Return success without exposing any PHI
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "האימייל אומת בהצלחה"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verify-email-token:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בשרת" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
