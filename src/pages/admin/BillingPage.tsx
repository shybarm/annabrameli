import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvoices, useInvoiceStats, useUpdateInvoiceStatus } from '@/hooks/useInvoices';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function BillingPage() {
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
  const { data: stats } = useInvoiceStats();
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">חיוב וחשבוניות</h1>
            <p className="text-muted-foreground">ניהול חשבוניות ותשלומים</p>
          </div>
          <Button onClick={() => navigate('/admin/billing/new')} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 ml-2" />
            חשבונית חדשה
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">סה״כ</CardTitle>
              <Receipt className="h-4 w-4 text-medical-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₪{(stats?.total || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats?.count || 0} חשבוניות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">שולם</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">₪{(stats?.paid || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats?.paidCount || 0} חשבוניות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ממתינות</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">₪{(stats?.pending || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats?.pendingCount || 0} חשבוניות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">באיחור</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">₪{(stats?.overdue || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>חשבוניות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600" />
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-right border-b">
                      <th className="pb-3 font-medium">מספר</th>
                      <th className="pb-3 font-medium">מטופל</th>
                      <th className="pb-3 font-medium">סכום</th>
                      <th className="pb-3 font-medium">סטטוס</th>
                      <th className="pb-3 font-medium">תאריך</th>
                      <th className="pb-3 font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => (
                      <tr 
                        key={invoice.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/admin/billing/${invoice.id}`)}
                      >
                        <td className="py-3 font-mono text-sm">{invoice.invoice_number}</td>
                        <td className="py-3">
                          {invoice.patients 
                            ? `${invoice.patients.first_name} ${invoice.patients.last_name}`
                            : '-'
                          }
                        </td>
                        <td className="py-3 font-semibold">₪{Number(invoice.total).toLocaleString()}</td>
                        <td className="py-3">
                          <Badge className={statusColors[invoice.status]}>
                            {statusLabels[invoice.status]}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {format(new Date(invoice.created_at), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus.mutate({ 
                                    id: invoice.id, 
                                    status: 'paid',
                                    amount_paid: Number(invoice.total)
                                  });
                                }}
                              >
                                סמן כשולם
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">אין חשבוניות במערכת</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/admin/billing/new')}
                >
                  צור חשבונית ראשונה
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
