import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders, verifyStaffAuth, detectPHI, createAuditLog } from "../_shared/security-utils.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface VisitSummaryEmailRequest {
  patientEmail: string;
  patientName: string;
  visitDate: string;
  visitSummary?: string;
  treatmentPlan?: string;
  medications?: string;
  doctorName?: string;
}

// SECURITY: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

// SECURITY: Sanitize HTML content to prevent XSS
function sanitizeForHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify staff authentication with JWT scope
    const { isStaff, userId, error: authError } = await verifyStaffAuth(req);
    if (!isStaff) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: authError || 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      patientEmail, 
      patientName, 
      visitDate, 
      visitSummary, 
      treatmentPlan, 
      medications,
      doctorName = "ד\"ר אנה ברמלי"
    }: VisitSummaryEmailRequest = await req.json();

    // SECURITY: Validate email
    if (!patientEmail || !isValidEmail(patientEmail)) {
      createAuditLog('send-visit-summary', 'invalid_email', userId);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid patient email address' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SECURITY: Validate required fields
    if (!patientName || !visitDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Patient name and visit date are required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    createAuditLog('send-visit-summary', 'sending_email', userId, {
      hasVisitSummary: !!visitSummary,
      hasTreatmentPlan: !!treatmentPlan,
      hasMedications: !!medications
    });

    // SECURITY: Sanitize all content for HTML
    const safePatientName = sanitizeForHtml(patientName);
    const safeVisitDate = sanitizeForHtml(visitDate);
    const safeDoctorName = sanitizeForHtml(doctorName);
    const safeVisitSummary = visitSummary ? sanitizeForHtml(visitSummary) : '';
    const safeTreatmentPlan = treatmentPlan ? sanitizeForHtml(treatmentPlan) : '';
    const safeMedications = medications ? sanitizeForHtml(medications) : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.8;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #0d9488;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 10px;
          }
          .section {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .section-title {
            font-weight: bold;
            color: #0d9488;
            margin-bottom: 10px;
          }
          .content {
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          .header-info {
            background: #0d9488;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1 style="color: white; border: none; margin: 0;">סיכום ביקור</h1>
        </div>
        
        <p><strong>מטופל/ת:</strong> ${safePatientName}</p>
        <p><strong>תאריך הביקור:</strong> ${safeVisitDate}</p>
        
        ${safeVisitSummary ? `
          <div class="section">
            <div class="section-title">📋 סיכום הביקור</div>
            <div class="content">${safeVisitSummary}</div>
          </div>
        ` : ''}
        
        ${safeTreatmentPlan ? `
          <div class="section">
            <div class="section-title">🩺 תוכנית טיפול</div>
            <div class="content">${safeTreatmentPlan}</div>
          </div>
        ` : ''}
        
        ${safeMedications ? `
          <div class="section">
            <div class="section-title">💊 תרופות ומרשמים</div>
            <div class="content">${safeMedications}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>בברכה,<br>${safeDoctorName}</p>
          <p>מרפאה לרפואה משלימה</p>
          <p style="font-size: 11px; color: #999;">
            הודעה זו נשלחה אוטומטית ממערכת ניהול המרפאה.
            אם יש לך שאלות, אנא פנה/י למרפאה ישירות.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "מרפאת ד\"ר אנה ברמלי <info@ihaveallergy.com>",
      to: [patientEmail],
      subject: `סיכום ביקור - ${safeVisitDate}`,
      html: emailHtml,
    });

    console.log('Resend API response:', JSON.stringify(emailResponse));

    // Check for Resend API error response
    if (emailResponse.error) {
      console.error('Resend email error:', emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.error.message || 'Failed to send email' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    createAuditLog('send-visit-summary', 'email_sent', userId);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-visit-summary function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);