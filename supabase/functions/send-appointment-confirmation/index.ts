import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders, verifyStaffAuth, createAuditLog } from "../_shared/security-utils.ts";

import { visitLogistics } from "../_shared/visit-logistics.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface AppointmentConfirmationRequest {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  appointmentDate: string; // ISO string
  appointmentTypeName: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone?: string;
}

// SECURITY: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify staff authentication
    const { isStaff, userId, error: authError } = await verifyStaffAuth(req);
    if (!isStaff) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: authError || 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {appointmentId, patientEmail}: AppointmentConfirmationRequest = await req.json();

    // SECURITY: Validate required fields
    if (!patientEmail || !isValidEmail(patientEmail)) {
      console.error("Invalid email:", patientEmail);
      return new Response(
        JSON.stringify({ success: false, error: 'כתובת אימייל לא תקינה' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {headers: {Authorization: req.headers.get('Authorization') || ''}}
    });
    const { data: visit, error } = await db.from('appointments')
      .select('id, scheduled_at, duration_minutes, modality, meeting_url, patients(email), clinics(name,address,city,phone)')
      .eq('id', appointmentId).single();
    const patient = Array.isArray(visit?.patients) ? visit.patients[0] : visit?.patients;
    if (error || !visit || patient?.email?.toLowerCase() !== patientEmail.toLowerCase()) {
      return new Response(JSON.stringify({success:false,error:'לא ניתן לאמת את פרטי התור והנמען'}), {
        status: 400, headers: {...corsHeaders,'Content-Type':'application/json'}
      });
    }
    const clinic = Array.isArray(visit.clinics) ? visit.clinics[0] : visit.clinics;
    const details = visitLogistics(visit, clinic || {});
    const emailHtml = details.html;
    const icsBase64 = btoa(unescape(encodeURIComponent(details.ics)));

    // Send email with ICS attachment
    const emailResponse = await resend.emails.send({
      from: `ד"ר אנה ברמלי <info@ihaveallergy.com>`,
      to: [patientEmail],
      subject: 'אישור קביעת תור',
      html: emailHtml,
      attachments: [
        {
          filename: 'appointment.ics',
          content: icsBase64
        }
      ]
    });

    console.log('Email sent successfully:', JSON.stringify(emailResponse));

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.error.message || 'Failed to send email' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    createAuditLog('send-appointment-confirmation', 'email_sent', userId, { appointmentId });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in send-appointment-confirmation:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
