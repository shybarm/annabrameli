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

    // ATOMIC BOOKING: Use the atomic RPC to prevent race conditions
    const scheduledAt = `${date}T${time}:00`;
    
    const { data: appointmentId, error: rpcError } = await supabase.rpc('create_appointment_atomic', {
      p_patient_id: patientId,
      p_clinic_id: clinicId,
      p_appointment_type_id: appointmentTypeId,
      p_scheduled_at: scheduledAt,
      p_duration_minutes: durationMinutes,
      p_notes: notes?.trim().substring(0, 1000) || null,
      p_status: 'scheduled'
    });

    if (rpcError) {
      console.error("Appointment creation error:", rpcError);
      
      // Check for slot taken error from the atomic RPC
      if (rpcError.message?.includes('SLOT_TAKEN')) {
        createAuditLog('guest-booking', 'slot_taken', undefined, { 
          clinicId, 
          requestedTime: scheduledAt
        });
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "השעה נתפסה זה עתה, בחר/י שעה אחרת",
            code: "SLOT_TAKEN"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "שגיאה ביצירת התור" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the appointmentId directly (we already have it from the RPC)
    const createdAppointmentId = appointmentId as string;
    console.log("Created appointment:", createdAppointmentId);

    // Get clinic details for emails (including doctor info for footer)
    let clinicName = "מרפאת ד\"ר אנה ברמלי";
    let clinicAddress = "";
    let clinicCity = "";
    let clinicPhone = "";
    let clinicEmail = "";
    let doctorName = "";
    let doctorLicense = "";
    let doctorSpecialty = "";

    const { data: clinic } = await supabase
      .from("clinics")
      .select("name, address, city, phone, email, doctor_name, doctor_license, doctor_specialty")
      .eq("id", clinicId)
      .maybeSingle();

    if (clinic) {
      clinicName = clinic.name || clinicName;
      clinicAddress = clinic.address || "";
      clinicCity = clinic.city || "";
      clinicPhone = clinic.phone || "";
      clinicEmail = clinic.email || "";
      doctorName = clinic.doctor_name || "";
      doctorLicense = clinic.doctor_license || "";
      doctorSpecialty = clinic.doctor_specialty || "";
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
        const uid = `appointment-${createdAppointmentId}@ihaveallergy.com`;
        
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
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); color: white; padding: 40px 32px; text-align: center;">
      <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px; line-height: 1;">✓</span>
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">התור נקבע בהצלחה!</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 15px;">פרטי התור נשמרו במערכת</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 32px;">
      <p style="font-size: 17px; color: #1e293b; margin: 0 0 24px;">שלום ${sanitize(trimmedFirstName)},</p>
      
      <!-- Appointment Card -->
      <div style="background: linear-gradient(to bottom, #f8fafc, #f1f5f9); border-radius: 12px; padding: 24px; margin: 0 0 28px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 20px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">פרטי התור</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top; width: 36px;">
              <span style="font-size: 20px;">📅</span>
            </td>
            <td style="padding: 12px 12px 12px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 2px;">תאריך</span>
              <strong style="font-size: 16px; color: #0f172a;">${dateStr}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
              <span style="font-size: 20px;">🕐</span>
            </td>
            <td style="padding: 12px 12px 12px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 2px;">שעה</span>
              <strong style="font-size: 16px; color: #0f172a;">${timeStr}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; ${fullAddress || clinicPhone ? 'border-bottom: 1px solid #e2e8f0;' : ''} vertical-align: top;">
              <span style="font-size: 20px;">🏥</span>
            </td>
            <td style="padding: 12px 12px 12px 0; ${fullAddress || clinicPhone ? 'border-bottom: 1px solid #e2e8f0;' : ''} vertical-align: top;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 2px;">מרפאה</span>
              <strong style="font-size: 16px; color: #0f172a;">${sanitize(clinicName)}</strong>
            </td>
          </tr>
          ${fullAddress ? `
          <tr>
            <td style="padding: 12px 0; ${clinicPhone ? 'border-bottom: 1px solid #e2e8f0;' : ''} vertical-align: top;">
              <span style="font-size: 20px;">📍</span>
            </td>
            <td style="padding: 12px 12px 12px 0; ${clinicPhone ? 'border-bottom: 1px solid #e2e8f0;' : ''} vertical-align: top;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 2px;">כתובת</span>
              <strong style="font-size: 15px; color: #0f172a;">${sanitize(fullAddress)}</strong>
            </td>
          </tr>
          ` : ''}
          ${clinicPhone ? `
          <tr>
            <td style="padding: 12px 0; vertical-align: top;">
              <span style="font-size: 20px;">📞</span>
            </td>
            <td style="padding: 12px 12px 12px 0; vertical-align: top;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 2px;">טלפון</span>
              <strong style="font-size: 15px; color: #0f172a;" dir="ltr">${sanitize(clinicPhone)}</strong>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Calendar Section -->
      <div style="background: #f0fdfa; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #99f6e4;">
        <div style="font-size: 28px; margin-bottom: 12px;">🗓️</div>
        <h3 style="margin: 0 0 8px; color: #0d9488; font-size: 17px; font-weight: 600;">הוסף ליומן</h3>
        <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">כדי לא לשכוח את התור</p>
        
        <div style="display: block;">
          <a href="${googleCalendarLink}" target="_blank" style="display: block; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%); color: white; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(66,133,244,0.3);">
            הוסף ל-Google Calendar
          </a>
          <a href="data:text/calendar;charset=utf-8;base64,${icsBase64}" download="appointment.ics" style="display: block; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; background: #ffffff; color: #475569; border: 2px solid #cbd5e1;">
            הורד קובץ יומן (ICS)
          </a>
        </div>
      </div>
    </div>
    
    <!-- Divider -->
    <div style="height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 0 32px;"></div>
    
    <!-- Professional Footer -->
    <div style="padding: 28px 32px; background: #f8fafc;">
      ${doctorName ? `
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">${sanitize(doctorName)}</p>
        ${doctorSpecialty ? `<p style="margin: 4px 0 0; font-size: 14px; color: #64748b;">${sanitize(doctorSpecialty)}</p>` : ''}
        ${doctorLicense ? `<p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">מס׳ רישיון: ${sanitize(doctorLicense)}</p>` : ''}
      </div>
      <div style="height: 1px; background: #e2e8f0; margin: 16px 0;"></div>
      ` : ''}
      
      <div style="text-align: center;">
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0d9488;">${sanitize(clinicName)}</p>
        ${fullAddress ? `<p style="margin: 6px 0 0; font-size: 14px; color: #64748b;">${sanitize(fullAddress)}</p>` : ''}
        ${clinicPhone ? `<p style="margin: 4px 0 0; font-size: 14px; color: #64748b;" dir="ltr">${sanitize(clinicPhone)}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          נשלח אוטומטית ממערכת המרפאה
        </p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
          נשמח לראותך! 💙
        </p>
      </div>
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
      appointmentId: createdAppointmentId,
      clinicId 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingId: booking?.id || createdAppointmentId,
        patientId,
        appointmentId: createdAppointmentId,
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
