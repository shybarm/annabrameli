import { readLeadAttribution } from "./attribution.ts";
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

  if (req.method === "GET") {
    return new Response(JSON.stringify({ service: "notify-contact", version: "2026-11-26-contact-receipts-v1" }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160);
    const subject = clean(body.subject, 200);
    const message = clean(body.message, 2000);
    const attribution = readLeadAttribution(body);
    const suppliedReference = clean(body.inquiry_reference, 36);
    if (suppliedReference && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedReference)) {
      return new Response(JSON.stringify({ error: "Invalid inquiry reference" }), { status: 400, headers: corsHeaders });
    }
    const inquiryReference = suppliedReference || crypto.randomUUID();

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
      _endpoint: "notify-contact",
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
    const senderName = 'ד"ר אנה ברמלי';

    const recipients = Array.from(
      new Set([notificationEmail, COPY_TO_EMAIL].filter(Boolean)),
    );

    // An atomic primary-key insert grants a single sender permission. Retries never
    // resend an ambiguous attempt, even after a worker crash or provider timeout.
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({
      name, phone, email, subject, message, attribution, recipients,
      whatsappServiceConsent: body.whatsappServiceConsent === true,
    })));
    const payloadHash = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, "0")).join("");
    const { data: receipt, error: receiptError } = await supabase.from("contact_inquiry_receipts")
      .insert({ inquiry_reference: inquiryReference, payload_hash: payloadHash,
        form_source: attribution.source, attribution }).select("created_at").single();
    if (receiptError) {
      if (receiptError.code !== "23505") throw new Error("Receipt storage unavailable");
      const { data: existing, error: lookupError } = await supabase.from("contact_inquiry_receipts")
        .select("payload_hash,email_status").eq("inquiry_reference", inquiryReference).single();
      if (lookupError || !existing) throw new Error("Receipt lookup unavailable");
      if (existing.payload_hash !== payloadHash) {
        return new Response(JSON.stringify({ error: "Inquiry reference already used" }), { status: 409, headers: corsHeaders });
      }
      const accepted = existing.email_status === "accepted";
      return new Response(JSON.stringify(accepted
        ? { success: true, inquiry_reference: inquiryReference, duplicate: true }
        : { error: "Submission requires delivery verification", inquiry_reference: inquiryReference }),
        { status: accepted ? 200 : 409, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const row = (label: string, value: string) =>
      value
        ? `<p style="margin:5px 0;color:#4b5563;"><strong>${label}:</strong> ${
          escapeHtml(value)
        }</p>`
        : "";

    const emailResponse = await resend.emails.send({
      from: `${senderName} <info@ihaveallergy.com>`,
      to: recipients,
      reply_to: email || undefined,
      subject: `פנייה חדשה מהאתר - ${name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color:#9c6b86; margin-bottom:20px;">פנייה חדשה מטופס "צור קשר"</h1>
          <div style="background-color:#f7f3f5; padding:20px; border-radius:8px;">
            ${row("שם", name)}
            ${row("טלפון", phone)}
            ${row("דוא\u201dל", email)}
            ${row("נושא", subject)}
            ${row("פרטים", message)}
            ${row("תאריך", new Date(receipt.created_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" }))}
            ${row("מזהה פנייה", inquiryReference)}
            ${row("טופס מקור", attribution.source)}
            ${row("מקור מתויג", attribution.labels.utm_source || "לא מתויג")}
            ${row("ערוץ", attribution.labels.utm_medium || "")}
            ${row("קמפיין", attribution.labels.utm_campaign || "")}
            ${row("קישור מתויג", attribution.labels.utm_content || "")}
            ${row("אתר מפנה", attribution.referrer || "לא ידוע")}
            ${row("עמוד כניסה", attribution.landing_page)}
            ${row("רמת תיעוד המקור", attribution.classification === "tagged" ? "מקור מתויג" : attribution.classification === "referrer_only" ? "אתר מפנה בלבד, ערוץ לא ידוע" : "מקור לא ידוע")}
          </div>
          <p style="color:#9ca3af; font-size:12px; margin-top:24px;">הודעה זו נשלחה אוטומטית מאתר המרפאה.</p>
        </div>
      `,
    });

    if (emailResponse.error) {
      await supabase.from("contact_inquiry_receipts").update({ email_status: "failed" })
        .eq("inquiry_reference", inquiryReference);
      console.error("notify-contact resend rejected");
      return new Response(
        JSON.stringify({ error: "Email send failed", details: emailResponse.error }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const { error: acceptedError } = await supabase.from("contact_inquiry_receipts").update({
      email_status: "accepted", provider_message_id: emailResponse.data?.id ?? null,
      accepted_at: new Date().toISOString(),
    }).eq("inquiry_reference", inquiryReference);
    if (acceptedError) throw new Error("Email accepted; receipt reconciliation required");

    // Service reply is opt-in. Email remains successful if WhatsApp scheduling is unavailable.
    if (body.whatsappServiceConsent === true) {
      const normalizedPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "972");
      const { error: queueError } = await supabase.rpc("schedule_clinic_referral", {
        p_phone: normalizedPhone, p_name: name, p_source: "contact_form",
      });
      if (queueError) console.warn("contact_whatsapp_schedule_unavailable", queueError.code);
    }

    return new Response(JSON.stringify({ success: true, inquiry_reference: inquiryReference }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("notify-contact error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
