import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createAuditLog, hashData } from "../_shared/security-utils.ts";
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
    const { firstName, lastName, phone, email, clinicId, appointmentTypeId, date, time, notes } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !clinicId || !appointmentTypeId || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP for audit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 'unknown';
    
    const fingerprintHash = await hashData(clientId);

    // Insert into staging table (NOT main patients table)
    const { data: booking, error: bookingError } = await supabase
      .from("guest_booking_requests")
      .insert({
        first_name: firstName.trim().substring(0, 100),
        last_name: lastName.trim().substring(0, 100),
        phone: phone.trim().substring(0, 20),
        email: email?.trim().substring(0, 255) || null,
        clinic_id: clinicId,
        appointment_type_id: appointmentTypeId,
        requested_date: date,
        requested_time: time,
        notes: notes?.trim().substring(0, 1000) || null,
        ip_address: ip.substring(0, 45),
        fingerprint_hash: fingerprintHash.substring(0, 64),
        status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to create booking request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    createAuditLog('guest-booking', 'booking_created', undefined, { 
      bookingId: booking.id,
      clinicId 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        bookingId: booking.id,
        message: "Booking request submitted for review" 
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