import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize phone to E.164 format for Israel
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  
  if (normalized.startsWith('0')) {
    normalized = '+972' + normalized.substring(1);
  } else if (normalized.startsWith('972')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+972' + normalized;
  }
  
  return normalized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioVerifyServiceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      console.error("Twilio Verify credentials not configured");
      return new Response(
        JSON.stringify({ error: "Verification service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Find the most recent OTP request for rate limiting check
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: otpRecord, error: findError } = await supabase
      .from("booking_otp")
      .select("*")
      .eq("phone", normalizedPhone)
      .eq("verified", false)
      .gte("created_at", tenMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Error finding OTP record:", findError);
    }

    // Check max attempts (5) from our tracking
    if (otpRecord && otpRecord.attempts >= 5) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "יותר מדי ניסיונות שגויים. בקש קוד חדש.",
          code: "MAX_ATTEMPTS"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment attempts in our tracking
    if (otpRecord) {
      await supabase
        .from("booking_otp")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);
    }

    // Verify OTP via Twilio Verify API
    const verifyCheckUrl = `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/VerificationCheck`;
    
    const checkResponse = await fetch(verifyCheckUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        Code: otp,
      }),
    });

    if (!checkResponse.ok) {
      const checkError = await checkResponse.text();
      console.error("Twilio Verify check error:", checkError);
      
      // Parse Twilio error to provide better feedback
      try {
        const errorJson = JSON.parse(checkError);
        if (errorJson.code === 20404) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: "קוד האימות פג תוקף. בקש קוד חדש.",
              code: "EXPIRED"
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        // Ignore parse error
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "שגיאה באימות הקוד",
          code: "VERIFY_ERROR"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const checkResult = await checkResponse.json();
    console.log(`Verification check for ${normalizedPhone.substring(0, 8)}..., status: ${checkResult.status}`);

    if (checkResult.status !== 'approved') {
      const remainingAttempts = otpRecord ? (4 - otpRecord.attempts) : 4;
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `קוד שגוי. נותרו ${Math.max(0, remainingAttempts)} ניסיונות.`,
          code: "INVALID",
          remainingAttempts: Math.max(0, remainingAttempts)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as verified and generate verification token
    const verificationToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for booking

    if (otpRecord) {
      await supabase
        .from("booking_otp")
        .update({ 
          verified: true,
          verification_token: verificationToken,
          token_expires_at: tokenExpiresAt.toISOString()
        })
        .eq("id", otpRecord.id);
    }

    console.log(`Phone verified via Twilio Verify: ${normalizedPhone.substring(0, 8)}...`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true,
        verificationToken,
        message: "הטלפון אומת בהצלחה"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});