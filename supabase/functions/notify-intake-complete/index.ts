import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyIntakeRequest {
  patientId: string;
  patientName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("notify-intake-complete: Starting...");

    const { patientId, patientName }: NotifyIntakeRequest = await req.json();
    console.log(`notify-intake-complete: Patient ${patientName} (${patientId}) completed intake`);

    // Get clinic settings for notification email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get clinic email from settings or use default
    const { data: settingsData } = await supabase
      .from("clinic_settings")
      .select("value")
      .eq("key", "notification_email")
      .maybeSingle();

    // Get clinic email from clinics table as fallback
    const { data: clinicData } = await supabase
      .from("clinics")
      .select("email, name")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const notificationEmail = settingsData?.value || clinicData?.email || "diamondscom@gmail.com";
    const clinicName = clinicData?.name || "מרפאת ד\"ר אנה ברמלי";

    console.log(`notify-intake-complete: Sending notification to ${notificationEmail}`);

    const emailResponse = await resend.emails.send({
      from: `${clinicName} <onboarding@resend.dev>`,
      to: [notificationEmail],
      subject: `טופס קליטה הושלם - ${patientName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">טופס קליטה הושלם</h1>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #374151;">פרטי המטופל:</h2>
            <p style="margin: 5px 0; color: #4b5563;"><strong>שם:</strong> ${patientName}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
            <p style="margin: 5px 0; color: #4b5563;"><strong>שעה:</strong> ${new Date().toLocaleTimeString('he-IL')}</p>
          </div>
          
          <p style="color: #4b5563;">
            המטופל השלים את מילוי טופס הקליטה. ניתן לצפות בפרטים המלאים במערכת הניהול.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              הודעה זו נשלחה אוטומטית מ${clinicName}
            </p>
          </div>
        </div>
      `,
    });

    console.log("notify-intake-complete: Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("notify-intake-complete: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
