import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders, verifyCaptcha, createAuditLog, hashData } from "../_shared/security-utils.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rate-limiter.ts";

// Normalize phone to E.164 format for Israel
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Israel: If starts with 0, replace with 972
  if (digits.startsWith('0')) {
    digits = '972' + digits.substring(1);
  }
  
  // Ensure it starts with +
  if (!digits.startsWith('+')) {
    digits = '+' + digits;
  }
  
  return digits;
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

    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit(supabase, clientId, 'guest-booking');
    
    if (!rateLimit.allowed) {
      createAuditLog('guest-booking', 'rate_limit_exceeded', undefined, { clientId: clientId.substring(0, 20) });
      return createRateLimitResponse(rateLimit.resetIn);
    }

    const body = await req.json();
    const { firstName, lastName, phone, email, clinicId, appointmentTypeId, date, time, notes, captchaToken } = body;

    // Validate required fields - email is now mandatory
    if (!firstName || !lastName || !phone || !email || !clinicId || !appointmentTypeId || !date || !time) {
      return new Response(
        JSON.stringify({ error: "חסרים שדות חובה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "כתובת אימייל לא תקינה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify CAPTCHA
    if (captchaToken) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        createAuditLog('guest-booking', 'captcha_failed', undefined, { clientId: clientId.substring(0, 20) });
        return new Response(
          JSON.stringify({ error: "אימות CAPTCHA נכשל" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get client IP for audit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 'unknown';
    
    const fingerprintHash = await hashData(clientId);

    // Normalize inputs
    const trimmedPhone = normalizePhone(phone);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFirstName = firstName.trim().substring(0, 100);
    const trimmedLastName = lastName.trim().substring(0, 100);

    // Identity resolution: Find existing patient by clinic_id + phone (priority) or clinic_id + email
    let patientId: string | null = null;

    // Try to find by phone first (primary match)
    const { data: existingByPhone } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("phone", trimmedPhone)
      .limit(1)
      .maybeSingle();

    if (existingByPhone) {
      patientId = existingByPhone.id;
      console.log("Found existing patient by phone:", patientId);
    } else {
      // Try by email (secondary match)
      const { data: existingByEmail } = await supabase
        .from("patients")
        .select("id")
        .eq("clinic_id", clinicId)
        .ilike("email", trimmedEmail)
        .limit(1)
        .maybeSingle();

      if (existingByEmail) {
        patientId = existingByEmail.id;
        console.log("Found existing patient by email:", patientId);
      }
    }

    // If no patient found, create one with minimal fields
    if (!patientId) {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          phone: trimmedPhone,
          email: trimmedEmail,
          clinic_id: clinicId,
          status: 'pending_verification'
        })
        .select("id")
        .single();

      if (patientError) {
        console.error("Patient creation error:", patientError);
        return new Response(
          JSON.stringify({ error: "שגיאה ביצירת רשומת מטופל" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      patientId = newPatient.id;
      console.log("Created new patient:", patientId);
    }

    // Get appointment type duration
    const { data: appointmentType } = await supabase
      .from("appointment_types")
      .select("duration_minutes")
      .eq("id", appointmentTypeId)
      .single();

    const durationMinutes = appointmentType?.duration_minutes || 30;

    // DOUBLE-BOOKING PREVENTION: Check for overlapping appointments
    const scheduledAt = `${date}T${time}:00`;
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    
    // Get appointments on the same day for this clinic
    const dayStart = new Date(startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startTime);
    dayEnd.setHours(23, 59, 59, 999);
    
    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, created_at")
      .eq("clinic_id", clinicId)
      .not("status", "in", '("cancelled","pending_verification")')
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString());
    
    // Check for overlaps
    for (const apt of existingAppointments || []) {
      const aptStart = new Date(apt.scheduled_at);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60 * 1000);
      
      if (aptStart < endTime && aptEnd > startTime) {
        createAuditLog('guest-booking', 'slot_taken', undefined, { 
          clinicId, 
          requestedTime: scheduledAt,
          conflictingAppointmentId: apt.id 
        });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "הזמן הזה כבר תפוס. בחרו זמן אחר.",
            code: "SLOT_TAKEN"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create appointment with status: pending_verification
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        appointment_type_id: appointmentTypeId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        notes: notes?.trim().substring(0, 1000) || null,
        status: 'pending_verification'
      })
      .select("id, created_at")
      .single();

    if (appointmentError) {
      console.error("Appointment creation error:", appointmentError);
      return new Response(
        JSON.stringify({ error: "שגיאה ביצירת התור" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Created pending appointment:", appointment.id);

    // Create verification token
    const verificationToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const { error: verificationError } = await supabase
      .from("booking_verifications")
      .insert({
        token: verificationToken,
        appointment_id: appointment.id,
        clinic_id: clinicId,
        email: trimmedEmail,
        expires_at: tokenExpiry.toISOString()
      });

    if (verificationError) {
      console.error("Verification token creation error:", verificationError);
      // Cancel the appointment since we can't verify
      await supabase
        .from("appointments")
        .update({ status: 'cancelled', cancellation_reason: 'Failed to create verification token' })
        .eq("id", appointment.id);
      
      return new Response(
        JSON.stringify({ error: "שגיאה ביצירת קישור אימות" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send verification email
    const siteUrl = Deno.env.get("SITE_URL") || "https://ftatmcyrmeyhghgckvbj.lovable.app";
    const verifyLink = `${siteUrl}/verify-booking?token=${verificationToken}`;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const appointmentDate = new Date(scheduledAt);
        const dateStr = appointmentDate.toLocaleDateString("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        const timeStr = appointmentDate.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const emailRes = await resend.emails.send({
          from: "מרפאת ד\"ר אנה ברמלי <noreply@ihaveallergy.com>",
          to: [trimmedEmail],
          subject: `אימות קביעת תור - ${dateStr}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">אימות קביעת תור 🏥</h2>
              <p>שלום ${trimmedFirstName},</p>
              <p>קיבלנו את בקשתך לתור במרפאה. לאישור סופי, נא ללחוץ על הכפתור הבא:</p>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${verifyLink}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">אמת/י את התור</a>
              </div>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📅 תאריך:</strong> ${dateStr}</p>
                <p style="margin: 5px 0;"><strong>🕐 שעה:</strong> ${timeStr}</p>
              </div>

              <p style="margin: 18px 0; color: #111;">
                למה צריך אימות? זה מאפשר לנו לשמור את הבקשה שלך ולהפוך את ההזמנה הבאה שלך לקלה ומהירה יותר.
              </p>

              <p style="color: #666; font-size: 14px;">⚠️ הקישור יפוג תוך 30 דקות. אם לא ביקשת לקבוע תור, ניתן להתעלם מהודעה זו.</p>

              <p>בברכה,<br>מרפאת ד"ר אנה ברמלי</p>
            </div>
          `,
        });

        console.log("Resend send() response:", emailRes);
        console.log("Verification email sent to:", trimmedEmail);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail the request - the user can try again
      }
    } else {
      console.warn("RESEND_API_KEY not configured - verification email not sent");
    }

    // Also insert into staging table for audit/tracking
    const { data: booking, error: bookingError } = await supabase
      .from("guest_booking_requests")
      .insert({
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        phone: trimmedPhone,
        email: trimmedEmail,
        clinic_id: clinicId,
        appointment_type_id: appointmentTypeId,
        requested_date: date,
        requested_time: time,
        notes: notes?.trim().substring(0, 1000) || null,
        captcha_token: captchaToken ? await hashData(captchaToken) : null,
        ip_address: ip.substring(0, 45),
        fingerprint_hash: fingerprintHash.substring(0, 64),
        status: 'pending',
        patient_id: patientId
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking log error:", bookingError);
      // Don't fail - appointment was created successfully
    }

    createAuditLog('guest-booking', 'pending_verification_created', undefined, { 
      bookingId: booking?.id,
      patientId,
      appointmentId: appointment.id,
      clinicId 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingId: booking?.id || appointment.id,
        patientId,
        appointmentId: appointment.id,
        pendingVerification: true,
        message: "נשלח מייל לאימות. נא ללחוץ על הקישור לאישור סופי." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בשרת" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
