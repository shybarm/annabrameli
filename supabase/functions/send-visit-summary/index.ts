import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VisitSummaryEmailRequest {
  patientEmail: string;
  patientName: string;
  visitDate: string;
  visitSummary?: string;
  treatmentPlan?: string;
  medications?: string;
  doctorName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      patientEmail, 
      patientName, 
      visitDate, 
      visitSummary, 
      treatmentPlan, 
      medications,
      doctorName = "ד\"ר אנה ברמלי"
    }: VisitSummaryEmailRequest = await req.json();

    console.log(`Sending visit summary email to ${patientEmail} for patient ${patientName}`);

    if (!patientEmail) {
      throw new Error("Patient email is required");
    }

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
        
        <p><strong>מטופל/ת:</strong> ${patientName}</p>
        <p><strong>תאריך הביקור:</strong> ${visitDate}</p>
        
        ${visitSummary ? `
          <div class="section">
            <div class="section-title">📋 סיכום הביקור</div>
            <div class="content">${visitSummary.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
        
        ${treatmentPlan ? `
          <div class="section">
            <div class="section-title">🩺 תוכנית טיפול</div>
            <div class="content">${treatmentPlan.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
        
        ${medications ? `
          <div class="section">
            <div class="section-title">💊 תרופות ומרשמים</div>
            <div class="content">${medications.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>בברכה,<br>${doctorName}</p>
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
      from: "מרפאת ד\"ר אנה ברמלי <onboarding@resend.dev>",
      to: [patientEmail],
      subject: `סיכום ביקור - ${visitDate}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-visit-summary function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
