import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { corsHeaders, verifyStaffAuth, createAuditLog } from "../_shared/security-utils.ts";

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

// SECURITY: Sanitize content for HTML
function sanitizeForHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate ICS calendar file content (NO PHI in description)
function generateICSContent(
  title: string,
  startDate: Date,
  endDate: Date,
  location: string,
  description: string
): string {
  const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `appointment-${Date.now()}@ihaveallergy.com`;
  const now = formatDateForICS(new Date());
  const start = formatDateForICS(startDate);
  const end = formatDateForICS(endDate);

  // Escape special characters for ICS
  const escapeICS = (text: string) => text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dr Anna Brameli Clinic//Appointment//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(title)}`,
    `LOCATION:${escapeICS(location)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:תזכורת לתור',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// Generate Google Calendar link (NO PHI in details)
function generateGoogleCalendarLink(
  title: string,
  startDate: Date,
  endDate: Date,
  location: string,
  description: string
): string {
  const formatForGoogle = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatForGoogle(startDate)}/${formatForGoogle(endDate)}`,
    location: location,
    details: description,
    ctz: 'Asia/Jerusalem'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

    const {
      appointmentId,
      patientEmail,
      patientName,
      appointmentDate,
      appointmentTypeName,
      clinicName,
      clinicAddress,
      clinicCity,
      clinicPhone
    }: AppointmentConfirmationRequest = await req.json();

    // SECURITY: Validate required fields
    if (!patientEmail || !isValidEmail(patientEmail)) {
      console.error("Invalid email:", patientEmail);
      return new Response(
        JSON.stringify({ success: false, error: 'כתובת אימייל לא תקינה' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!appointmentDate || !clinicName || !clinicAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'חסרים פרטים נדרשים' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending confirmation email for appointment ${appointmentId} to ${patientEmail}`);
    createAuditLog('send-appointment-confirmation', 'sending_email', userId, { appointmentId });

    // Parse appointment date
    const startDate = new Date(appointmentDate);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Default 30 min duration

    // Format date for display (Hebrew)
    const dateFormatter = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const formattedDate = dateFormatter.format(startDate);
    const formattedTime = timeFormatter.format(startDate);
    const fullAddress = `${clinicAddress}, ${clinicCity}`;

    // Sanitize for HTML
    const safePatientName = sanitizeForHtml(patientName || 'מטופל/ת יקר/ה');
    const safeClinicName = sanitizeForHtml(clinicName);
    const safeAddress = sanitizeForHtml(fullAddress);
    const safeAppointmentType = sanitizeForHtml(appointmentTypeName || 'ביקור');

    // Generate calendar links - NO PHI in event details
    const calendarTitle = `${safeClinicName} – תור`;
    const calendarDescription = `תור ב${safeClinicName}. טלפון: ${clinicPhone || 'לא צוין'}`;
    
    const icsContent = generateICSContent(
      calendarTitle,
      startDate,
      endDate,
      fullAddress,
      calendarDescription
    );
    const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

    const googleCalendarLink = generateGoogleCalendarLink(
      calendarTitle,
      startDate,
      endDate,
      fullAddress,
      calendarDescription
    );

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, 'Helvetica Neue', sans-serif;
            line-height: 1.8;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header .checkmark {
            font-size: 48px;
            margin-bottom: 15px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .appointment-card {
            background: #f8fafc;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            border-right: 4px solid #0d9488;
          }
          .detail-row {
            display: flex;
            align-items: flex-start;
            margin: 12px 0;
            gap: 12px;
          }
          .detail-icon {
            font-size: 20px;
            width: 30px;
            text-align: center;
            flex-shrink: 0;
          }
          .detail-content {
            flex: 1;
          }
          .detail-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 2px;
          }
          .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
          }
          .address-value {
            font-size: 15px;
            font-weight: 600;
            color: #1e293b;
          }
          .calendar-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f0fdfa;
            border-radius: 10px;
          }
          .calendar-section h3 {
            margin: 0 0 15px 0;
            color: #0d9488;
            font-size: 16px;
          }
          .calendar-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
          }
          .calendar-btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            min-width: 200px;
            text-align: center;
          }
          .google-btn {
            background: #4285f4;
            color: white;
          }
          .google-btn:hover {
            background: #3367d6;
          }
          .ics-btn {
            background: #6b7280;
            color: white;
          }
          .ics-btn:hover {
            background: #4b5563;
          }
          .footer {
            padding: 20px 30px;
            background: #f8fafc;
            text-align: center;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .clinic-name {
            font-weight: 600;
            color: #0d9488;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="checkmark">✓</div>
            <h1>התור נקבע בהצלחה!</h1>
          </div>
          
          <div class="content">
            <p class="greeting">שלום ${safePatientName},</p>
            <p>התור שלך נקבע בהצלחה. להלן הפרטים:</p>
            
            <div class="appointment-card">
              <div class="detail-row">
                <span class="detail-icon">📅</span>
                <div class="detail-content">
                  <div class="detail-label">תאריך</div>
                  <div class="detail-value">${formattedDate}</div>
                </div>
              </div>
              
              <div class="detail-row">
                <span class="detail-icon">🕐</span>
                <div class="detail-content">
                  <div class="detail-label">שעה</div>
                  <div class="detail-value">${formattedTime}</div>
                </div>
              </div>
              
              <div class="detail-row">
                <span class="detail-icon">🏥</span>
                <div class="detail-content">
                  <div class="detail-label">מרפאה</div>
                  <div class="detail-value">${safeClinicName}</div>
                </div>
              </div>
              
              <div class="detail-row">
                <span class="detail-icon">📍</span>
                <div class="detail-content">
                  <div class="detail-label">כתובת</div>
                  <div class="address-value">${safeAddress}</div>
                </div>
              </div>
              
              ${clinicPhone ? `
              <div class="detail-row">
                <span class="detail-icon">📞</span>
                <div class="detail-content">
                  <div class="detail-label">טלפון</div>
                  <div class="detail-value" dir="ltr">${sanitizeForHtml(clinicPhone)}</div>
                </div>
              </div>
              ` : ''}
            </div>
            
            <div class="calendar-section">
              <h3>🗓️ הוסף ליומן</h3>
              <div class="calendar-buttons">
                <a href="${googleCalendarLink}" target="_blank" class="calendar-btn google-btn">
                  הוסף ל-Google Calendar
                </a>
                <a href="data:text/calendar;charset=utf-8;base64,${icsBase64}" download="appointment.ics" class="calendar-btn ics-btn">
                  הורד קובץ יומן (ICS)
                </a>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p class="clinic-name">${safeClinicName}</p>
            <p>נשמח לראותך!</p>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 15px;">
              הודעה זו נשלחה אוטומטית. לשאלות, פנו למרפאה בטלפון${clinicPhone ? ` ${clinicPhone}` : ''}.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email with ICS attachment
    const emailResponse = await resend.emails.send({
      from: `${safeClinicName} <info@ihaveallergy.com>`,
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
