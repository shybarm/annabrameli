import { AdminLayout } from '@/components/admin/AdminLayout';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInvoices, useInvoiceStats, useUpdateInvoiceStatus } from '@/hooks/useInvoices';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, TrendingUp, Clock, AlertCircle, Eye, CheckCircle, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';
import { MobilePageHeader, MobileStatCard, MobileStatsGrid, MobileListCard, MobileEmptyState } from '@/components/admin/mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BillingPage() {
  return (
    <AdminLayout>
      <PermissionGuard permission="canViewBilling">
        <BillingContent />
      </PermissionGuard>
    </AdminLayout>
  );
}

function BillingContent() {
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <MobilePageHeader
        title="חיוב וחשבוניות"
        subtitle="ניהול חשבוניות ותשלומים"
        actions={
          <>
            <PageHelpButton tutorial={pageTutorials['/admin/billing']} />
            <Button 
              onClick={() => navigate('/admin/billing/new')} 
              size="sm"
              className="sm:size-default bg-primary text-primary-foreground hover:bg-primary/90" 
              data-tutorial="new-invoice-btn"
            >
              <Plus className="h-4 w-4 sm:ml-2" />
              <span className="hidden sm:inline">חשבונית חדשה</span>
            </Button>
          </>
        }
      />

      {/* Stats */}
      <MobileStatsGrid columns={4} data-tutorial="billing-stats">
        <MobileStatCard
          value={`₪${(stats?.total || 0).toLocaleString()}`}
          label={`${stats?.count || 0} חשבוניות`}
          icon={<Receipt className="h-4 w-4 text-primary" />}
        />
        <MobileStatCard
          value={`₪${(stats?.paid || 0).toLocaleString()}`}
          label={`${stats?.paidCount || 0} שולמו`}
          variant="green"
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
        <MobileStatCard
          value={`₪${(stats?.pending || 0).toLocaleString()}`}
          label={`${stats?.pendingCount || 0} ממתינות`}
          variant="orange"
          icon={<Clock className="h-4 w-4 text-orange-600" />}
        />
        <MobileStatCard
          value={`₪${(stats?.overdue || 0).toLocaleString()}`}
          label="באיחור"
          variant="red"
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
        />
      </MobileStatsGrid>

      {/* Invoices List */}
      <Card data-tutorial="invoices-list">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">חשבוניות אחרונות</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <>
              {/* Mobile: Card View */}
              <div className="space-y-2 sm:hidden">
                {invoices.map((invoice) => (
                  <MobileListCard
                    key={invoice.id}
                    title={invoice.patients 
                      ? `${invoice.patients.first_name} ${invoice.patients.last_name}`
                      : 'ללא מטופל'
                    }
                    subtitle={
                      <span className="font-mono text-[11px]">{invoice.invoice_number} • {format(new Date(invoice.created_at), 'dd/MM/yy')}</span>
                    }
                    metric={`₪${Number(invoice.total).toLocaleString()}`}
                    status={
                      <Badge className={statusColors[invoice.status]}>
                        {statusLabels[invoice.status]}
                      </Badge>
                    }
                    onClick={() => navigate(`/admin/billing/${invoice.id}`)}
                    actions={[
                      {
                        label: 'צפה בפרטים',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: () => navigate(`/admin/billing/${invoice.id}`),
                      },
                      ...(invoice.status !== 'paid' && invoice.status !== 'cancelled' ? [{
                        label: 'סמן כשולם',
                        icon: <CheckCircle className="h-4 w-4" />,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          updateStatus.mutate({ 
                            id: invoice.id, 
                            status: 'paid',
                            amount_paid: Number(invoice.total)
                          });
                        },
                      }] : []),
                    ]}
                  />
                ))}
              </div>

              {/* Desktop: Table View */}
              <div className="hidden sm:block overflow-x-auto">
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
            </>
          ) : (
            <MobileEmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="אין חשבוניות במערכת"
              action={{
                label: 'צור חשבונית ראשונה',
                onClick: () => navigate('/admin/billing/new'),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}