import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COPY_TO_EMAIL = "shy@createit.tv";

const clean = (v: unknown, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160);
    const clinicName = clean(body.clinicName, 120);
    const notes = clean(body.notes, 1000);

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "Missing name or phone" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Basic abuse protection - 5 requests per phone per 10 minutes
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      _identifier: phone,
      _endpoint: "notify-waitlist",
      _max_requests: 5,
      _window_seconds: 600,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: settingsData } = await supabase
      .from("clinic_settings")
      .select("value")
      .eq("key", "notification_email")
      .maybeSingle();

    const { data: clinicData } = await supabase
      .from("clinics")
      .select("email, name")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const notificationEmail = settingsData?.value || clinicData?.email ||
      "info@ihaveallergy.com";
    const senderName = clinicData?.name || 'מרפאת ד"ר אנה ברמלי';

    const row = (label: string, value: string) =>
      value
        ? `<p style="margin:5px 0;color:#4b5563;"><strong>${label}:</strong> ${
          escapeHtml(value)
        }</p>`
        : "";

    const emailResponse = await resend.emails.send({
      from: `${senderName} <info@ihaveallergy.com>`,
      to: Array.from(new Set([notificationEmail, COPY_TO_EMAIL].filter(Boolean))),
      subject: `בקשה חדשה לרשימת המתנה - ${name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color:#9c6b86; margin-bottom:20px;">בקשה להצטרפות לרשימת המתנה</h1>
          <div style="background-color:#f7f3f5; padding:20px; border-radius:8px;">
            ${row("שם", name)}
            ${row("טלפון", phone)}
            ${row("דוא\u201dל", email)}
            ${row("מרפאה", clinicName)}
            ${row("הערות", notes)}
            ${row("תאריך", new Date().toLocaleString("he-IL"))}
          </div>
          <p style="color:#9ca3af; font-size:12px; margin-top:24px;">הודעה זו נשלחה אוטומטית מאתר המרפאה.</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("notify-waitlist error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
