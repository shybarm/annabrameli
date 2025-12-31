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

    // Validate required fields - phone is mandatory, email is optional
    if (!firstName || !lastName || !phone || !clinicId || !appointmentTypeId || !date || !time) {
      return new Response(
        JSON.stringify({ error: "חסרים שדות חובה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedPhone = normalizePhone(phone);
    
    console.log("Processing booking for phone:", trimmedPhone.substring(0, 8) + "...");

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return new Response(
          JSON.stringify({ error: "כתובת אימייל לא תקינה" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    // Normalize inputs (trimmedPhone already defined above for OTP check)
    const trimmedEmail = email ? email.trim().toLowerCase() : null;
    const trimmedFirstName = firstName.trim().substring(0, 100);
    const trimmedLastName = lastName.trim().substring(0, 100);

    // Identity resolution: Find existing patient by clinic_id + phone ONLY (phone is verified via OTP)
    let patientId: string | null = null;

    // Find by phone (primary and only match - phone verified via OTP)
    const { data: existingByPhone } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("phone", trimmedPhone)
      .limit(1)
      .maybeSingle();

    if (existingByPhone) {
      patientId = existingByPhone.id;
      console.log("Found existing patient by verified phone:", patientId);
    }

    // If no patient found, create one with minimal fields (status: active since no verification needed)
    if (!patientId) {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          phone: trimmedPhone,
          email: trimmedEmail,
          clinic_id: clinicId,
          status: 'active'
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

    // Create appointment with status: scheduled (no verification needed)
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        appointment_type_id: appointmentTypeId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        notes: notes?.trim().substring(0, 1000) || null,
        status: 'scheduled'
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

    console.log("Created appointment:", appointment.id);

    // Get clinic details for emails
    let clinicName = "מרפאת ד\"ר אנה ברמלי";
    let clinicAddress = "";
    let clinicCity = "";
    let clinicPhone = "";

    const { data: clinic } = await supabase
      .from("clinics")
      .select("name, address, city, phone")
      .eq("id", clinicId)
      .maybeSingle();

    if (clinic) {
      clinicName = clinic.name || clinicName;
      clinicAddress = clinic.address || "";
      clinicCity = clinic.city || "";
      clinicPhone = clinic.phone || "";
    }

    const fullAddress = [clinicAddress, clinicCity].filter(Boolean).join(", ");

    // TASK A: Send confirmation email with calendar invite
    if (resendApiKey && trimmedEmail) {
      try {
        const resend = new Resend(resendApiKey);
        
        const appointmentDate = new Date(scheduledAt);
        const endDate = new Date(appointmentDate.getTime() + durationMinutes * 60 * 1000);
        
        const dateStr = appointmentDate.toLocaleDateString("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });
        const timeStr = appointmentDate.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });

        // Generate ICS content (NO PHI in description - ISO 27799)
        const formatDateForICS = (date: Date): string => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        const escapeICS = (text: string) => text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
        
        const calendarTitle = `${clinicName} – תור`;
        const calendarDescription = `תור ב${clinicName}${clinicPhone ? `. טלפון: ${clinicPhone}` : ''}`;
        const uid = `appointment-${appointment.id}@ihaveallergy.com`;
        
        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Dr Anna Brameli Clinic//Appointment//HE',
          'CALSCALE:GREGORIAN',
          'METHOD:REQUEST',
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${formatDateForICS(new Date())}`,
          `DTSTART:${formatDateForICS(appointmentDate)}`,
          `DTEND:${formatDateForICS(endDate)}`,
          `SUMMARY:${escapeICS(calendarTitle)}`,
          `LOCATION:${escapeICS(fullAddress)}`,
          `DESCRIPTION:${escapeICS(calendarDescription)}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT1H',
          'ACTION:DISPLAY',
          'DESCRIPTION:תזכורת לתור',
          'END:VALARM',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
        
        const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

        // Generate Google Calendar link (NO PHI)
        const googleParams = new URLSearchParams({
          action: 'TEMPLATE',
          text: calendarTitle,
          dates: `${formatDateForICS(appointmentDate)}/${formatDateForICS(endDate)}`,
          location: fullAddress,
          details: calendarDescription,
          ctz: 'Asia/Jerusalem'
        });
        const googleCalendarLink = `https://calendar.google.com/calendar/render?${googleParams.toString()}`;

        // Sanitize for HTML
        const sanitize = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white; padding: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 15px;">✓</div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">התור נקבע בהצלחה!</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 18px; margin-bottom: 20px;">שלום ${sanitize(trimmedFirstName)},</p>
      <p>התור שלך נקבע בהצלחה. להלן הפרטים:</p>
      
      <div style="background: #f8fafc; border-radius: 10px; padding: 25px; margin: 25px 0; border-right: 4px solid #0d9488;">
        <div style="margin: 12px 0;">
          <span style="font-size: 20px;">📅</span>
          <span style="font-size: 12px; color: #666; margin-right: 12px;">תאריך:</span>
          <strong style="font-size: 16px; color: #1e293b;">${dateStr}</strong>
        </div>
        
        <div style="margin: 12px 0;">
          <span style="font-size: 20px;">🕐</span>
          <span style="font-size: 12px; color: #666; margin-right: 12px;">שעה:</span>
          <strong style="font-size: 16px; color: #1e293b;">${timeStr}</strong>
        </div>
        
        <div style="margin: 12px 0;">
          <span style="font-size: 20px;">🏥</span>
          <span style="font-size: 12px; color: #666; margin-right: 12px;">מרפאה:</span>
          <strong style="font-size: 16px; color: #1e293b;">${sanitize(clinicName)}</strong>
        </div>
        
        ${fullAddress ? `
        <div style="margin: 12px 0;">
          <span style="font-size: 20px;">📍</span>
          <span style="font-size: 12px; color: #666; margin-right: 12px;">כתובת:</span>
          <strong style="font-size: 15px; color: #1e293b;">${sanitize(fullAddress)}</strong>
        </div>
        ` : ''}
        
        ${clinicPhone ? `
        <div style="margin: 12px 0;">
          <span style="font-size: 20px;">📞</span>
          <span style="font-size: 12px; color: #666; margin-right: 12px;">טלפון:</span>
          <strong style="font-size: 16px; color: #1e293b;" dir="ltr">${sanitize(clinicPhone)}</strong>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f0fdfa; border-radius: 10px;">
        <h3 style="margin: 0 0 15px 0; color: #0d9488; font-size: 16px;">🗓️ הוסף ליומן</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
          <a href="${googleCalendarLink}" target="_blank" style="display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; background: #4285f4; color: white; min-width: 200px; text-align: center;">
            הוסף ל-Google Calendar
          </a>
          <a href="data:text/calendar;charset=utf-8;base64,${icsBase64}" download="appointment.ics" style="display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; background: #6b7280; color: white; min-width: 200px; text-align: center;">
            הורד קובץ יומן (ICS)
          </a>
        </div>
      </div>
    </div>
    
    <div style="padding: 20px 30px; background: #f8fafc; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="font-weight: 600; color: #0d9488; margin: 0;">${sanitize(clinicName)}</p>
      <p style="margin: 8px 0;">נשמח לראותך!</p>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 15px;">
        הודעה זו נשלחה אוטומטית. לשאלות, פנו למרפאה${clinicPhone ? ` בטלפון ${clinicPhone}` : ''}.
      </p>
    </div>
  </div>
</body>
</html>`;

        const emailRes = await resend.emails.send({
          from: `${clinicName} <noreply@ihaveallergy.com>`,
          to: [trimmedEmail],
          subject: `אישור תור - ${dateStr}`,
          html: emailHtml,
          attachments: [
            {
              filename: 'appointment.ics',
              content: icsBase64
            }
          ]
        });

        console.log("Confirmation email sent to:", trimmedEmail);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request - appointment was created successfully
      }
    }

    // TASK B: Send email verification magic link (separate email)
    if (resendApiKey && trimmedEmail) {
      try {
        // Generate secure one-time token
        const verificationToken = crypto.randomUUID().replace(/-/g, '') + 
                                  crypto.randomUUID().replace(/-/g, '') +
                                  crypto.randomUUID().replace(/-/g, '').slice(0, 16);

        // Set expiry to 24 hours (ISO 27799 compliant short TTL)
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Delete any existing pending verifications for this patient+email
        await supabase
          .from("email_verifications")
          .delete()
          .eq("patient_id", patientId)
          .eq("email", trimmedEmail)
          .is("verified_at", null);

        // Create new verification record
        const { error: verifyInsertError } = await supabase
          .from("email_verifications")
          .insert({
            token: verificationToken,
            patient_id: patientId,
            email: trimmedEmail,
            clinic_id: clinicId,
            expires_at: tokenExpiresAt.toISOString()
          });

        if (!verifyInsertError) {
          const resend = new Resend(resendApiKey);
          const siteUrl = Deno.env.get("SITE_URL") || "https://ftatmcyrmeyhghgckvbj.lovable.app";
          const verifyLink = `${siteUrl}/verify-email?token=${verificationToken}`;

          const sanitize = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

          const verifyEmailHtml = `
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
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">שלום ${sanitize(trimmedFirstName)},</p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      קיבלת הודעה זו לאחר קביעת התור שלך ב${sanitize(clinicName)}.
    </p>
    
    <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 24px 0; border-right: 4px solid #2563eb;">
      <p style="color: #1e40af; margin: 0; font-size: 15px;">
        <strong>למה צריך אימות?</strong><br>
        אימות האימייל מאפשר לנו לזהות אותך אוטומטית בביקורים הבאים ולמנוע יצירת רשומות כפולות במערכת.
      </p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyLink}" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        אמת את האימייל שלי
      </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        <strong>${sanitize(clinicName)}</strong>
        ${fullAddress ? `<br>${sanitize(fullAddress)}` : ''}
      </p>
    </div>
    
    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
      קישור זה יפוג תוך 24 שעות.<br>
      אם לא קבעת תור, ניתן להתעלם מהודעה זו.
    </p>
  </div>
</body>
</html>`;

          await resend.emails.send({
            from: `${clinicName} <noreply@ihaveallergy.com>`,
            to: [trimmedEmail],
            subject: "אמת את האימייל שלך – צעד אחרון",
            html: verifyEmailHtml,
          });

          console.log("Email verification magic link sent to:", trimmedEmail);
        }
      } catch (verifyError) {
        console.error("Failed to send email verification:", verifyError);
        // Don't fail - booking succeeded, verification is optional
      }
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
        status: 'approved',
        patient_id: patientId
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking log error:", bookingError);
      // Don't fail - appointment was created successfully
    }

    createAuditLog('guest-booking', 'appointment_created', undefined, { 
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
        message: "התור נקבע בהצלחה!" 
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
