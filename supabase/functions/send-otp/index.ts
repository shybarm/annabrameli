import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize phone to E.164 format for Israel
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle Israeli phone numbers
  if (normalized.startsWith('0')) {
    // Israeli local format: 05xxxxxxxx -> +9725xxxxxxxx
    normalized = '+972' + normalized.substring(1);
  } else if (normalized.startsWith('972') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+')) {
    // Assume Israeli number without prefix
    normalized = '+972' + normalized;
  }
  
  return normalized;
}

// Validate E.164 phone format
function isValidE164(phone: string): boolean {
  // E.164: + followed by 1-15 digits
  return /^\+[1-9]\d{1,14}$/.test(phone);
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
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    
    // Validate phone format
    if (!isValidE164(normalizedPhone)) {
      console.error("Invalid phone format after normalization:", normalizedPhone);
      return new Response(
        JSON.stringify({ error: "מספר טלפון לא תקין", code: "INVALID_PHONE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Processing OTP request for phone: ${normalizedPhone.substring(0, 7)}...`);
    
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 'unknown';

    // Rate limiting: max 3 OTP requests per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOtps, error: countError } = await supabase
      .from("booking_otp")
      .select("id")
      .eq("phone", normalizedPhone)
      .gte("created_at", tenMinutesAgo);

    if (countError) {
      console.error("Error checking rate limit:", countError);
    }

    if (recentOtps && recentOtps.length >= 3) {
      console.log(`Rate limit exceeded for phone: ${normalizedPhone.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "יותר מדי בקשות. נסה שוב בעוד מספר דקות.",
          code: "RATE_LIMIT"
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check resend cooldown: 60 seconds between requests
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentSend } = await supabase
      .from("booking_otp")
      .select("id")
      .eq("phone", normalizedPhone)
      .gte("created_at", oneMinuteAgo)
      .limit(1)
      .maybeSingle();

    if (recentSend) {
      const cooldownRemaining = 60;
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "המתן דקה לפני שליחת קוד חדש",
          code: "COOLDOWN",
          remainingSeconds: cooldownRemaining
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP via Twilio Verify API
    const verifyUrl = `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/Verifications`;
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        Channel: 'sms',
      }),
    });

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.json();
      console.error("Twilio Verify error details:", JSON.stringify(verifyError));
      console.error("Phone sent to Twilio:", normalizedPhone);
      console.error("Service SID used:", twilioVerifyServiceSid?.substring(0, 10) + "...");
      
      // Return more specific error based on Twilio error code
      if (verifyError.code === 60200) {
        return new Response(
          JSON.stringify({ 
            error: "מספר טלפון לא נתמך או שגוי", 
            code: "INVALID_PHONE_TWILIO",
            details: verifyError.message 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "שגיאה בשליחת קוד אימות" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifyResult = await verifyResponse.json();
    console.log(`OTP sent via Twilio Verify to ${normalizedPhone.substring(0, 8)}..., status: ${verifyResult.status}`);

    // Store OTP request in database for rate limiting tracking
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await supabase
      .from("booking_otp")
      .insert({
        phone: normalizedPhone,
        otp_hash: 'verify_' + verifyResult.sid, // Store Verify SID for reference
        expires_at: expiresAt.toISOString(),
        ip_address: ip.substring(0, 45),
        attempts: 0
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "קוד נשלח בהצלחה",
        phone: normalizedPhone.substring(0, 6) + '****' + normalizedPhone.slice(-2)
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