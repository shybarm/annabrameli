import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const welcome = "שלום, כאן המרפאה של ד״ר אנה ברמלי. בהמשך לשיחתך, אפשר לכתוב לנו כאן וצוות המרפאה ישיב בהקדם. איך נוכל לעזור?";
const encode = (value: string) => new TextEncoder().encode(value);
const hex = (value: ArrayBuffer) => Array.from(new Uint8Array(value), b => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async request => {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const challenge = url.searchParams.get("zd_echo") ?? "";
    return new Response(/^[\w-]{1,256}$/.test(challenge) ? challenge : "", {headers: {"Content-Type":"text/plain"}});
  }
  if (request.method !== "POST") return new Response(null, {status: 405});
  const form = new URLSearchParams(await request.text());
  const caller = form.get("caller_id") ?? "";
  const did = form.get("called_did") ?? "";
  const start = form.get("call_start") ?? "";
  const secret = Deno.env.get("ZADARMA_API_SECRET");
  const extension = "101";
  const token = Deno.env.get("GREEN_API_TOKEN");
  if (!secret || !token) return new Response(null, {status: 503});

  const key = await crypto.subtle.importKey("raw", encode(secret), {name:"HMAC", hash:"SHA-1"}, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, encode(caller + did + start));
  const signature = btoa(hex(mac));
  if (request.headers.get("Signature") !== signature) return new Response(null, {status: 403});
  const phone = caller.replace(/^\+/, "").replace(/^0(?=\d{8,9}$)/, "972");
  if (form.get("event") !== "NOTIFY_INTERNAL" || form.get("internal") !== extension ||
      did.replace(/^\+/, "") !== "972555070399" || !start || !/^[1-9]\d{7,14}$/.test(phone) ||
      phone === "972555070399") return Response.json({});

  const hash = hex(await crypto.subtle.digest("SHA-256", encode(JSON.stringify([caller, did, start]))));
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const table = db.from("clinic_call_messages");
  const {error} = await table.insert({call_hash: hash});
  if (error?.code === "23505") return Response.json({});
  if (error) return new Response(null, {status:503});
  let status = "review";
  try {
    const response = await fetch("https://7107.api.greenapi.com/waInstance710722808546/sendMessage/" + encodeURIComponent(token), {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({chatId: phone + "@c.us", message: welcome}),
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok && (await response.json()).idMessage) status = "queued";
  } catch {
    // Delivery is uncertain. Keep the reservation to avoid sending a second welcome.
  }
  await table.update({status}).eq("call_hash", hash);
  return Response.json({});
});
