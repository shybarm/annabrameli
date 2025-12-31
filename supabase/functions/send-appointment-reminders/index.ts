import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const resendApiKey = Deno.env.get("RESEND_API_KEY") || undefined;

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || undefined;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || undefined;
// For WhatsApp via Twilio this must be in the format: whatsapp:+1415xxxxxxx
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_PHONE_NUMBER") || undefined;

const DEFAULT_CLINIC_TIMEZONE = "Asia/Jerusalem";
const CRON_INTERVAL_MINUTES = 5;
// Lookahead window should be >= cron interval to avoid missing appointments.
const LOOKAHEAD_MINUTES = 10;

function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function addHours(d: Date, hours: number) {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

function isTwilioWhatsAppConfigured(): boolean {
  return Boolean(
    TWILIO_ACCOUNT_SID &&
      TWILIO_AUTH_TOKEN &&
      TWILIO_WHATSAPP_FROM &&
      TWILIO_WHATSAPP_FROM.startsWith("whatsapp:")
  );
}

function normalizePhoneE164(phoneRaw: string): string | null {
  const digits = phoneRaw.replace(/\D/g, "");
  if (!digits) return null;

  // If already includes country code (e.g., 972...) assume E.164 without plus.
  // If starts with 0 (local IL), convert to +972.
  if (digits.startsWith("0")) {
    const national = digits.slice(1);
    if (!national) return null;
    return `+972${national}`;
  }

  // If seems like a country code already, just prefix +
  if (digits.length >= 10) return `+${digits}`;

  return null;
}

async function sendWhatsAppViaTwilio(args: {
  toPhone: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }>
{
  if (!isTwilioWhatsAppConfigured()) {
    return { ok: false, error: "whatsapp_not_configured" };
  }

  const url =
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const form = new URLSearchParams();
  form.set("From", TWILIO_WHATSAPP_FROM!);
  form.set("To", `whatsapp:${args.toPhone}`);
  form.set("Body", args.body);

  const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const text = await resp.text();

  if (!resp.ok) {
    console.error(
      JSON.stringify({
        msg: "twilio_whatsapp_send_failed",
        status: resp.status,
        // Do not log raw response if it may include phone numbers etc.
      })
    );
    return { ok: false, error: `twilio_http_${resp.status}` };
  }

  // Twilio returns JSON; don’t log it to avoid leaking phone numbers.
  try {
    JSON.parse(text);
  } catch {
    // ignore
  }

  return { ok: true };
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: This function should only be called by scheduler or staff.
  // Note: verify_jwt is disabled for this function; we enforce a header check here.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  if (!token) {
    console.error("Authentication failed: missing bearer token");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Allow calls from database scheduler (which uses the anon key as bearer)
  // OR from staff users (validated below).
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

    const { data: staffCheck, error: rpcError } = await supabaseAuthClient.rpc(
      "is_staff",
      { _user_id: user.id }
    );

    if (rpcError || !staffCheck) {
      console.error("Authorization failed: staff only");
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const runStartedAt = new Date();
  console.log(
    JSON.stringify({
      msg: "appointment_reminder_run_start",
      at: runStartedAt.toISOString(),
      tz: DEFAULT_CLINIC_TIMEZONE,
      cron_interval_minutes: CRON_INTERVAL_MINUTES,
      lookahead_minutes: LOOKAHEAD_MINUTES,
      scheduler: isSchedulerCall,
    })
  );

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: schedules, error: schedulesError } = await supabase
      .from("reminder_schedules")
      .select("*")
      .eq("is_active", true)
      .order("hours_before", { ascending: false });

    if (schedulesError) {
      console.error(
        JSON.stringify({ msg: "fetch_schedules_failed", code: schedulesError.code })
      );
      throw schedulesError;
    }

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active reminder schedules" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const lookaheadEnd = addMinutes(now, LOOKAHEAD_MINUTES);

    let emailsSent = 0;
    let whatsappsSent = 0;
    let remindersMarked = 0;

    for (const schedule of schedules) {
      // Compute: appointments whose scheduled_at falls in [now+hours_before, now+hours_before+LOOKAHEAD]
      const windowStart = addHours(now, schedule.hours_before);
      const windowEnd = addHours(lookaheadEnd, schedule.hours_before);

      const reminderColumn = schedule.hours_before >= 24
        ? "reminder_24h_sent_at"
        : "reminder_2h_sent_at";

      console.log(
        JSON.stringify({
          msg: "schedule_window",
          hours_before: schedule.hours_before,
          reminder_column: reminderColumn,
          window_start: windowStart.toISOString(),
          window_end: windowEnd.toISOString(),
          send_email: !!schedule.send_email,
          send_whatsapp: !!schedule.send_whatsapp,
        })
      );

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(
          `
          id,
          scheduled_at,
          status,
          clinic_id,
          ${reminderColumn},
          patients (first_name, last_name, phone, email),
          clinics (name)
        `
        )
        .gte("scheduled_at", windowStart.toISOString())
        .lte("scheduled_at", windowEnd.toISOString())
        // Business requirement: only planned appointments.
        .eq("status", "מתוכנן")
        .is(reminderColumn, null);

      if (appointmentsError) {
        console.error(
          JSON.stringify({
            msg: "fetch_appointments_failed",
            hours_before: schedule.hours_before,
            code: appointmentsError.code,
          })
        );
        continue;
      }

      console.log(
        JSON.stringify({
          msg: "appointments_found",
          hours_before: schedule.hours_before,
          count: appointments?.length || 0,
        })
      );

      for (const appointment of appointments || []) {
        const appointmentDate = new Date(appointment.scheduled_at);
        const { dateStr, timeStr } = formatHeDateTime(
          appointmentDate,
          DEFAULT_CLINIC_TIMEZONE
        );

        const clinicRow = Array.isArray(appointment.clinics)
          ? appointment.clinics[0]
          : appointment.clinics;
        const clinicName = clinicRow?.name || "המרפאה";

        const patientRow = Array.isArray(appointment.patients)
          ? appointment.patients[0]
          : appointment.patients;
        const patient = patientRow;

        // WhatsApp: if not configured, skip without failing and allow email fallback.
        let whatsappSentForThisAppointment = false;
        if (schedule.send_whatsapp && patient?.phone) {
          const toE164 = normalizePhoneE164(patient.phone);
          if (toE164 && isTwilioWhatsAppConfigured()) {
            const message = `תזכורת לתור במרפאה\nתאריך: ${dateStr}\nשעה: ${timeStr}\nמקום: ${clinicName}`;
            const waRes = await sendWhatsAppViaTwilio({ toPhone: toE164, body: message });
            if (waRes.ok) {
              const { error: waMarkError } = await supabase
                .from("appointments")
                .update({ reminder_whatsapp_sent_at: new Date().toISOString() })
                .eq("id", appointment.id);

              if (!waMarkError) {
                whatsappsSent++;
                whatsappSentForThisAppointment = true;
              }
            } else {
              console.warn(
                JSON.stringify({
                  msg: "whatsapp_skipped_or_failed",
                  appointment_id: appointment.id,
                  reason: waRes.error,
                })
              );
            }
          } else {
            console.warn(
              JSON.stringify({
                msg: "whatsapp_skipped_or_failed",
                appointment_id: appointment.id,
                reason: !toE164 ? "invalid_phone" : "whatsapp_not_configured",
              })
            );
          }
        }

        // Email
        let emailSentForThisAppointment = false;
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

            // Resend returns { id } on success.
            const resendId = (emailResponse as any)?.id;
            if (resendId) {
              const { error: emailMarkError } = await supabase
                .from("appointments")
                .update({ reminder_email_sent_at: new Date().toISOString() })
                .eq("id", appointment.id);

              if (!emailMarkError) {
                emailsSent++;
                emailSentForThisAppointment = true;
              }
            } else {
              console.error(
                JSON.stringify({
                  msg: "email_send_failed_no_id",
                  appointment_id: appointment.id,
                })
              );
            }
          } catch (emailError) {
            // Do not log patient email.
            console.error(
              JSON.stringify({
                msg: "email_send_failed",
                appointment_id: appointment.id,
              })
            );
          }
        } else if (schedule.send_email && patient?.email && !resendApiKey) {
          console.error(
            JSON.stringify({
              msg: "email_skipped_missing_resend_key",
              appointment_id: appointment.id,
            })
          );
        }

        // Idempotency: only mark the schedule reminder column after at least one successful send.
        if (emailSentForThisAppointment || whatsappSentForThisAppointment) {
          const { error: markError } = await supabase
            .from("appointments")
            .update({ [reminderColumn]: new Date().toISOString() })
            .eq("id", appointment.id)
            .is(reminderColumn, null);

          if (!markError) remindersMarked++;
        } else {
          console.warn(
            JSON.stringify({
              msg: "reminder_not_marked_no_successful_channel",
              appointment_id: appointment.id,
              hours_before: schedule.hours_before,
            })
          );
        }
      }
    }

    const finishedAt = new Date();
    console.log(
      JSON.stringify({
        msg: "appointment_reminder_run_complete",
        at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - runStartedAt.getTime(),
        emails_sent: emailsSent,
        whatsapps_sent: whatsappsSent,
        reminders_marked: remindersMarked,
        whatsapp_configured: isTwilioWhatsAppConfigured(),
        resend_configured: !!resendApiKey,
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        whatsappsSent,
        remindersMarked,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        msg: "appointment_reminder_run_error",
        at: new Date().toISOString(),
      })
    );

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
