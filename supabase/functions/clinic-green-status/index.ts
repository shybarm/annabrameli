import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
const headers = {
  'Access-Control-Allow-Origin': 'https://ihaveallergy.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const reply = (value: unknown, status: number) =>
  new Response(JSON.stringify(value), { headers, status });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return reply({}, 405);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('authorization') || '' } },
  });
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return reply({}, 401);
  const { data: allowed, error } = await db.rpc('can_edit_appointments', { _user_id: user.id });
  if (error || !allowed) return reply({}, 403);
  const token = Deno.env.get('GREEN_API_TOKEN');
  if (!token) return reply({}, 503);
  try {
    const result = await fetch(
      'https://7107.api.greenapi.com/waInstance710722808546/getStateInstance/' +
        encodeURIComponent(token),
      { signal: AbortSignal.timeout(8000) },
    );
    if (!result.ok) return reply({}, 502);
    const { stateInstance } = await result.json();
    if (typeof stateInstance !== 'string') return reply({}, 502);
    return reply({ state: stateInstance === 'authorized' ? 'authorized' : 'unavailable' }, 200);
  } catch {
    return reply({}, 502);
  }
});
