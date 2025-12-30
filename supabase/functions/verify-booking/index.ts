import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { token, action } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "חסר טוקן אימות", code: "MISSING_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle resend action
    if (action === "resend") {
      // Find the verification record
      const { data: verification, error: verifyError } = await supabase
        .from("booking_verifications")
        .select("*, appointments(id, scheduled_at, appointment_types(name_he)), patients:appointments(patient_id, patients(first_name, email))")
        .eq("token", token)
        .is("used_at", null)
        .single();

      if (verifyError || !verification) {
        console.error("Verification lookup error:", verifyError);
        return new Response(
          JSON.stringify({ error: "הקישור לא תקין או שפג תוקפו", code: "INVALID_TOKEN" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check 60-second cooldown
      if (verification.last_resend_at) {
        const lastResend = new Date(verification.last_resend_at);
        const now = new Date();
        const secondsSinceLastResend = (now.getTime() - lastResend.getTime()) / 1000;
        
        if (secondsSinceLastResend < 60) {
          const waitSeconds = Math.ceil(60 - secondsSinceLastResend);
          return new Response(
            JSON.stringify({ 
              error: `יש להמתין ${waitSeconds} שניות לפני שליחה חוזרת`, 
              code: "COOLDOWN",
              waitSeconds 
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const newExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const { error: updateError } = await supabase
        .from("booking_verifications")
        .update({
          token: newToken,
          expires_at: newExpiry.toISOString(),
          last_resend_at: new Date().toISOString()
        })
        .eq("id", verification.id);

      if (updateError) {
        console.error("Token update error:", updateError);
        return new Response(
          JSON.stringify({ error: "שגיאה בעדכון הטוקן" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send new verification email
      if (resendApiKey && verification.email) {
        const resend = new Resend(resendApiKey);
        const siteUrl = Deno.env.get("SITE_URL") || "https://ftatmcyrmeyhghgckvbj.lovable.app";
        const verifyLink = `${siteUrl}/verify-booking?token=${newToken}`;

        await resend.emails.send({
          from: "מרפאת ד\"ר אנה ברמלי <onboarding@resend.dev>",
          to: [verification.email],
          subject: "אימות קביעת תור - קישור חדש",
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">אימות קביעת תור 🏥</h2>
              <p>שלום,</p>
              <p>זהו קישור חדש לאימות התור שלך:</p>
              <div style="margin: 30px 0;">
                <a href="${verifyLink}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">אמת/י את התור</a>
              </div>
              <p style="color: #666; font-size: 14px;">הקישור יפוג תוך 30 דקות.</p>
              <p>בברכה,<br>מרפאת ד"ר אנה ברמלי</p>
            </div>
          `,
        });

        console.log("Resent verification email to:", verification.email);
      }

      return new Response(
        JSON.stringify({ success: true, message: "קישור חדש נשלח למייל" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normal verification flow
    const { data: verification, error: verifyError } = await supabase
      .from("booking_verifications")
      .select("*, appointments(id, scheduled_at, duration_minutes, status, appointment_types(name_he), clinics(name))")
      .eq("token", token)
      .is("used_at", null)
      .single();

    if (verifyError || !verification) {
      console.error("Verification lookup error:", verifyError);
      return new Response(
        JSON.stringify({ error: "הקישור לא תקין או שפג תוקפו", code: "INVALID_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "הקישור לא תקין או שפג תוקפו", code: "EXPIRED_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if appointment still exists and is pending
    const appointment = verification.appointments;
    if (!appointment) {
      return new Response(
        JSON.stringify({ error: "התור לא נמצא", code: "APPOINTMENT_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (appointment.status !== "pending_verification") {
      // Already confirmed or cancelled
      const statusMessage = appointment.status === "scheduled" || appointment.status === "confirmed" 
        ? "התור כבר אומת" 
        : "התור בוטל או לא זמין";
      return new Response(
        JSON.stringify({ 
          error: statusMessage, 
          code: appointment.status === "scheduled" ? "ALREADY_CONFIRMED" : "APPOINTMENT_UNAVAILABLE" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark verification as used
    const { error: updateVerifyError } = await supabase
      .from("booking_verifications")
      .update({ used_at: new Date().toISOString() })
      .eq("id", verification.id);

    if (updateVerifyError) {
      console.error("Error marking verification as used:", updateVerifyError);
    }

    // Confirm the appointment
    const { error: updateAppointmentError } = await supabase
      .from("appointments")
      .update({ status: "scheduled" })
      .eq("id", verification.appointment_id);

    if (updateAppointmentError) {
      console.error("Error confirming appointment:", updateAppointmentError);
      return new Response(
        JSON.stringify({ error: "שגיאה באימות התור" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Appointment confirmed:", verification.appointment_id);

    // Format appointment details for response
    const appointmentDate = new Date(appointment.scheduled_at);
    const dateStr = appointmentDate.toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const timeStr = appointmentDate.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit"
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "התור אומת ונקבע בהצלחה",
        appointment: {
          date: dateStr,
          time: timeStr,
          type: appointment.appointment_types?.name_he || "ביקור",
          clinic: appointment.clinics?.name || ""
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-booking:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בשרת" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
