import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const base = "https://7107.api.greenapi.com/waInstance710722808546/";
const endpoint = "https://ftatmcyrmeyhghgckvbj.supabase.co/functions/v1/clinic-whatsapp-bot";
const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
async function provider(method: string, data?: unknown) {
  const token = Deno.env.get("GREEN_API_TOKEN");
  if (!token) throw new Error("Provider unavailable");
  const response = await fetch(base + method + "/" + encodeURIComponent(token), {
    method: data ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Provider rejected request");
  return await response.json();
}
async function drain() {
  const client = db();
  for (let n = 0; n < 8; n++) {
    const { data: job, error } = await client.rpc("claim_clinic_whatsapp_outbox");
    if (error) {
      console.warn("whatsapp_queue_code", error.code);
      throw new Error("Queue unavailable: " + error.code);
    }
    if (!job) return;
    let id: string | null = null;
    try {
      const result = await provider("sendMessage", { chatId: job.phone + "@c.us", message: job.body });
      if (typeof result.idMessage === "string") id = result.idMessage;
    } catch {
      /* Never blindly retry an ambiguous send. */
    }
    const saved = await client.rpc("finish_clinic_whatsapp_outbox", {
      p_id: job.id,
      p_provider_id: id,
      p_error: id ? null : "delivery_uncertain",
    });
    if (saved.error) throw new Error("Delivery status unavailable");
  }
}
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (Number(request.headers.get("content-length") || 0) > 100000) return new Response(null, { status: 413 });
  const client = db();
  const { data: config, error: configError } = await client.rpc("whatsapp_bot_config");
  if (configError || !config) return new Response(null, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  try {
    if (body.action === "tick") {
      if (body.key !== config.dispatch_token) return new Response(null, { status: 403 });
      if (config.setup_state === "pending") {
        const settings = await provider("getSettings");
        if (settings.webhookUrl && settings.webhookUrl !== endpoint) {
          await client
            .from("whatsapp_bot_settings")
            .update({ setup_state: "existing_webhook_requires_review" })
            .eq("singleton", true);
          return new Response(null, { status: 409 });
        }
        const result = await provider("setSettings", {
          webhookUrl: endpoint,
          webhookUrlToken: "Bearer " + config.webhook_secret,
          incomingWebhook: "yes",
          outgoingWebhook: "yes",
          outgoingMessageWebhook: "yes",
          outgoingAPIMessageWebhook: "no",
        });
        if (!result.saveSettings) throw new Error("Settings not saved");
        await client
          .from("whatsapp_bot_settings")
          .update({ setup_state: "configured", updated_at: new Date().toISOString() })
          .eq("singleton", true);
      }
      if (config.setup_state === "existing_webhook_requires_review") return new Response(null, { status: 409 });
      await drain();
      return new Response(null, { status: 200 });
    }
    if (request.headers.get("authorization") !== "Bearer " + config.webhook_secret)
      return new Response(null, { status: 403 });
    if (String(body.instanceData?.idInstance) !== "710722808546" || body.instanceData?.wid !== "972555070399@c.us")
      return new Response(null, { status: 403 });
    if (body.typeWebhook === "quotaExceeded") {
      await client
        .from("whatsapp_bot_settings")
        .update({ quota_exceeded_at: new Date().toISOString() })
        .eq("singleton", true);
      return new Response(null, { status: 200 });
    }
    if (body.typeWebhook === "outgoingMessageStatus") {
      const status = body.status;
      if (["sent", "delivered", "read", "failed", "noAccount"].includes(status) && typeof body.idMessage === "string") {
        // Monotonic delivery statuses: late "sent" must never replace "read".
        const { data: message } = await client
          .from("whatsapp_messages")
          .select("id,status,conversation_id")
          .eq("provider_id", body.idMessage)
          .maybeSingle();
        const rank: Record<string, number> = {
          pending: 0,
          processing: 1,
          accepted: 2,
          sent: 3,
          delivered: 4,
          read: 5,
          failed: 2,
          noAccount: 2,
        };
        if (
          message &&
          ((rank[status] ?? 0) > (rank[message.status] ?? 0) ||
            (["failed", "noAccount"].includes(status) && (rank[message.status] ?? 0) < 4))
        )
          await client.from("whatsapp_messages").update({ status }).eq("id", message.id);
        if (status === "delivered" || status === "read")
          await client
            .from("telephone_whatsapp_deliveries")
            .update({ state: "delivered" })
            .eq("provider_message_id", body.idMessage);
      }
    } else if (["incomingMessageReceived", "outgoingMessageReceived"].includes(body.typeWebhook)) {
      const chat = body.senderData?.chatId;
      if (typeof chat !== "string" || !/^[1-9]\d{7,14}@c\.us$/.test(chat)) return new Response(null, { status: 200 });
      const data = body.messageData || {};
      const text = data.textMessageData?.textMessage || data.extendedTextMessageData?.text || "";
      const isText = ["textMessage", "extendedTextMessage"].includes(data.typeMessage);
      const timestamp = Number(body.timestamp);
      if (!Number.isFinite(timestamp) || typeof body.idMessage !== "string") return new Response(null, { status: 200 });
      const received = await client.rpc("receive_clinic_whatsapp", {
        p_phone: chat.split("@")[0],
        p_provider_id: body.idMessage,
        p_body: isText ? String(text).slice(0, 4000) : "[התקבלה הודעת מדיה. לצפייה יש לפתוח את WhatsApp של המרפאה.]",
        p_type: isText ? "text" : "media",
        p_timestamp: new Date(timestamp * 1000).toISOString(),
        p_from_staff: body.typeWebhook === "outgoingMessageReceived",
      });
      if (received.error) throw new Error("Incoming message not saved");
      await client
        .from("whatsapp_bot_settings")
        .update({ last_incoming_at: new Date().toISOString() })
        .eq("singleton", true);
      // Outbound sends have their own durable queue; provider retries cannot duplicate replies.
      const background = drain().catch(() => console.warn("whatsapp_bot", "queue_pending"));
      const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil: (p: Promise<void>) => void } })
        .EdgeRuntime;
      if (runtime) runtime.waitUntil(background);
      else await background;
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    const code =
      error instanceof Error &&
      /^(Queue unavailable|Delivery status unavailable|Provider unavailable|Provider rejected request|Settings not saved)/.test(
        error.message,
      )
        ? error.message
        : "operation_failed";
    console.error("whatsapp_bot", code);
    return Response.json({ error: code }, { status: 503 });
  }
});

// Clinic-owned WhatsApp intake and incoming messages.

// Delivery health is visible only to clinic staff.
