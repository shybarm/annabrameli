import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyCaptcha, createAuditLog, hashData } from "../_shared/security-utils.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "../_shared/rate-limiter.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    // Validate required fields
    if (!firstName || !lastName || !phone || !clinicId || !appointmentTypeId || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify CAPTCHA
    if (captchaToken) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        createAuditLog('guest-booking', 'captcha_failed', undefined, { clientId: clientId.substring(0, 20) });
        return new Response(
          JSON.stringify({ error: "CAPTCHA verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get client IP for audit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 'unknown';
    
    const fingerprintHash = await hashData(clientId);

    const trimmedPhone = phone.trim().substring(0, 20);
    const trimmedEmail = email?.trim().substring(0, 255) || null;
    const trimmedFirstName = firstName.trim().substring(0, 100);
    const trimmedLastName = lastName.trim().substring(0, 100);

    // Find existing patient by clinic_id + phone (priority) or clinic_id + email
    let patientId: string | null = null;

    // Try to find by phone first
    const { data: existingByPhone } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("phone", trimmedPhone)
      .limit(1)
      .maybeSingle();

    if (existingByPhone) {
      patientId = existingByPhone.id;
    } else if (trimmedEmail) {
      // Try by email
      const { data: existingByEmail } = await supabase
        .from("patients")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("email", trimmedEmail)
        .limit(1)
        .maybeSingle();

      if (existingByEmail) {
        patientId = existingByEmail.id;
      }
    }

    // If no patient found, create one
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
          JSON.stringify({ error: "Failed to create patient record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      patientId = newPatient.id;
    }

    // Get appointment type duration
    const { data: appointmentType } = await supabase
      .from("appointment_types")
      .select("duration_minutes")
      .eq("id", appointmentTypeId)
      .single();

    const durationMinutes = appointmentType?.duration_minutes || 30;

    // Create appointment with patient_id and clinic_id
    const scheduledAt = `${date}T${time}:00`;
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
      .select("id")
      .single();

    if (appointmentError) {
      console.error("Appointment creation error:", appointmentError);
      return new Response(
        JSON.stringify({ error: "Failed to create appointment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    createAuditLog('guest-booking', 'booking_created', undefined, { 
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
        message: "Appointment booked successfully" 
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