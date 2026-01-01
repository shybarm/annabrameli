import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_CLINIC_TIMEZONE = "Asia/Jerusalem";
const LOOKAHEAD_MINUTES = 10;

function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function addHours(d: Date, hours: number) {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

function isTwilioWhatsAppConfigured(): boolean {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  return Boolean(sid && token && from);
}

function normalizePhoneE164(phoneRaw: string): string | null {
  const digits = phoneRaw.replace(/\D/g, "");
  if (!digits) return null;
  // Israeli mobile: starts with 0, convert to +972
  if (digits.startsWith("0")) {
    const national = digits.slice(1);
    if (!national || national.length < 9) return null;
    return `+972${national}`;
  }
  // Already international format
  if (digits.startsWith("972")) {
    return `+${digits}`;
  }
  // Other international
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

async function sendWhatsAppViaTwilio(args: { toPhone: string; body: string }): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM")!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const form = new URLSearchParams();
  // Ensure from has whatsapp: prefix
  form.set("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  form.set("To", `whatsapp:${args.toPhone}`);
  form.set("Body", args.body);

  const basicAuth = btoa(`${sid}:${token}`);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const responseData = await resp.json();

    if (!resp.ok) {
      const errorMsg = responseData?.message || `twilio_http_${resp.status}`;
      return { ok: false, error: errorMsg };
    }

    return { ok: true, messageId: responseData?.sid };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function formatHeDateTime(d: Date, timeZone: string): { dateStr: string; timeStr: string } {
  const dateStr = d.toLocaleDateString("he-IL", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("he-IL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
  return { dateStr, timeStr };
}

// Log delivery attempt (no PHI in logs)
async function logDelivery(
  supabase: any,
  appointmentId: string,
  channel: "email" | "whatsapp",
  status: "sent" | "failed",
  providerMessageId?: string,
  error?: string
) {
  try {
    await supabase.from("reminder_delivery_log").insert({
      appointment_id: appointmentId,
      channel,
      status,
      provider_message_id: providerMessageId || null,
      error: error ? error.substring(0, 500) : null, // Truncate error to avoid large entries
    });
  } catch (e) {
    console.error(`[Reminders] Failed to log delivery: ${e}`);
  }
}

// Background processing function
async function processReminders(runId: string) {
  console.log(`[Reminders] Background processing started for run ${runId}`);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let emailsSent = 0;
  let whatsappsSent = 0;
  let processedCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; msg: string }> = [];

  try {
    const { data: schedules, error: schedulesError } = await supabase
      .from("reminder_schedules")
      .select("*")
      .eq("is_active", true)
      .order("hours_before", { ascending: false });

    if (schedulesError) {
      throw new Error(`fetch_schedules_failed: ${schedulesError.code}`);
    }

    if (!schedules || schedules.length === 0) {
      console.log("[Reminders] No active reminder schedules");
      await supabase.from("reminder_runs").update({
        finished_at: new Date().toISOString(),
        processed_count: 0,
        email_sent_count: 0,
        whatsapp_sent_count: 0,
        error_count: 0,
      }).eq("id", runId);
      return;
    }

    const now = new Date();
    const lookaheadEnd = addMinutes(now, LOOKAHEAD_MINUTES);
    const whatsappConfigured = isTwilioWhatsAppConfigured();
    
    console.log(`[Reminders] Processing ${schedules.length} schedules, WhatsApp configured: ${whatsappConfigured}`);

    for (const schedule of schedules) {
      const windowStart = addHours(now, schedule.hours_before);
      const windowEnd = addHours(lookaheadEnd, schedule.hours_before);

      const reminderColumn = schedule.hours_before >= 24 ? "reminder_24h_sent_at" : "reminder_2h_sent_at";

      console.log(`[Reminders] Schedule ${schedule.hours_before}h: window ${windowStart.toISOString()} - ${windowEnd.toISOString()}`);

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_at,
          status,
          clinic_id,
          reminder_email_sent_at,
          reminder_whatsapp_sent_at,
          ${reminderColumn},
          patients (first_name, last_name, phone, email),
          clinics (name, address, phone)
        `)
        .gte("scheduled_at", windowStart.toISOString())
        .lte("scheduled_at", windowEnd.toISOString())
        .eq("status", "מתוכנן")
        .is(reminderColumn, null);

      if (appointmentsError) {
        console.error(`[Reminders] Fetch appointments error: ${appointmentsError.code}`);
        errorCount++;
        errors.push({ id: "fetch", msg: appointmentsError.code });
        continue;
      }

      console.log(`[Reminders] Found ${appointments?.length || 0} appointments for ${schedule.hours_before}h schedule`);

      for (const appointment of appointments || []) {
        processedCount++;
        
        const appointmentDate = new Date(appointment.scheduled_at);
        const { dateStr, timeStr } = formatHeDateTime(appointmentDate, DEFAULT_CLINIC_TIMEZONE);

        const clinicRow = Array.isArray(appointment.clinics) ? appointment.clinics[0] : appointment.clinics;
        const clinicName = clinicRow?.name || "המרפאה";
        const clinicAddress = clinicRow?.address || "";
        const clinicPhone = clinicRow?.phone || "";

        const patientRow = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients;
        const patient = patientRow;

        let whatsappSent = false;
        let emailSent = false;

        // WhatsApp - check idempotency (reminder_whatsapp_sent_at must be null)
        if (schedule.send_whatsapp && patient?.phone && whatsappConfigured && !appointment.reminder_whatsapp_sent_at) {
          const toE164 = normalizePhoneE164(patient.phone);
          if (toE164) {
            // Message contains ONLY: date, time, clinic name, clinic address, clinic phone (no PHI)
            let message = `תזכורת לתור במרפאה\nתאריך: ${dateStr}\nשעה: ${timeStr}\nמקום: ${clinicName}`;
            if (clinicAddress) message += `\nכתובת: ${clinicAddress}`;
            if (clinicPhone) message += `\nטלפון: ${clinicPhone}`;

            const waRes = await sendWhatsAppViaTwilio({ toPhone: toE164, body: message });
            
            if (waRes.ok) {
              // Mark sent ONLY after successful delivery
              await supabase.from("appointments")
                .update({ reminder_whatsapp_sent_at: new Date().toISOString() })
                .eq("id", appointment.id);
              
              await logDelivery(supabase, appointment.id, "whatsapp", "sent", waRes.messageId);
              whatsappsSent++;
              whatsappSent = true;
            } else {
              await logDelivery(supabase, appointment.id, "whatsapp", "failed", undefined, waRes.error);
              errorCount++;
              errors.push({ id: appointment.id, msg: `whatsapp:${waRes.error}` });
              // Do NOT block email on WhatsApp failure
            }
          }
        }

        // Email - check idempotency (reminder_email_sent_at must be null)
        if (schedule.send_email && patient?.email && resendApiKey && !appointment.reminder_email_sent_at) {
          try {
            const resend = new Resend(resendApiKey);
            
            // Email contains ONLY: date, time, clinic name, clinic address, clinic phone (no PHI)
            const emailResponse = await resend.emails.send({
              from: 'מרפאה <info@ihaveallergy.com>',
              to: [patient.email],
              subject: `תזכורת לתור - ${dateStr} ${timeStr}`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>תזכורת לתור</h2>
                  <p>זוהי תזכורת לתור הקרוב שלך.</p>
                  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p><strong>תאריך:</strong> ${dateStr}</p>
                    <p><strong>שעה:</strong> ${timeStr}</p>
                    <p><strong>מקום:</strong> ${clinicName}</p>
                    ${clinicAddress ? `<p><strong>כתובת:</strong> ${clinicAddress}</p>` : ''}
                    ${clinicPhone ? `<p><strong>טלפון:</strong> ${clinicPhone}</p>` : ''}
                  </div>
                  <p>נשמח לראותך.</p>
                </div>
              `,
            });

            const resendId = (emailResponse as any)?.id;
            if (resendId) {
              // Mark sent ONLY after successful delivery
              await supabase.from("appointments")
                .update({ reminder_email_sent_at: new Date().toISOString() })
                .eq("id", appointment.id);
              
              await logDelivery(supabase, appointment.id, "email", "sent", resendId);
              emailsSent++;
              emailSent = true;
            } else {
              const errorMsg = (emailResponse as any)?.error?.message || "unknown_error";
              await logDelivery(supabase, appointment.id, "email", "failed", undefined, errorMsg);
              errorCount++;
              errors.push({ id: appointment.id, msg: `email:${errorMsg}` });
            }
          } catch (emailError) {
            await logDelivery(supabase, appointment.id, "email", "failed", undefined, String(emailError));
            errorCount++;
            errors.push({ id: appointment.id, msg: `email:${String(emailError)}` });
            // Do NOT block WhatsApp on email failure
          }
        }

        // Mark schedule reminder column if at least one channel succeeded
        if (emailSent || whatsappSent) {
          await supabase.from("appointments")
            .update({ [reminderColumn]: new Date().toISOString() })
            .eq("id", appointment.id)
            .is(reminderColumn, null);
        }
      }
    }
  } catch (e) {
    console.error(`[Reminders] Fatal error: ${e}`);
    errorCount++;
    errors.push({ id: "fatal", msg: String(e) });
  }

  // Update run record
  await supabase.from("reminder_runs").update({
    finished_at: new Date().toISOString(),
    processed_count: processedCount,
    email_sent_count: emailsSent,
    whatsapp_sent_count: whatsappsSent,
    error_count: errorCount,
    errors: errors.length > 0 ? errors : null,
  }).eq("id", runId);

  console.log(`[Reminders] Run ${runId} complete: ${processedCount} processed, ${emailsSent} emails, ${whatsappsSent} WhatsApp, ${errorCount} errors`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const reminderInternalToken = Deno.env.get("REMINDER_INTERNAL_TOKEN");

  // Auth check
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    console.error("[Reminders] Authentication failed: missing bearer token");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if this is a cron/scheduler call using the internal token
  // SECURITY: The internal token is a secret, NOT the anon key
  let isSchedulerCall = false;
  let triggerType: "cron" | "manual" = "manual";

  if (reminderInternalToken && token === reminderInternalToken) {
    // Valid internal token - this is a cron call
    isSchedulerCall = true;
    triggerType = "cron";
    console.log("[Reminders] Authenticated via internal token (cron)");
  } else {
    // Not an internal token - must be a valid user JWT with staff role
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await supabaseAuthClient.auth.getUser();
    if (error || !user) {
      console.error("[Reminders] Authentication failed: Invalid or expired JWT");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify staff role using RPC
    const { data: staffCheck, error: rpcError } = await supabaseAuthClient.rpc("is_staff", { _user_id: user.id });

    if (rpcError || !staffCheck) {
      console.error(`[Reminders] Authorization failed: User ${user.id} is not staff`);
      return new Response(JSON.stringify({ error: "Forbidden: Staff access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    triggerType = "manual";
    console.log(`[Reminders] Authenticated via JWT (manual) - user: ${user.id}`);
  }

  // Create run record FAST (synchronous DB insert)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: runData, error: runError } = await supabase
    .from("reminder_runs")
    .insert({
      trigger_type: triggerType,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runError) {
    console.error("[Reminders] Failed to create run record:", runError);
    return new Response(JSON.stringify({ error: "Failed to start run" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const runId = runData.id;
  console.log(`[Reminders] Run ${runId} created (${triggerType}), starting background processing`);

  // Use EdgeRuntime.waitUntil for background processing (returns immediately to avoid pg_net 5s timeout)
  // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions runtime
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(processReminders(runId));
  } else {
    // Fallback: run inline (for testing/local)
    await processReminders(runId);
  }

  // Return immediately (well under 5s timeout)
  return new Response(
    JSON.stringify({
      success: true,
      runId,
      triggerType,
      message: "Reminder processing started in background",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
