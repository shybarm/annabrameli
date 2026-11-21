import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { ExternalLink, Mail } from 'lucide-react';

interface SumitDocument {
  invoice_id: string;
  state: 'pending' | 'issued' | 'rejected' | 'needs_review';
  document_number: string | null;
  download_url: string | null;
  recipient_email: string;
  message: string | null;
}

const accountingClient: SupabaseClient = supabase;

export function SumitDocumentAction({ invoiceId, total, email }: {
  invoiceId: string;
  total: number;
  email: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState('1');
  const queryClient = useQueryClient();
  const { data: document, isLoading, error } = useQuery({
    queryKey: ['sumit-document', invoiceId],
    queryFn: async () => {
      const result = await accountingClient.from('sumit_documents').select('*').eq('invoice_id', invoiceId).maybeSingle();
      if (result.error) throw result.error;
      return result.data as SumitDocument | null;
    },
    refetchInterval: query => query.state.data?.state === 'pending' ? 3000 : false,
  });
  const issue = useMutation({
    mutationFn: async () => {
      const result = await accountingClient.rpc('issue_sumit_document', {
        p_invoice_id: invoiceId,
        p_document_type: Number(documentType),
      });
      if (result.error) throw result.error;
      return result.data as SumitDocument;
    },
    onSuccess: data => {
      queryClient.setQueryData(['sumit-document', invoiceId], data);
      setOpen(false);
      toast({ title: 'בקשת ההפקה התקבלה', description: 'סטטוס המסמך יתעדכן לאחר קבלת תשובה מ-SUMIT' });
    },
    onError: (failure: Error) => toast({ title: 'שגיאה בהפקת המסמך', description: failure.message, variant: 'destructive' }),
  });

  if (document && document.state !== 'rejected') {
    const downloadUrl = document.download_url?.startsWith('https://') ? document.download_url : null;
    return <div className="space-y-2 text-sm" role="status">
      <p>{document.state === 'pending' ? 'SUMIT מטפלת בבקשת ההפקה והשליחה...' : document.message}</p>
      {document.document_number && <p>מסמך SUMIT מספר {document.document_number} | נמען {document.recipient_email}</p>}
      {downloadUrl && <Button variant="outline" size="sm" asChild>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 ml-2" />פתיחת המסמך</a>
      </Button>}
    </div>;
  }

  return <>
    {document?.state === 'rejected' && <p className="text-sm text-destructive">{document.message}</p>}
    <Button size="sm" onClick={() => setOpen(true)} disabled={isLoading || !!error || !email}>
      <Mail className="h-4 w-4 ml-2" />הפקה ושליחה דרך SUMIT
    </Button>
    {error && <p className="text-sm text-destructive">לא ניתן לבדוק את סטטוס המסמך. יש לרענן ולנסות שוב.</p>}
    {!email && <p className="text-sm text-destructive">יש לעדכן מייל בכרטיס המטופל לצורך שליחת המסמך.</p>}
    <Dialog open={open} onOpenChange={value => { if (!issue.isPending) setOpen(value); }}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle>הפקת מסמך ושליחתו למטופל</DialogTitle></DialogHeader>
        <p>סכום התשלום שנרשם {total.toLocaleString('he-IL', { style: 'currency', currency: 'ILS' })}</p>
        <p>המסמך יופק ב-SUMIT ויישלח למייל {email}</p>
        <RadioGroup value={documentType} onValueChange={setDocumentType}>
          <div className="flex items-center gap-2"><RadioGroupItem value="1" id="sumit-invoice-receipt" /><Label htmlFor="sumit-invoice-receipt">חשבונית מס/קבלה</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="2" id="sumit-receipt" /><Label htmlFor="sumit-receipt">קבלה</Label></div>
        </RadioGroup>
        <DialogFooter><Button onClick={() => issue.mutate()} disabled={issue.isPending}>
          {issue.isPending ? 'מגיש בקשה...' : 'הפקה ושליחה למטופל'}
        </Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
