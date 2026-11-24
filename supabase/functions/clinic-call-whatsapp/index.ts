// Updated clinic greeting: children and adults, 21 November 2026.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const welcome =
  "שלום, כאן המרפאה של ד״ר אנה ברמלי. בהמשך לשיחתך, אפשר לכתוב לנו כאן וצוות המרפאה ישיב בהקדם. איך נוכל לעזור?";
const encode = (value: string) => new TextEncoder().encode(value);
const hex = (value: ArrayBuffer) => Array.from(new Uint8Array(value), (b) => b.toString(16).padStart(2, "0")).join("");

// Send only anonymous operational events, never caller data or the internal call hash.
async function measureCall(status: string) {
  const apiSecret = Deno.env.get("GA4_MEASUREMENT_API_SECRET");
  if (!apiSecret) return;
  const sessionId = Math.floor(Date.now() / 1000);
  const names = ["clinic_ivr_press_1", status === "scheduled" ? "clinic_whatsapp_scheduled" : status === "queued" ? "clinic_whatsapp_sent" : "clinic_whatsapp_failed"];
  try {
    const response = await fetch(
      "https://www.google-analytics.com/mp/collect?measurement_id=G-671NNHCM9J&api_secret=" +
        encodeURIComponent(apiSecret),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: crypto.randomUUID(),
          consent: { ad_user_data: "DENIED", ad_personalization: "DENIED" },
          events: names.map((name) => ({
            name,
            params: {
              session_id: sessionId,
              engagement_time_msec: 1,
              contact_channel: "phone_ivr",
              ...(name === "clinic_whatsapp_sent" ? { delivery_stage: "provider_accepted" } : {}),
            },
          })),
        }),
        signal: AbortSignal.timeout(3000),
      },
    );
    console.info("clinic_measurement", response.ok ? "submitted" : "rejected", response.status);
  } catch {
    console.warn("clinic_measurement", "unavailable");
  }
}

Deno.serve(async (request) => {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const challenge = url.searchParams.get("zd_echo") ?? "";
    return new Response(/^[\w-]{1,256}$/.test(challenge) ? challenge : "", {
      headers: { "Content-Type": "text/plain" },
    });
  }
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const form = new URLSearchParams(await request.text());
  const caller = form.get("caller_id") ?? "";
  const did = form.get("called_did") ?? "";
  const start = form.get("call_start") ?? "";
  const secret = Deno.env.get("ZADARMA_API_SECRET");

  const token = Deno.env.get("GREEN_API_TOKEN");
  if (!secret || !token) return new Response(null, { status: 503 });

  const key = await crypto.subtle.importKey("raw", encode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encode(caller + did + start));
  const signature = btoa(hex(mac));
  if (request.headers.get("Signature") !== signature) return new Response(null, { status: 403 });
  const event = form.get("event");
  const clinicCall = did.replace(/^\+/, "") === "972555070399";
  const prompt = () =>
    Response.json({
      ivr_play: "6b01cd5bc4a32095b3051281",
      wait_dtmf: { timeout: 5, attempts: 1, maxdigits: 1, name: "clinic_menu", default: "100" },
    });
  const confirmed = () =>
    Response.json({
      ivr_play: "6b006479ffb473b1760f388a",
      wait_dtmf: { timeout: 1, attempts: 1, maxdigits: 1, name: "clinic_done", default: "hangup" },
    });
  if (!clinicCall) return Response.json({});
  if (event === "NOTIFY_START") {
    console.info("clinic_ivr", "greeting");
    return prompt();
  }
  let choice: Record<string, string> = {};
  try {
    choice = JSON.parse(form.get("wait_dtmf") ?? "{}");
  } catch {
    /* Form fields handled below. */
  }
  const name = choice.name ?? form.get("wait_dtmf[name]");
  const digits = choice.digits ?? form.get("wait_dtmf[digits]");
  const defaultBehaviour = choice.default_behaviour ?? form.get("wait_dtmf[default_behaviour]");
  if (event === "NOTIFY_IVR")
    console.info(
      "clinic_ivr",
      name === "clinic_menu" ? "menu" : name === "clinic_done" ? "confirmation_finished" : "unknown_step",
      digits === "1" ? "pressed_1" : "other",
      defaultBehaviour === "1" ? "timeout" : "input",
    );
  if (event === "NOTIFY_IVR" && defaultBehaviour === "1") return Response.json({});
  if (event === "NOTIFY_IVR" && name === "clinic_done") return Response.json({ hangup: 1 });
  if (event === "NOTIFY_IVR" && name === "clinic_menu" && digits !== "1") {
    return digits === "0" ? Response.json({ redirect: "100" }) : prompt();
  }
  const selected = event === "NOTIFY_IVR" && name === "clinic_menu" && digits === "1";
  const legacy = event === "NOTIFY_INTERNAL" && form.get("internal") === "101";
  const phone = caller.replace(/^\+/, "").replace(/^0(?=\d{8,9}$)/, "972");
  if (
    (!selected && !legacy) ||
    did.replace(/^\+/, "") !== "972555070399" ||
    !start ||
    !/^[1-9]\d{7,14}$/.test(phone) ||
    phone === "972555070399"
  )
    return Response.json({});

  const hash = hex(await crypto.subtle.digest("SHA-256", encode(JSON.stringify([caller, did, start]))));
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // New delayed flow is activated in the database only after deployment verification.
  if (selected) {
    const { data: scheduled, error: scheduleError } = await db.rpc("schedule_clinic_referral", {
      p_phone: phone, p_name: "", p_source: "phone_ivr",
    });
    if (scheduleError && scheduleError.code !== "PGRST202") return new Response(null, { status: 503 });
    if (["scheduled", "duplicate", "suppressed"].includes(scheduled)) {
      if (scheduled === "scheduled") await measureCall("scheduled");
      return confirmed();
    }
    if (!scheduleError && scheduled !== "disabled") return Response.json({ redirect: "100" });
  }
  const table = db.from("clinic_call_messages");
  const { error } = await table.insert({ call_hash: hash });
  if (error?.code === "23505") {
    const { data } = await table.select("status").eq("call_hash", hash).single();
    return selected && (data?.status === "queued" || data?.status === "pending")
      ? confirmed()
      : Response.json({ redirect: "100" });
  }
  if (error) return new Response(null, { status: 503 });
  const dispatch = async () => {
    let status = "review";
    try {
      const response = await fetch(
        "https://7107.api.greenapi.com/waInstance710722808546/sendMessage/" + encodeURIComponent(token),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: phone + "@c.us", message: welcome }),
          signal: AbortSignal.timeout(5000),
        },
      );
      if (response.ok && (await response.json()).idMessage) status = "queued";
    } catch {
      // Preserve the reservation on uncertain delivery; never send duplicates.
    }
    await table.update({ status }).eq("call_hash", hash);
    console.info("clinic_whatsapp", status, selected ? "ivr" : "legacy_extension");
    await measureCall(status);
    return status;
  };
  const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil: (promise: Promise<unknown>) => void } })
    .EdgeRuntime;
  if (runtime && selected) {
    // The durable call reservation exists before playback; dispatch continues during the thank-you.
    runtime.waitUntil(dispatch().catch(() => console.error("clinic_whatsapp", "dispatch_failed")));
    return confirmed();
  }
  const status = await dispatch();
  return selected && status === "queued" ? confirmed() : Response.json({ redirect: "100" });
});

// Non-blocking confirmation playback.
