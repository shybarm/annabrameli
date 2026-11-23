import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { clinicalDb } from './clinical/clinicalApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, ChevronDown } from 'lucide-react';

const reviewRequestMessage = 'תודה שביקרתם במרפאת ד״ר אנה ברמלי. נשמח אם תשתפו בחוות דעת על חוויית הביקור בגוגל:\nhttps://g.page/r/CfTaOxAB2XlhEAE/review\nתודה על הזמן שלכם 🌷';

export function mobileChatNumber(input: string) {
  const phone = input.replace(/\D/g, '').replace(/^0/, '972');
  return /^9725\d{8}$/.test(phone) ? phone : '';
}
type Thread = {
  state: 'shared' | 'missing' | 'stopped' | 'ready';
  messages?: { id: string; direction: string; body: string; created_at: string; status: string }[];
};
const statuses: Record<string, string> = {
  pending: 'בתור לשליחה',
  processing: 'בשליחה',
  accepted: 'התקבלה לשליחה',
  delivered: 'נמסרה',
  sent: 'נשלחה',
  read: 'נקראה',
  failed: 'השליחה נכשלה',
  cancelled: 'בוטלה',
  noAccount: 'אין חשבון וואטסאפ',
};
export function PatientConversation({ patientId, phone }: { patientId: string; phone: string }) {
  const { user, hasPermission } = useAuth();
  const allowed = hasPermission('canEditAppointments') && hasPermission('canViewPatients');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const lock = useRef(false);
  const lastAttempt = useRef<{ body: string; id: string } | null>(null);
  const thread = useQuery({
    queryKey: ['patient-wa', user?.id, patientId, phone],
    enabled: allowed,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await clinicalDb.rpc('patient_whatsapp_thread', { p_patient: patientId });
      if (error) throw error;
      return data as Thread;
    },
  });
  async function send() {
    if (lock.current || !body.trim()) return;
    lock.current = true;
    setSending(true);
    setNotice('');
    try {
      if (lastAttempt.current?.body !== body) lastAttempt.current = { body, id: crypto.randomUUID() };
      const { error } = await clinicalDb.rpc('patient_whatsapp_reply', {
        p_patient: patientId,
        p_phone: mobileChatNumber(phone),
        p_body: body,
        p_request: lastAttempt.current.id,
      });
      if (error) throw error;
      lastAttempt.current = null;
      setBody('');
      setNotice('ההודעה הועברה לתור השליחה.');
      await thread.refetch();
    } catch {
      setNotice('השליחה לא אושרה. יש לרענן ולבדוק את השיחה לפני ניסיון נוסף.');
    } finally {
      lock.current = false;
      setSending(false);
    }
  }
  if (!allowed) return <p>נדרשת הרשאת צוות לשיחות.</p>;
  const state = thread.data?.state;
  return (
    <section className="clinic-week space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="!text-lg">שיחת וואטסאפ</h2>
        <Button variant="ghost" size="sm" onClick={() => thread.refetch()} disabled={thread.isFetching}>
          רענון
        </Button>
      </header>
      {thread.isError ? (
        <p role="alert">טעינת השיחה נכשלה.</p>
      ) : thread.isPending ? (
        <p role="status">טוען שיחה…</p>
      ) : state === 'shared' ? (
        <p>המספר משותף לכמה תיקים. אפשר לפתוח את השיחה בוואטסאפ ולוודא למי היא מיועדת.</p>
      ) : state === 'missing' ? (
        <p>יש לעדכן מספר נייד בתיק.</p>
      ) : (
        <>
          {!thread.data?.messages?.length && <p>עדיין אין הודעות מתועדות למספר הזה.</p>}
          <ol className="clinic-thread">
            {thread.data?.messages?.map((m) => (
              <li key={m.id} data-outgoing={m.direction === 'outgoing'}>
                <small>
                  {m.direction === 'incoming' ? 'התקבל' : 'המרפאה'} ·{' '}
                  {new Date(m.created_at).toLocaleString('he-IL')} {statuses[m.status]}
                </small>
                <p>{m.body}</p>
              </li>
            ))}
          </ol>
          {state === 'stopped' ? (
            <p>עדכונים למספר זה הופסקו.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3" dir="rtl">
                <label htmlFor="patient-whatsapp-message" className="text-sm font-medium">הודעה למטופל</label>
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={sending}>
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      הוספת תבנית
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => {
                      setBody(current => current.trim() ? current.trimEnd() + '\n\n' + reviewRequestMessage : reviewRequestMessage);
                      setNotice('הנוסח נוסף להודעה. אפשר לערוך אותו לפני השליחה.');
                    }} disabled={body.includes('https://g.page/r/CfTaOxAB2XlhEAE/review') || body.length + reviewRequestMessage.length + 2 > 4000}>
                      בקשת חוות דעת בגוגל
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="patient-whatsapp-message"
                dir="rtl"
                aria-label="הודעה למטופל"
                disabled={sending}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={4000}
                placeholder="כתיבת הודעה…"
              />
              <Button onClick={send} disabled={sending || !body.trim()}>
                שליחה בוואטסאפ
              </Button>
            </>
          )}
        </>
      )}
      {(thread.isError || state === 'shared') && mobileChatNumber(phone) && (
        <Button asChild variant="outline">
          <a href={'https://wa.me/' + mobileChatNumber(phone)} target="_blank" rel="noopener noreferrer">
            פתיחה בוואטסאפ
          </a>
        </Button>
      )}
      <span role="status">{notice}</span>
    </section>
  );
}
