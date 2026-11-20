import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { copyToClipboard } from '@/utils/shareHelper';
import { normalizePhoneForStorage } from '@/hooks/usePatients';
import { telephoneMessage } from '../../../supabase/functions/_shared/telephone-message';
import { visitLogistics, type VisitLogistics } from '../../../supabase/functions/_shared/visit-logistics';

interface Props {
  appointment: VisitLogistics & { invitation_token?: string | null };
  phone?: string | null;
  email?: string | null;
}

export function TelephoneInvitation({ appointment, phone, email }: Props) {
  const delivery = useQuery({
    queryKey: ['telephone-whatsapp-delivery', appointment.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('telephone_whatsapp_deliveries')
        .select('appointment_id,state,auto_enabled,updated_at,accepted_at,error_code').eq('appointment_id', appointment.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });
  const room = useQuery({
    queryKey: ['telephone-meet-room', appointment.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('appointments').select('meeting_url').eq('id', appointment.id).single();
      if (error) throw error;
      return data.meeting_url;
    },
    refetchInterval: (query) => query.state.data ? false : 5000,
  });
  const meetingUrl = room.data || appointment.meeting_url;
  const status = delivery.isError ? 'לא ניתן לבדוק כרגע את מצב השליחה האוטומטית.'
    : delivery.isPending ? 'בודקים את מצב השליחה האוטומטית…'
    : !delivery.data?.auto_enabled ? 'התור נקבע לפני הפעלת השליחה האוטומטית. אפשר לשלוח את ההזמנה ידנית.'
    : delivery.data.state === 'accepted' ? 'ההזמנה הועברה לוואטסאפ ממספר המרפאה 055-507-0399. זהו אישור קבלה בשירות, ולא אישור קריאה של המטופל.'
    : delivery.data.state === 'delivered' ? 'הזמנת התור נמסרה בוואטסאפ ממספר המרפאה 055-507-0399.'
    : delivery.data.state === 'failed' ? (delivery.data.error_code === 'delivery_uncertain'
      ? 'לא התקבל אישור שליחה חד משמעי. יש לבדוק בוואטסאפ של המרפאה לפני שליחה נוספת, כדי למנוע כפילות.'
      : 'השליחה האוטומטית נכשלה. יש לבדוק את מספר המטופל ואת חיבור הוואטסאפ במרפאה.')
    : delivery.data.state === 'cancelled' ? 'השליחה האוטומטית בוטלה כי התור אינו פעיל או שמועדו חלף.'
    : meetingUrl ? 'ההזמנה נשלחת אוטומטית ממספר המרפאה. אין צורך להשאיר את הדף פתוח.'
    : 'מכינים Google Meet וקישורים אישיים. ההזמנה תישלח אוטומטית כשהכול מוכן, בדרך כלל בתוך כמה דקות.';
  const url = appointment.invitation_token ? window.location.origin + '/visit.html#' + appointment.invitation_token : appointment.meeting_url;
  const intake = useQuery({
    queryKey: ['telephone-intake', appointment.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('telephone_intake_token', {p_visit: appointment.id});
      if (error || !data) throw error || new Error('Missing intake link');
      return window.location.origin + '/intake/' + data;
    },
    staleTime: 0,
    gcTime: 0,
    enabled: !!url,
  });
  if (!url) return null;
  if (!intake.data || intake.isError || intake.isPending) return <section role="status">{intake.isError
    ? <Button type="button" variant="outline" onClick={() => intake.refetch()}>הכנת ההזמנה נכשלה · ניסיון חוזר</Button>
    : 'מכינים את ההזמנה עם הקישורים האישיים…'}</section>;
  const details = visitLogistics(appointment, {name: 'מרפאת ד״ר אנה ברמלי'}, email || undefined);
  if (!meetingUrl) return <section role="status" className="text-sm">{status}</section>;
  const message = telephoneMessage({ ...appointment, meeting_url: meetingUrl }, intake.data, url);
  const number = normalizePhoneForStorage(phone || '').replace(/\D/g, '');
  const whatsapp = new URL('https://wa.me/' + number);
  whatsapp.searchParams.set('text', message);

  return <section className="space-y-3">
    <p role="status" className="text-sm text-muted-foreground">{status}</p>
    <Label htmlFor="patient-invitation">הודעת הזמנה למטופל</Label>
    <Textarea id="patient-invitation" readOnly value={message} rows={6} />
    <div className="flex flex-wrap gap-2">
      {number && delivery.isSuccess && (!delivery.data?.auto_enabled || delivery.data.state === 'failed') && <Button asChild><a href={whatsapp.href} target="_blank" rel="noreferrer">פתיחת הזמנה לשליחה ידנית</a></Button>}
      {!number && <p>כדי לשלוח בוואטסאפ יש לעדכן מספר טלפון בתיק המטופל.</p>}
      {email && <Button asChild variant="outline"><a href={'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent('הזמנה לתור טלפוני במרפאת ד״ר אנה ברמלי') + '&body=' + encodeURIComponent(message)}>פתיחת הודעת מייל</a></Button>}
      <Button type="button" variant="outline" onClick={() => copyToClipboard(message)}>העתקת ההזמנה</Button>
      <Button type="button" variant="outline" onClick={() => copyToClipboard(url)}>העתקת קישור לתור</Button>
      <Button asChild variant="outline"><a href={url} target="_blank" rel="noreferrer">פתיחת פרטי התור והווידאו</a></Button>
      {email && !appointment.invitation_token && <Button asChild variant="outline"><a href={details.google} target="_blank" rel="noreferrer">פתיחת זימון ביומן Google</a></Button>}
    </div>
    {email && !appointment.invitation_token && <p className="text-sm text-muted-foreground">ביומן Google הקישור כבר מופיע במיקום. אם נוסף חדר וידאו אחר, הסירו אותו לפני השליחה.</p>}
  </section>;
}
