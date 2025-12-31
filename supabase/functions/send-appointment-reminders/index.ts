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
  const from = Deno.env.get("TWILIO_PHONE_NUMBER");
  return Boolean(sid && token && from && from.toLowerCase().includes("whatsapp"));
}

function normalizePhoneE164(phoneRaw: string): string | null {
  const digits = phoneRaw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) {
    const national = digits.slice(1);
    if (!national) return null;
    return `+972${national}`;
  }
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

async function sendWhatsAppViaTwilio(args: { toPhone: string; body: string }): Promise<{ ok: boolean; error?: string }> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const from = Deno.env.get("TWILIO_PHONE_NUMBER")!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const form = new URLSearchParams();
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

    if (!resp.ok) {
      return { ok: false, error: `twilio_http_${resp.status}` };
    }
    return { ok: true };
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
          ${reminderColumn},
          patients (first_name, last_name, phone, email),
          clinics (name)
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

        const patientRow = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients;
        const patient = patientRow;

        let whatsappSent = false;
        let emailSent = false;

        // WhatsApp
        if (schedule.send_whatsapp && patient?.phone && whatsappConfigured) {
          const toE164 = normalizePhoneE164(patient.phone);
          if (toE164) {
            const message = `תזכורת לתור במרפאה\nתאריך: ${dateStr}\nשעה: ${timeStr}\nמקום: ${clinicName}`;
            const waRes = await sendWhatsAppViaTwilio({ toPhone: toE164, body: message });
            if (waRes.ok) {
              await supabase.from("appointments")
                .update({ reminder_whatsapp_sent_at: new Date().toISOString() })
                .eq("id", appointment.id);
              whatsappsSent++;
              whatsappSent = true;
            } else {
              errorCount++;
              errors.push({ id: appointment.id, msg: `whatsapp:${waRes.error}` });
            }
          }
        }

        // Email
        if (schedule.send_email && patient?.email && resendApiKey) {
          try {
            const resend = new Resend(resendApiKey);
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
                  </div>
                  <p>נשמח לראותך.</p>
                </div>
              `,
            });

            const resendId = (emailResponse as any)?.id;
            if (resendId) {
              await supabase.from("appointments")
                .update({ reminder_email_sent_at: new Date().toISOString() })
                .eq("id", appointment.id);
              emailsSent++;
              emailSent = true;
            }
          } catch (emailError) {
            errorCount++;
            errors.push({ id: appointment.id, msg: `email:${String(emailError)}` });
          }
        }

        // Mark schedule reminder column
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

  // Auth check
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    console.error("Authentication failed: missing bearer token");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isSchedulerCall = token === supabaseAnonKey;

  if (!isSchedulerCall) {
    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await supabaseAuthClient.auth.getUser();
    if (error || !user) {
      console.error("Authentication failed: Invalid or expired token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: staffCheck, error: rpcError } = await supabaseAuthClient.rpc("is_staff", { _user_id: user.id });

    if (rpcError || !staffCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Create run record FAST (synchronous DB insert)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: runData, error: runError } = await supabase
    .from("reminder_runs")
    .insert({
      trigger_type: isSchedulerCall ? "cron" : "manual",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runError) {
    console.error("Failed to create run record:", runError);
    return new Response(JSON.stringify({ error: "Failed to start run" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const runId = runData.id;
  console.log(`[Reminders] Run ${runId} created, starting background processing`);

  // Use EdgeRuntime.waitUntil for background processing (returns immediately to avoid timeout)
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
      message: "Reminder processing started in background",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
