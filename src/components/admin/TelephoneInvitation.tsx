import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { copyToClipboard } from '@/utils/shareHelper';
import { normalizePhoneForStorage } from '@/hooks/usePatients';
import { visitLogistics, type VisitLogistics } from '../../../supabase/functions/_shared/visit-logistics';

interface Props {
  appointment: VisitLogistics & { invitation_token?: string | null };
  phone?: string | null;
  email?: string | null;
}

export function TelephoneInvitation({ appointment, phone, email }: Props) {
  const url = appointment.invitation_token ? window.location.origin + '/visit.html#' + appointment.invitation_token : appointment.meeting_url;
  if (!url) return null;
  const details = visitLogistics(appointment, {name: 'מרפאת ד״ר אנה ברמלי'}, email || undefined);
  const message = [
    'שלום, נקבע לך תור טלפוני עם ד״ר אנה ברמלי.',
    details.date + ' בשעה ' + details.time + ' (שעון ישראל), למשך ' + appointment.duration_minutes + ' דקות.',
    'בשעת התור יש להיות זמינים בטלפון שמסרת למרפאה. אין צורך להגיע למרפאה.',
    'למעבר לווידאו יש לפתוח את הקישור בדפדפן, לאפשר שימוש במצלמה ובמיקרופון וללחוץ על הצטרפות. אם מופיעה בקשת המתנה, יש להמתין לכניסת הרופאה.',
    url,
  ].join('\n');
  const number = normalizePhoneForStorage(phone || '').replace(/\D/g, '');
  const whatsapp = new URL('https://wa.me/' + number);
  whatsapp.searchParams.set('text', message);

  return <section className="space-y-3">
    <Label htmlFor="patient-invitation">הודעת הזמנה למטופל</Label>
    <Textarea id="patient-invitation" readOnly value={message} rows={6} />
    <div className="flex flex-wrap gap-2">
      <Button asChild><a href={whatsapp.href} target="_blank" rel="noreferrer">פתיחת הודעה בוואטסאפ</a></Button>
      <Button type="button" variant="outline" onClick={() => copyToClipboard(message)}>העתקת ההזמנה</Button>
      <Button type="button" variant="outline" onClick={() => copyToClipboard(url)}>העתקת קישור לתור</Button>
      <Button asChild variant="outline"><a href={url} target="_blank" rel="noreferrer">פתיחת פרטי התור והווידאו</a></Button>
      {email && !appointment.invitation_token && <Button asChild variant="outline"><a href={details.google} target="_blank" rel="noreferrer">פתיחת זימון ביומן Google</a></Button>}
    </div>
    {email && !appointment.invitation_token && <p className="text-sm text-muted-foreground">ביומן Google הקישור כבר מופיע במיקום. אם נוסף חדר וידאו אחר, הסירו אותו לפני השליחה.</p>}
  </section>;
}
