import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  patientId: string;
  email: string;
  clinicId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { patientId, email, clinicId }: VerificationRequest = await req.json();

    if (!patientId || !email) {
      return new Response(
        JSON.stringify({ error: "חסרים פרטים נדרשים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "כתובת אימייל לא תקינה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email is already verified for this patient
    const { data: existingVerification } = await supabase
      .from("email_verifications")
      .select("id, verified_at")
      .eq("patient_id", patientId)
      .eq("email", email)
      .not("verified_at", "is", null)
      .maybeSingle();

    if (existingVerification) {
      return new Response(
        JSON.stringify({ error: "האימייל כבר אומת", code: "ALREADY_VERIFIED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get clinic information for the email (no PHI, only context)
    let clinicName = "מרפאת ד\"ר אנה ברמלי";
    let clinicAddress = "";

    if (clinicId) {
      const { data: clinic } = await supabase
        .from("clinics")
        .select("name, address, city")
        .eq("id", clinicId)
        .maybeSingle();

      if (clinic) {
        clinicName = clinic.name;
        clinicAddress = [clinic.address, clinic.city].filter(Boolean).join(", ");
      }
    }

    // Generate secure one-time token
    const token = crypto.randomUUID().replace(/-/g, '') + 
                  crypto.randomUUID().replace(/-/g, '') +
                  crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    // Set expiry to 24 hours (ISO 27799 compliant short TTL)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Delete any existing pending verifications for this patient+email
    await supabase
      .from("email_verifications")
      .delete()
      .eq("patient_id", patientId)
      .eq("email", email)
      .is("verified_at", null);

    // Create new verification record
    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        token,
        patient_id: patientId,
        email,
        clinic_id: clinicId,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error("Error creating verification:", insertError);
      return new Response(
        JSON.stringify({ error: "שגיאה ביצירת אימות" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send verification email
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "שירות האימייל לא מוגדר" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const siteUrl = Deno.env.get("SITE_URL") || "https://ftatmcyrmeyhghgckvbj.lovable.app";
    const verifyLink = `${siteUrl}/verify-email?token=${token}`;

    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
  <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #1e40af; margin: 0; font-size: 24px;">🔐 אימות כתובת אימייל</h1>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">שלום,</p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      קיבלת הודעה זו כדי לאמת את כתובת האימייל שלך במערכת שלנו.
    </p>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0; border-right: 4px solid #2563eb;">
      <p style="color: #1e40af; margin: 0; font-size: 15px;">
        <strong>למה צריך אימות?</strong><br>
        אימות האימייל מאפשר לנו לזהות אותך אוטומטית בביקורים הבאים ולמנוע יצירת רשומות כפולות.
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyLink}" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        אמת אימייל
      </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        <strong>${clinicName}</strong>
        ${clinicAddress ? `<br>${clinicAddress}` : ''}
      </p>
    </div>
    
    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
      קישור זה יפוג תוך 24 שעות.<br>
      אם לא ביקשת אימות זה, ניתן להתעלם מהודעה זו.
    </p>
  </div>
</body>
</html>`;

    const emailRes = await resend.emails.send({
      from: "מרפאת ד\"ר אנה ברמלי <info@ihaveallergy.com>",
      to: [email],
      subject: "אימות כתובת אימייל",
      html: emailHtml,
    });

    console.log("Email verification sent:", emailRes);

    return new Response(
      JSON.stringify({ success: true, message: "אימייל אימות נשלח בהצלחה" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-email-verification:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בשליחת אימות" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
