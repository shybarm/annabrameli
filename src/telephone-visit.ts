import { validMeetUrl, ISRAEL_ZONE } from '../supabase/functions/_shared/visit-logistics';

const token = location.hash.slice(1);
const when = document.querySelector<HTMLElement>('#when')!;
const status = document.querySelector<HTMLElement>('#status')!;
const instructions = document.querySelector<HTMLElement>('#instructions')!;
const join = document.querySelector<HTMLAnchorElement>('#join')!;
const dateFormat = new Intl.DateTimeFormat('he-IL', {timeZone: ISRAEL_ZONE, dateStyle: 'full', timeStyle: 'short'});
async function refresh() {
  try {
    const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/rpc/telephone_invitation', {
      method: 'POST', cache: 'no-store',
      headers: {apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json'},
      body: JSON.stringify({p_token: token}),
    });
    if (!response.ok) throw new Error();
    const [visit] = await response.json();
    const ready = !!visit?.meeting_url && validMeetUrl(visit.meeting_url);
    when.textContent = visit ? dateFormat.format(new Date(visit.scheduled_at)) + ' (שעון ישראל) · ' + visit.duration_minutes + ' דקות' : '';
    instructions.hidden = !visit;
    join.hidden = !ready;
    if (ready) join.href = visit.meeting_url;
    else join.removeAttribute('href');
    status.textContent = !visit ? 'ההזמנה אינה פעילה. לבירור המועד יש לפנות למרפאה.' : ready ? 'חדר הווידאו מוכן.' : 'קישור הווידאו עדיין בהכנה. העמוד מתעדכן אוטומטית.';
    if (!visit) return;
  } catch {
    join.hidden = true;
    status.textContent = 'אירעה בעיית חיבור. ננסה שוב בעוד רגע.';
  }
  window.setTimeout(refresh, 30000);
}
if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(token)) void refresh();
else status.textContent = 'הקישור חסר או שגוי. יש לפתוח את הקישור המלא מהמרפאה.';
