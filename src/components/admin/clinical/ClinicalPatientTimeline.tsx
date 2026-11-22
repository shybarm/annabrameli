import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { readVisit } from './visitModel';
import { useVisitDocuments, VisitDocumentButton } from './ClinicalDocuments';

type Appointment = {
  id: string;
  scheduled_at: string;
  visit_summary?: string | null;
  medications?: string | null;
  treatment_plan?: string | null;
  appointment_types?: { name_he?: string | null } | null;
};
export function ClinicalPatientTimeline({
  patientId,
  appointments,
  loading,
  failed,
}: {
  patientId: string;
  appointments: Appointment[];
  loading: boolean;
  failed: boolean;
}) {
  const { user } = useAuth();
  const docs = useVisitDocuments({ patientId });
  const ids = appointments.map((a) => a.id);
  const drafts = useQuery({
    queryKey: ['clinical-timeline', user?.id, patientId, ids],
    queryFn: async () => {
      if (!ids.length) return [];
      const r = await supabase
        .from('clinical_visits')
        .select('appointment_id,revision,content')
        .in('appointment_id', ids);
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const visits = appointments
    .map((a) => {
      const draft = drafts.data?.find((v) => v.appointment_id === a.id);
      const documents = docs.data?.filter((d) => d.appointment_id === a.id) ?? [];
      const content = readVisit(draft?.content);
      const excerpt =
        content.complaint ||
        content.assessment ||
        content.history ||
        a.visit_summary ||
        a.treatment_plan ||
        a.medications;
      return { a, draft, documents, excerpt };
    })
    .filter((v) => v.draft || v.documents.length || v.excerpt)
    .sort((x, y) => y.a.scheduled_at.localeCompare(x.a.scheduled_at));
  const pending = loading || docs.isPending || drafts.isPending;
  const error = failed || docs.isError || drafts.isError;
  return (
    <section dir="rtl" className="rounded-2xl border bg-card px-5 py-4 sm:px-7">
      <h2 className="!text-xl font-semibold">ביקורים</h2>
      {error && <p role="alert">חלק מנתוני הביקורים לא נטענו.</p>}
      {pending && <p role="status">טוען ביקורים…</p>}
      {!pending && !error && !visits.length && (
        <p className="my-4 text-muted-foreground">עדיין אין ביקורים מתועדים.</p>
      )}
      <ul className="divide-y">
        {!pending &&
          visits.map(({ a, draft, documents, excerpt }) => {
            const latest = documents[0];
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <Link
                  className="min-w-0 flex-1 rounded-md text-start focus-visible:ring-2"
                  to={'/admin/appointments/' + a.id}
                >
                  <span className="block text-sm text-muted-foreground">
                    {new Date(a.scheduled_at).toLocaleDateString('he-IL')} ·{' '}
                    {latest && draft && latest.revision < draft.revision
                      ? 'תיקון בעריכה'
                      : latest
                        ? 'אושר'
                        : draft
                          ? 'בעריכה'
                          : 'סיכום קודם'}
                  </span>
                  <strong>{a.appointment_types?.name_he || 'ביקור במרפאה'}</strong>
                  {excerpt && (
                    <span className="line-clamp-2 whitespace-pre-line text-sm">{excerpt}</span>
                  )}
                </Link>
                {latest ? (
                  <VisitDocumentButton entry={latest} />
                ) : (
                  <Link aria-label="פתיחת הביקור" to={'/admin/appointments/' + a.id}>
                    <ChevronLeft />
                  </Link>
                )}
              </li>
            );
          })}
      </ul>
    </section>
  );
}
