import './visitWorkspace.css';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ClinicalTemplates } from './ClinicalTemplates';
import { useVisitDocuments, VisitDocumentButton } from './ClinicalDocuments';
import { clinicalDb as db, type ClinicalDocument } from './clinicalApi';
import {
  readVisit,
  visitFields,
  appendTemplate,
  type VisitField,
  type VisitContent,
} from './visitModel';

type VisitRow = { revision: number; content: VisitContent; updated_at: string };
type Version = { revision: number; content: VisitContent; saved_at: string };
type Props = {
  appointmentId: string;
  patientName: string;
  patientIdNumber: string;
  legacy: { visit_summary?: string | null; treatment_plan?: string | null; medications?: string | null };
};

function WritingField({
  field,
  label,
  value,
  onChange,
  onSelectText,
}: {
  field: VisitField;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelectText: (field: VisitField, text: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const resize = () => {
      const el = ref.current;
      if (el && el.clientWidth) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 2 + 'px';
      }
    };
    resize();
    let width = 0;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0].contentRect.width;
      if (next !== width) {
        width = next;
        resize();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);
  return (
    <label className="block border-b border-border/60 px-5 py-3 last:border-0 focus-within:bg-muted/20 sm:px-8">
      <span className="block text-sm font-semibold">{label}</span>
      <textarea
        ref={ref}
        id={'clinical-' + field}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={(e) => {
          const el = e.currentTarget;
          onSelectText(field, el.value.slice(el.selectionStart, el.selectionEnd));
        }}
        className="mt-1 block min-h-12 w-full resize-none rounded-md bg-transparent px-1 py-1 text-base leading-7 text-start outline-none focus-visible:ring-1 focus-visible:ring-primary"
      />
    </label>
  );
}

export function ClinicalVisitWorkspace({ appointmentId, legacy, patientName, patientIdNumber }: Props) {
  const cache = useQueryClient();
  const { user, isDoctor, isAdmin } = useAuth();
  const writable = isDoctor || isAdmin;
  const inFlight = useRef(false);
  const [draft, setDraft] = useState<VisitContent | null>(null);
  const [base, setBase] = useState<VisitContent | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState<'save' | 'approve' | null>(null);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [remote, setRemote] = useState<VisitRow | null>(null);
  const [choices, setChoices] = useState<Partial<Record<VisitField, 'local' | 'remote'>>>({});
  const [editingCorrection, setEditingCorrection] = useState(false);
  const [history, setHistory] = useState(false);
  const [includeMedication, setIncludeMedication] = useState(false);
  const [historyVersion, setHistoryVersion] = useState<number | null>(null);
  const [templates, setTemplates] = useState(false);
  const templateTrigger = useRef<HTMLElement | null>(null);
  const [seed, setSeed] = useState<{ field: VisitField; body: string } | null>(null);
  const [selection, setSelection] = useState<{ field: VisitField; body: string } | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const visitKey = ['clinical-visit', user?.id, appointmentId];
  const fetchVisit = async () => {
    const r = await db
      .from('clinical_visits')
      .select('revision,content,updated_at')
      .eq('appointment_id', appointmentId)
      .maybeSingle();
    if (r.error) throw r.error;
    return r.data as VisitRow | null;
  };
  const query = useQuery({
    queryKey: visitKey,
    queryFn: fetchVisit,
    refetchOnWindowFocus: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const docs = useVisitDocuments({ appointmentId });
  const latest = docs.data?.[0];
  const ready = useQuery({
    queryKey: ['clinical-signing-ready', user?.id],
    queryFn: async () => {
      const r = await db.rpc('clinical_signing_ready');
      if (r.error) throw r.error;
      return r.data === true;
    },
  });
  const versions = useQuery({
    queryKey: ['clinical-versions', user?.id, appointmentId],
    enabled: history,
    queryFn: async () => {
      const r = await db
        .from('clinical_visit_versions')
        .select('revision,content,saved_at')
        .eq('appointment_id', appointmentId)
        .order('revision', { ascending: false });
      if (r.error) throw r.error;
      return r.data as Version[];
    },
  });
  useEffect(() => {
    if (!query.isSuccess || draft !== null || query.isFetching) return;
    const initial = readVisit(
      query.data?.content ?? {
        assessment: legacy.visit_summary,
        plan: legacy.treatment_plan,
        medications: legacy.medications,
      },
    );
    setDraft(initial);
    setBase(initial);
    setRevision(query.data?.revision ?? 0);
  }, [query.isSuccess, query.isFetching, query.data, draft, legacy]);
  const dirty = !!draft && visitFields.some(([k]) => draft[k] !== base?.[k]);
  const signed = !!latest && latest.revision === revision && !dirty && !editingCorrection;
  const blocker = useBlocker(dirty || !!busy);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (!busy && window.confirm('יש שינויים שטרם נשמרו. לצאת ולוותר עליהם?')) blocker.proceed();
    else blocker.reset();
  }, [blocker, busy]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || busy) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
  useEffect(() => {
    const online = () => {
      setOffline(false);
      if (!conflict) setError('');
    };
    const disconnected = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', disconnected);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', disconnected);
    };
  }, [conflict]);

  const persist = useCallback(
    async (action: 'save' | 'approve') => {
      if (!draft || !writable || inFlight.current || conflict || offline) return;
      if (action === 'approve' && !ready.data) return;
      inFlight.current = true;
      setBusy(action);
      setError('');
      const snapshot = { ...draft };
      try {
        const r = await db.rpc(action === 'save' ? 'save_clinical_visit' : 'finalize_clinical_visit', {
          p_appointment_id: appointmentId,
          p_expected_revision: revision,
          p_content: snapshot,
        });
        if (r.error) throw r.error;
        const saved = r.data as VisitRow | ClinicalDocument;
        setRevision(saved.revision);
        setBase(snapshot);
        cache.setQueryData(['clinical-visit', user?.id, appointmentId], {
          revision: saved.revision,
          content: snapshot,
        });
        if (action === 'approve') {
          const d = saved as ClinicalDocument;
          const entry = {
            id: d.id,
            revision: d.revision,
            signed_at: d.signed_at,
            appointment_id: d.appointment_id,
          };
          cache.setQueryData(
            ['clinical-documents', user?.id, { appointmentId }],
            (old: typeof docs.data) => [entry, ...(old ?? []).filter((x) => x.id !== d.id)],
          );
          setEditingCorrection(false);
          void cache.invalidateQueries({ queryKey: ['clinical-documents'] });
        }
        void cache.invalidateQueries({ queryKey: ['clinical-timeline'] });
        void cache.invalidateQueries({ queryKey: ['clinical-versions', user?.id, appointmentId] });
      } catch (e) {
        const msg = (e as { message?: string }).message ?? '';
        if (msg.includes('CLINICAL_CONFLICT')) {
          setConflict(true);
          setError('הביקור נערך גם בחלון אחר. יש להשוות את השינויים.');
        } else if (msg.includes('CLINICAL_PATIENT_ID_REQUIRED'))
          setError('לאישור הביקור יש להשלים שם ומספר זהות בתיק.');
        else
          setError(
            action === 'approve'
              ? 'אישור הביקור לא הושלם. הטקסט נשאר כאן.'
              : 'השמירה לא הושלמה. הטקסט נשאר כאן.',
          );
      } finally {
        inFlight.current = false;
        setBusy(null);
      }
    },
    [appointmentId, cache, conflict, draft, offline, ready.data, revision, user?.id, writable],
  );
  useEffect(() => {
    if (!dirty || busy || error || offline || conflict) return;
    const timer = window.setTimeout(() => void persist('save'), 1000);
    return () => window.clearTimeout(timer);
  }, [dirty, busy, error, offline, conflict, persist]);

  if (query.isError && !draft)
    return (
      <p role="alert">
        טעינת הביקור נכשלה.{' '}
        <Button variant="outline" onClick={() => query.refetch()}>
          ניסיון נוסף
        </Button>
      </p>
    );
  if (!draft || !base) return <p role="status">טוען ביקור…</p>;
  const locked = signed || !writable || busy === 'approve' || !!remote;
  const status = offline
    ? 'אין חיבור לרשת'
    : busy === 'save'
      ? 'שומר…'
      : busy === 'approve'
        ? 'מאשר…'
        : error
          ? 'נדרשת בדיקה'
          : dirty
            ? 'ממתין לשמירה'
            : signed
              ? 'אושר'
              : revision
                ? 'נשמר'
                : '';
  const server = readVisit(remote?.content);
  const overlapping = visitFields.filter(
    ([k]) => server[k] !== base[k] && draft[k] !== base[k] && draft[k] !== server[k],
  );
  const compare = async () => {
    try {
      const row = await fetchVisit();
      if (!row) throw Error();
      setRemote(row);
      setChoices({});
    } catch {
      setError('טעינת העדכון מהשרת נכשלה. אפשר לנסות שוב.');
    }
  };
  const reconcile = () => {
    if (!remote || overlapping.some(([k]) => !choices[k])) return;
    const merged = { ...server };
    visitFields.forEach(([k]) => {
      if (draft[k] !== base[k] && choices[k] !== 'remote') merged[k] = draft[k];
    });
    setDraft(merged);
    setBase(server);
    setRevision(remote.revision);
    setRemote(null);
    setError('');
    setConflict(false);
  };
  return (
    <section aria-label="כתיבת ביקור" dir="rtl" className="relative mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-8">
          <h2 className="!text-xl font-semibold">{signed ? 'סיכום הביקור' : 'כתיבת ביקור'}</h2>
          {!locked && (
            <div className="flex flex-wrap gap-1">
              {selection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    templateTrigger.current = document.activeElement as HTMLElement;
                    setSeed(selection);
                    setTemplates(true);
                  }}
                >
                  שמור בחירה כתבנית
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  templateTrigger.current = document.activeElement as HTMLElement;
                  setSeed(null);
                  setTemplates(true);
                }}
              >
                <BookOpen className="me-2 size-4" />
                תבניות
              </Button>
            </div>
          )}
        </header>
        {locked && !remote && busy !== 'approve' ? (
          <div className="divide-y px-5 sm:px-8">
            {visitFields
              .filter(([k]) => draft[k].trim())
              .map(([k, label]) => (
                <section key={k} className="py-3">
                  <h3 className="!text-sm font-semibold">{label}</h3>
                  <p className="whitespace-pre-wrap break-words leading-7">{draft[k]}</p>
                </section>
              ))}
          </div>
        ) : (
          <fieldset disabled={locked}>
            {visitFields
              .filter(([k]) => k !== 'medications' || includeMedication || draft.medications)
              .map(([k, label]) => (
                <WritingField
                  key={k}
                  field={k}
                  label={label}
                  value={draft[k]}
                  onChange={(v) => setDraft((prev) => prev && { ...prev, [k]: v })}
                  onSelectText={(field, body) => setSelection(body.trim() ? { field, body } : null)}
                />
              ))}
          </fieldset>
        )}
        {!locked && !includeMedication && !draft.medications && (
          <div className="px-5 pb-3 sm:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIncludeMedication(true);
                requestAnimationFrame(() => document.getElementById('clinical-medications')?.focus());
              }}
            >
              הוספת תרופות למרשם
            </Button>
          </div>
        )}
      </div>
      {templates && (
        <ClinicalTemplates
          selection={seed}
          identifiers={[patientName, patientIdNumber]}
          onClose={() => {
            setTemplates(false);
            requestAnimationFrame(() => templateTrigger.current?.focus({ preventScroll: true }));
          }}
          onInsert={(sections) => {
            setDraft((prev) => {
              if (!prev) return prev;
              const next = { ...prev };
              for (const [k] of visitFields)
                if (sections[k]) next[k] = appendTemplate(next[k], sections[k]!);
              return next;
            });
            setTemplates(false);
            setSelection(null);
            const k = Object.keys(sections)[0];
            requestAnimationFrame(() => {
              const el = document.getElementById('clinical-' + k) as HTMLTextAreaElement | null;
              el?.focus();
              if (el) el.setSelectionRange(el.value.length, el.value.length);
            });
          }}
        />
      )}
      {(revision > 0 || latest) && (
        <details className="px-2 py-4 text-sm" onToggle={(e) => setHistory(e.currentTarget.open)}>
          <summary className="w-fit cursor-pointer rounded text-muted-foreground">
            היסטוריית הביקור
          </summary>
          {history && (
            <div className="mt-2 space-y-2 border-s ps-4">
              {docs.data?.slice(1).map((d) => (
                <VisitDocumentButton
                  key={d.id}
                  entry={d}
                  label={'מסמך מאושר · ' + new Date(d.signed_at).toLocaleString('he-IL')}
                />
              ))}
              {versions.isError && <p role="alert">ההיסטוריה לא נטענה.</p>}
              {versions.data?.map((v) => (
                <div key={v.revision}>
                  <button
                    className="py-1 underline"
                    aria-expanded={historyVersion === v.revision}
                    onClick={() => setHistoryVersion(historyVersion === v.revision ? null : v.revision)}
                  >
                    שמירה מ־{new Date(v.saved_at).toLocaleString('he-IL')}
                  </button>
                  {historyVersion === v.revision &&
                    visitFields
                      .filter(([k]) => v.content[k])
                      .map(([k, label]) => (
                        <p key={k} className="whitespace-pre-wrap">
                          <strong>{label} </strong>
                          {v.content[k]}
                        </p>
                      ))}
                </div>
              ))}
            </div>
          )}
        </details>
      )}
      {error && (
        <div role="alert" className="my-3 rounded-xl border border-destructive/40 p-3">
          {error}
          {conflict ? (
            <Button variant="ghost" onClick={compare}>
              השוואה לעדכון
            </Button>
          ) : (
            dirty && (
              <Button variant="ghost" disabled={offline || !!busy} onClick={() => persist('save')}>
                ניסיון שמירה נוסף
              </Button>
            )
          )}
        </div>
      )}
      {remote && (
        <section className="my-3 grid gap-3 rounded-xl border p-4">
          <h3 className="!text-base">יישוב שינויים</h3>
          {overlapping.length === 0 && <p>אפשר לשלב את השינויים משני החלונות.</p>}
          {overlapping.map(([k, label]) => (
            <fieldset key={k}>
              <legend>{label}</legend>
              {(['local', 'remote'] as const).map((side) => (
                <label key={side} className="mt-2 block whitespace-pre-wrap rounded border p-3">
                  <input
                    type="radio"
                    name={'merge-' + k}
                    checked={choices[k] === side}
                    onChange={() => setChoices({ ...choices, [k]: side })}
                  />{' '}
                  {side === 'local' ? 'הנוסח שלי' : 'הנוסח בשרת'}
                  <span className="block">{(side === 'local' ? draft[k] : server[k]) || '(ריק)'}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <Button disabled={overlapping.some(([k]) => !choices[k])} onClick={reconcile}>
            החלת הבחירה והמשך
          </Button>
        </section>
      )}
      <footer className="visit-actions sticky bottom-2 z-20 my-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3 shadow-md">
        <div className="min-w-0">
          <strong className="block truncate text-sm">{patientName}</strong>
          <span className="text-xs text-muted-foreground" role="status">
            {status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {signed && writable && (
            <Button variant="ghost" size="sm" onClick={() => setEditingCorrection(true)}>
              <PenLine className="size-4 me-2" />
              תיקון
            </Button>
          )}
          {latest && (
            <VisitDocumentButton
              entry={latest}
              primary={signed}
              label={signed ? 'הצג מסמך' : 'מסמך מאושר קודם'}
            />
          )}
          {!signed && writable && (
            <Button
              className="visit-primary"
              disabled={
                !!busy ||
                offline ||
                conflict ||
                !ready.data ||
                !docs.isSuccess ||
                !visitFields.some(([k]) => draft[k].trim())
              }
              onClick={() => persist('approve')}
            >
              <Check className="size-4 me-2" />
              אישור וסיום ביקור
            </Button>
          )}
        </div>
      </footer>
      {docs.isError && (
        <p role="alert">
          טעינת המסמכים נכשלה.{' '}
          <button className="underline" onClick={() => docs.refetch()}>
            ניסיון נוסף
          </button>
        </p>
      )}
      {writable && ready.isSuccess && !ready.data && (
        <p className="text-sm">אישור מסמך זמין בחשבון הרופאה.</p>
      )}
      {ready.isError && (
        <p role="alert">
          לא ניתן לבדוק הרשאת אישור. <button onClick={() => ready.refetch()}>ניסיון נוסף</button>
        </p>
      )}
    </section>
  );
}
