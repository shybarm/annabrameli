import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvoice, useUpdateInvoiceStatus } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Printer, Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    partially_paid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    sent: 'נשלחה',
    paid: 'שולמה',
    partially_paid: 'שולמה חלקית',
    overdue: 'באיחור',
    cancelled: 'בוטלה',
  };

  const handleSendReminder = async () => {
    const patientData = invoice?.patients as any;
    if (!patientData?.email) {
      toast({ title: 'אין כתובת אימייל למטופל', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-invoice-reminder', {
        body: {
          invoiceId: invoice.id,
          patientEmail: patientData.email,
          patientName: `${patientData.first_name} ${patientData.last_name}`,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.total,
        },
      });

      if (error) throw error;
      toast({ title: 'התזכורת נשלחה בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה בשליחת התזכורת', description: error.message, variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = () => {
    if (!id) return;
    updateStatus.mutate({ id, status: 'paid', amount_paid: Number(invoice?.total) });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">חשבונית לא נמצאה</p>
          <Button variant="link" onClick={() => navigate('/admin/billing')}>
            חזור לרשימת החשבוניות
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/billing')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                חשבונית #{invoice.invoice_number}
              </h1>
              <Badge className={statusColors[invoice.status]}>
                {statusLabels[invoice.status]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-2" />
              הדפסה
            </Button>
            {invoice.status !== 'paid' && (
              <>
                <Button variant="outline" onClick={handleSendReminder}>
                  <Mail className="h-4 w-4 ml-2" />
                  שלח תזכורת
                </Button>
                <Button onClick={handleMarkAsPaid}>
                  <CheckCircle className="h-4 w-4 ml-2" />
                  סמן כשולם
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">ד״ר אנה ברמלי</h2>
                <p className="text-sm text-muted-foreground">מומחית לאלרגיה ואימונולוגיה</p>
                <p className="text-sm text-muted-foreground">רישיון מס׳: 12345</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">תאריך: {format(new Date(invoice.created_at), 'dd/MM/yyyy')}</p>
                {invoice.due_date && (
                  <p className="text-sm text-muted-foreground">תאריך יעד: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Patient Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">פרטי מטופל</h3>
              {invoice.patients && (
                <div className="text-sm">
                  <p>{(invoice.patients as any).first_name} {(invoice.patients as any).last_name}</p>
                  {(invoice.patients as any).id_number && <p>ת.ז: {(invoice.patients as any).id_number}</p>}
                  {(invoice.patients as any).phone && <p>טלפון: {(invoice.patients as any).phone}</p>}
                  {(invoice.patients as any).email && <p>אימייל: {(invoice.patients as any).email}</p>}
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3">פירוט</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-right">
                    <th className="pb-2 font-medium">תיאור</th>
                    <th className="pb-2 font-medium">כמות</th>
                    <th className="pb-2 font-medium">מחיר יחידה</th>
                    <th className="pb-2 font-medium">סה״כ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(invoice as any).items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">₪{Number(item.unit_price).toLocaleString()}</td>
                      <td className="py-2 font-medium">₪{Number(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>סכום ביניים:</span>
                    <span>₪{Number(invoice.subtotal).toLocaleString()}</span>
                  </div>
                  {invoice.tax_amount && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>מע״מ ({invoice.tax_rate}%):</span>
                      <span>₪{Number(invoice.tax_amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>סה״כ לתשלום:</span>
                    <span>₪{Number(invoice.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">הערות</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
