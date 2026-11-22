import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { clinicalDb, type ClinicalDocument } from './clinicalApi';
import { type DocumentKind } from './clinicalDocument';
import { ClinicalDocumentViewer } from './ClinicalDocumentViewer';
import { toast } from 'sonner';

export type DocumentEntry = Pick<ClinicalDocument, 'id' | 'appointment_id' | 'revision' | 'signed_at'>;
export function useVisitDocuments(scope: { patientId?: string; appointmentId?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['clinical-documents', user?.id, scope],
    enabled: !!user && !!(scope.appointmentId || scope.patientId),
    queryFn: async () => {
      let query = supabase
        .from('clinical_documents')
        .select('id,appointment_id,revision,signed_at')
        .order('revision', { ascending: false });
      if (scope.patientId) query = query.eq('patient_id', scope.patientId);
      if (scope.appointmentId) query = query.eq('appointment_id', scope.appointmentId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function VisitDocumentButton({
  entry,
  primary = false,
  label = 'הצג מסמך',
  patientView = false,
}: {
  entry: DocumentEntry;
  primary?: boolean;
  label?: string;
  patientView?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        className={primary ? 'visit-primary' : undefined}
        variant={primary ? 'default' : 'outline'}
        size="sm"
        onClick={() => setOpen(true)}
      >
        <FileText className="size-4 me-2" />
        {label}
      </Button>
      {open && <OpenedDocument id={entry.id} patientView={patientView} onClose={() => setOpen(false)} />}
    </>
  );
}

function OpenedDocument({
  id,
  onClose,
  patientView,
}: {
  id: string;
  onClose: () => void;
  patientView: boolean;
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const document = useQuery({
    queryKey: ['clinical-document', user?.id, id],
    queryFn: async () => {
      const r = await clinicalDb.from('clinical_documents').select('*').eq('id', id).maybeSingle();
      if (r.error || !r.data) throw new Error('missing document');
      return r.data as ClinicalDocument;
    },
  });
  const ready = useQuery({
    queryKey: ['clinical-signing-ready', user?.id],
    enabled: !patientView,
    queryFn: async () => {
      const r = await clinicalDb.rpc('clinical_signing_ready');
      if (r.error) throw r.error;
      return r.data === true;
    },
  });
  const deliveries = useQuery({
    queryKey: ['clinical-deliveries', user?.id, id],
    enabled: !patientView && !!ready.data,
    queryFn: async () => {
      const r = await supabase
        .from('clinical_document_deliveries')
        .select('kind,state')
        .eq('document_id', id);
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const send = async (k: DocumentKind, blob: Blob) => {
    const d = document.data;
    if (!d || patientView || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('phone')
        .eq('id', d.patient_id)
        .single();
      if (error) throw error;
      let phone = (patient.phone || '').replace(/\D/g, '');
      if (phone.startsWith('0')) phone = '972' + phone.slice(1);
      if (!/^9725\d{8}$/.test(phone)) throw new Error('יש לעדכן מספר נייד תקין בתיק המטופל');
      if (
        !window.confirm(
          `לשלוח ${k === 'summary' ? 'סיכום ביקור' : 'מרשם'} כקובץ PDF ל${d.snapshot.patient.name}, למספר +${phone}?`,
        )
      )
        return;
      const form = new FormData();
      form.append('document_id', d.id);
      form.append('kind', k);
      form.append('phone', phone);
      form.append('file', blob, k === 'summary' ? 'visit-summary.pdf' : 'prescription.pdf');
      const result = await supabase.functions.invoke('send-clinical-document', { body: form });
      if (result.error) throw new Error('אין אישור לשליחה. יש לבדוק את מצב השליחה.');
      if (result.data?.state === 'accepted') toast.success('המסמך התקבל לשליחה בוואטסאפ');
      else toast.error('יש לבדוק את מצב השליחה בוואטסאפ');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      await cache.invalidateQueries({ queryKey: ['clinical-deliveries', user?.id, id] });
      lock.current = false;
      setBusy(false);
    }
  };
  if (!document.data)
    return (
      <div role="status">
        {document.isError ? 'טעינת המסמך נכשלה' : 'טוען מסמך…'}{' '}
        <Button variant="ghost" size="sm" onClick={onClose}>
          סגור
        </Button>
      </div>
    );
  return (
    <ClinicalDocumentViewer
      doc={document.data}
      onClose={onClose}
      canSend={!patientView && !!ready.data && deliveries.isSuccess}
      sending={busy}
      deliveryState={(k) => deliveries.data?.find((x) => x.kind === k)?.state}
      onSend={send}
    />
  );
}
