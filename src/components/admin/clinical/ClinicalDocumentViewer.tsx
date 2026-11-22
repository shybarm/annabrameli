import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Printer, Send, Loader2, FileText } from 'lucide-react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  clinicalDocumentHtml,
  loadApprovedRendering,
  renderApprovedPdf,
  type DocumentKind,
} from './clinicalDocument';
import type { ClinicalDocument } from './clinicalApi';
import './visitWorkspace.css';

type Action = 'print' | 'download' | 'send';
type Props = {
  doc: ClinicalDocument;
  onClose: () => void;
  onSend: (kind: DocumentKind, blob: Blob) => Promise<void>;
  canSend: boolean;
  sending: boolean;
  deliveryState: (kind: DocumentKind) => string | undefined;
};

export function ClinicalDocumentViewer({
  doc,
  onClose,
  onSend,
  canSend,
  sending,
  deliveryState,
}: Props) {
  const [kind, setKind] = useState<DocumentKind>('summary');
  const [approved, setApproved] = useState<ClinicalDocument>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [working, setWorking] = useState<Action | null>(null);
  const [printUrl, setPrintUrl] = useState('');
  const printer = useRef<HTMLIFrameElement>(null);
  const pendingPrint = useRef(false);
  const printTimer = useRef<number>();
  const lock = useRef(false);
  const alive = useRef(false);
  const files = useRef(new Map<DocumentKind, { blob: Blob; url: string }>());
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(printTimer.current);
      for (const file of files.current.values()) URL.revokeObjectURL(file.url);
      files.current.clear();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setLoadFailed(false);
    loadApprovedRendering(doc)
      .then((d) => {
        if (!cancelled) setApproved(d);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [doc, attempt]);
  const html = useMemo(
    () => (approved ? clinicalDocumentHtml(approved, kind, true) : ''),
    [approved, kind],
  );
  const status = deliveryState(kind);
  const busy = !!working || sending;
  const print = () => {
    try {
      const target = printer.current?.contentWindow;
      if (!target) throw Error();
      target.focus();
      target.print();
    } catch {
      toast.error('ההדפסה לא נפתחה. אפשר להוריד את הקובץ ולהדפיס ממנו.');
    }
  };
  const act = async (action: Action) => {
    if (!approved || lock.current || sending) return;
    lock.current = true;
    setWorking(action);
    try {
      let file = files.current.get(kind);
      if (!file) {
        const blob = await renderApprovedPdf(approved, kind);
        if (!alive.current) return;
        file = { blob, url: URL.createObjectURL(blob) };
        files.current.set(kind, file);
      }
      if (action === 'send') await onSend(kind, file.blob);
      if (action === 'download') {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = kind === 'summary' ? 'visit-summary.pdf' : 'prescription.pdf';
        link.click();
      }
      if (action === 'print') {
        if (printUrl === file.url) print();
        else {
          pendingPrint.current = true;
          printTimer.current = window.setTimeout(() => {
            if (!pendingPrint.current) return;
            pendingPrint.current = false;
            lock.current = false;
            setPrintUrl('');
            setWorking(null);
            toast.error('ההדפסה לא נפתחה. אפשר להוריד את הקובץ ולהדפיס ממנו.');
          }, 15000);
          setPrintUrl(file.url);
        }
      }
    } catch {
      toast.error('הכנת הקובץ נכשלה. אפשר לנסות שוב.');
    } finally {
      if (!pendingPrint.current) {
        lock.current = false;
        if (alive.current) setWorking(null);
      }
    }
  };
  const statusText =
    status === 'accepted'
      ? 'התקבל לשליחה בוואטסאפ'
      : status === 'delivered'
        ? 'נמסר בוואטסאפ'
        : status === 'processing'
          ? 'ממתין לאישור השליחה'
          : status
            ? 'יש לבדוק את מצב השליחה בוואטסאפ'
            : '';
  return (
    <Tabs
      dir="rtl"
      className="flex min-h-0 flex-1 flex-col"
      value={kind}
      onValueChange={(v) => setKind(v as DocumentKind)}
    >
      <header className="doc-heading">
        <span className="doc-heading-icon" aria-hidden="true">
          <FileText size={21} />
        </span>
        <div>
          <DialogTitle className="!text-xl">מסמכי הביקור</DialogTitle>
          <DialogDescription>
            {doc.snapshot.patient.name} ·{' '}
            {new Date(doc.snapshot.visit_date).toLocaleDateString('he-IL', {
              timeZone: 'Asia/Jerusalem',
            })}
          </DialogDescription>
        </div>
      </header>
      <div className="doc-tools">
        {doc.snapshot.content.medications?.trim() ? (
          <TabsList aria-label="סוג המסמך">
            <TabsTrigger disabled={busy} value="summary">
              סיכום ביקור
            </TabsTrigger>
            <TabsTrigger disabled={busy} value="prescription">
              מרשם
            </TabsTrigger>
          </TabsList>
        ) : (
          <strong className="text-sm">סיכום ביקור</strong>
        )}
        <div className="doc-commands">
          {canSend && (
            <Button size="sm" disabled={!approved || busy || !!status} onClick={() => act('send')}>
              {working === 'send' ? <Loader2 className="animate-spin" /> : <Send />}שלח בוואטסאפ
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={!approved || busy} onClick={() => act('print')}>
            {working === 'print' ? <Loader2 className="animate-spin" /> : <Printer />}הדפס
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!approved || busy}
            onClick={() => act('download')}
          >
            {working === 'download' ? <Loader2 className="animate-spin" /> : <Download />}הורד PDF
          </Button>
        </div>
      </div>
      {statusText && (
        <p className="border-b px-5 py-2 text-sm" role="status">
          {statusText}
        </p>
      )}
      <TabsContent
        value={kind}
        aria-label={kind === 'summary' ? 'סיכום ביקור' : 'מרשם'}
        className="m-0 flex min-h-0 flex-1 flex-col"
      >
        {html ? (
          <iframe
            title="תצוגת המסמך"
            className="min-h-0 w-full flex-1 border-0"
            sandbox="allow-same-origin"
            srcDoc={html}
            onLoad={(e) => {
              e.currentTarget.contentDocument?.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && !lock.current) onClose();
              });
            }}
          />
        ) : (
          <div className="grid flex-1 place-content-center text-center" role="status">
            {loadFailed ? (
              <>
                <p>לא ניתן לטעון את המסמך.</p>
                <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
                  נסה שוב
                </Button>
              </>
            ) : (
              <p>טוען מסמך…</p>
            )}
          </div>
        )}
      </TabsContent>
      {printUrl && (
        <iframe
          ref={printer}
          title="קובץ להדפסה"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0"
          src={printUrl}
          onLoad={() => {
            if (!pendingPrint.current) return;
            window.clearTimeout(printTimer.current);
            pendingPrint.current = false;
            try {
              print();
            } finally {
              lock.current = false;
              setWorking(null);
            }
          }}
        />
      )}
    </Tabs>
  );
}
