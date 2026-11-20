export const ISRAEL_ZONE = 'Asia/Jerusalem';
export const validMeetUrl = (url: string) => /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(url);
export const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export const PHONE_INSTRUCTIONS = 'זהו תור טלפוני, אין להגיע למרפאה. יש להיות זמינים בטלפון שמסרתם בשעת התור. אם נשלח קישור לפגישה, ניתן להצטרף דרכו בשעת התור.';
export interface VisitLogistics { id: string; scheduled_at: string; duration_minutes: number; modality?: string; meeting_url?: string | null; }
export function visitLogistics(a: VisitLogistics, clinic: {name?: string;address?: string;city?: string;phone?: string}) {
  if (a.meeting_url && !validMeetUrl(a.meeting_url)) throw new Error('Invalid Google Meet URL');
  const start = new Date(a.scheduled_at);
  if (!Number.isFinite(start.getTime()) || !Number.isInteger(a.duration_minutes) || a.duration_minutes < 1) throw new Error('Invalid appointment date or duration');
  const end = new Date(start.getTime()+a.duration_minutes*60000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const date = new Intl.DateTimeFormat('he-IL',{timeZone:ISRAEL_ZONE,weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(start);
  const time = new Intl.DateTimeFormat('he-IL',{timeZone:ISRAEL_ZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(start);
  const telephone = a.modality === 'telephone';
  const title = `${clinic.name || 'המרפאה'} - תור`;
  const location = telephone ? a.meeting_url || 'תור טלפוני' : [clinic.address,clinic.city].filter(Boolean).join(', ');
  const description = [telephone ? PHONE_INSTRUCTIONS : `תור ב${clinic.name || 'המרפאה'}`,`משך: ${a.duration_minutes} דקות`,clinic.phone ? `טלפון המרפאה: ${clinic.phone}` : '',telephone ? a.meeting_url : ''].filter(Boolean).join('\n');
  const esc = (s: string) => s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,'\\$&');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Anna Clinic//Visits//HE','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:appointment-${a.id}@ihaveallergy.com`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${esc(title)}`,`LOCATION:${esc(location)}`,`DESCRIPTION:${esc(description)}`,...(telephone && a.meeting_url ? [`URL:${a.meeting_url}`] : []),'END:VEVENT','END:VCALENDAR'];
  // Fold at UTF-8 byte boundaries per RFC 5545, not JS character count.
  const fold = (line: string) => { let out='',n=0; for(const c of line){const size=new TextEncoder().encode(c).length;if(n+size>75){out+='\r\n ';n=1;}out+=c;n+=size;}return out; };
  const ics = lines.map(fold).join('\r\n')+'\r\n';
  const google = 'https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:title,dates:`${stamp(start)}/${stamp(end)}`,location,details:description,ctz:ISRAEL_ZONE});
  const meetingHtml = telephone && a.meeting_url ? `<p><a href="${escapeHtml(a.meeting_url)}">הצטרפות לפגישה</a></p>` : '';
  const html = `<div dir="rtl"><h2>פרטי התור</h2><p>${escapeHtml(date)} בשעה ${time} (שעון ישראל)</p><p>משך: ${a.duration_minutes} דקות</p><p>${escapeHtml(telephone ? PHONE_INSTRUCTIONS : location)}</p>${meetingHtml}<p>${escapeHtml(clinic.name || 'המרפאה')}</p>${clinic.phone ? `<p>${escapeHtml(clinic.phone)}</p>` : ''}<a href="${escapeHtml(google)}">הוספה ליומן Google</a></div>`;
  return {date,time,start:start.toISOString(),end:end.toISOString(),ics,google,html,description,location};
}
