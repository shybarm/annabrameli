import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Search, Shield, User, FileText, RefreshCw, Eye, Trash2, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DiaryEntry {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string | null;
  notes: string | null;
  visit_summary: string | null;
  treatment_plan: string | null;
  medications: string | null;
  is_deleted: boolean | null;
  deleted_at: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    id_number: string | null;
  };
  appointment_type: {
    name_he: string;
    price: number | null;
  } | null;
  invoices: {
    id: string;
    status: string | null;
    total: number;
  }[];
}

function useDiaryEntries(searchQuery: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['doctor-diary', searchQuery, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          notes,
          visit_summary,
          treatment_plan,
          medications,
          is_deleted,
          deleted_at,
          patient:patients!inner(id, first_name, last_name, id_number),
          appointment_type:appointment_types(name_he, price),
          invoices(id, status, total)
        `)
        .eq('is_deleted', false)
        .order('scheduled_at', { ascending: false });

      if (startDate) {
        query = query.gte('scheduled_at', startDate);
      }
      if (endDate) {
        query = query.lte('scheduled_at', endDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search query on client side
      let filtered = data as DiaryEntry[];
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(entry => 
          entry.patient.first_name.toLowerCase().includes(lowerQuery) ||
          entry.patient.last_name.toLowerCase().includes(lowerQuery) ||
          entry.patient.id_number?.includes(searchQuery)
        );
      }

      return filtered;
    }
  });
}

function useSoftDeleteAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id
        })
        .eq('id', appointmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-diary'] });
      toast.success('הרשומה נמחקה בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה במחיקת הרשומה');
    }
  });
}

function getPaymentStatus(invoices: DiaryEntry['invoices']): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (!invoices || invoices.length === 0) {
    return { label: 'ללא חשבונית', variant: 'outline' };
  }
  
  const invoice = invoices[0];
  switch (invoice.status) {
    case 'paid':
      return { label: 'שולם', variant: 'default' };
    case 'pending':
    case 'sent':
      return { label: 'ממתין', variant: 'secondary' };
    case 'overdue':
      return { label: 'באיחור', variant: 'destructive' };
    default:
      return { label: 'טיוטה', variant: 'outline' };
  }
}

function getStatusBadge(status: string | null): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case 'completed':
      return { label: 'הושלם', variant: 'default' };
    case 'scheduled':
      return { label: 'מתוכנן', variant: 'secondary' };
    case 'cancelled':
      return { label: 'בוטל', variant: 'destructive' };
    case 'no_show':
      return { label: 'לא הגיע', variant: 'destructive' };
    default:
      return { label: status || 'לא ידוע', variant: 'outline' };
  }
}

export default function DoctorDiaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { data: entries, isLoading, refetch } = useDiaryEntries(searchQuery, startDate, endDate);
  const softDelete = useSoftDeleteAppointment();

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const exportToCSV = () => {
    if (!entries || entries.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    const headers = ['תאריך', 'שעה', 'שם מטופל', 'ת.ז', 'סוג טיפול', 'סטטוס', 'סטטוס תשלום', 'סכום'];
    const rows = entries.map(entry => {
      const paymentStatus = getPaymentStatus(entry.invoices);
      const appointmentStatus = getStatusBadge(entry.status);
      const amount = entry.invoices?.[0]?.total || entry.appointment_type?.price || 0;
      
      return [
        format(new Date(entry.scheduled_at), 'dd/MM/yyyy'),
        format(new Date(entry.scheduled_at), 'HH:mm'),
        `${entry.patient.first_name} ${entry.patient.last_name}`,
        entry.patient.id_number || '',
        entry.appointment_type?.name_he || 'ביקור',
        appointmentStatus.label,
        paymentStatus.label,
        amount.toString()
      ];
    });

    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `יומן_רופא_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('הקובץ יוצא בהצלחה');
  };

  const exportToPDF = () => {
    if (!entries || entries.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>יומן רופא</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
          h1 { text-align: center; color: #2A9D8F; }
          .header { text-align: center; margin-bottom: 20px; }
          .date { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background-color: #2A9D8F; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total { margin-top: 20px; text-align: left; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>יומן רופא</h1>
          <p class="date">תאריך הפקה: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          ${startDate || endDate ? `<p class="date">תקופה: ${startDate || 'התחלה'} - ${endDate || 'סוף'}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>שעה</th>
              <th>מטופל</th>
              <th>ת.ז</th>
              <th>סוג טיפול</th>
              <th>סטטוס</th>
              <th>תשלום</th>
              <th>סכום</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(entry => {
              const paymentStatus = getPaymentStatus(entry.invoices);
              const appointmentStatus = getStatusBadge(entry.status);
              const amount = entry.invoices?.[0]?.total || entry.appointment_type?.price || 0;
              return `
                <tr>
                  <td>${format(new Date(entry.scheduled_at), 'dd/MM/yyyy')}</td>
                  <td>${format(new Date(entry.scheduled_at), 'HH:mm')}</td>
                  <td>${entry.patient.first_name} ${entry.patient.last_name}</td>
                  <td>${entry.patient.id_number || '-'}</td>
                  <td>${entry.appointment_type?.name_he || 'ביקור'}</td>
                  <td>${appointmentStatus.label}</td>
                  <td>${paymentStatus.label}</td>
                  <td>₪${amount.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <p class="total">סה״כ: ₪${entries.reduce((sum, e) => sum + (e.invoices?.[0]?.total || e.appointment_type?.price || 0), 0).toLocaleString()}</p>
        <p class="footer">מסמך זה הופק מיומן הרופא ועומד בתקנות מס הכנסה</p>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success('המסמך נפתח להדפסה');
  };

  return (
    <AdminLayout>
      <PermissionGuard permission="canViewDoctorDiary">
        <div className="space-y-6">
          {/* Compliance Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-primary">יומן רופא - עומד בתקנות מס הכנסה</p>
              <p className="text-sm text-muted-foreground">כל הרשומות נשמרות למשך 7 שנים עם מעקב שינויים מלא</p>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">יומן רופא</h1>
              <p className="text-muted-foreground">רשימת כל הטיפולים והביקורים</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 ml-2" />
                    ייצוא
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="h-4 w-4 ml-2" />
                    ייצוא כ-PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="h-4 w-4 ml-2" />
                    ייצוא כ-CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => navigate('/admin/appointments/new')}>
                רשומה חדשה
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">סינון</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש לפי שם או ת.ז..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="מתאריך"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="עד תאריך"
                  />
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  נקה סינון
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Entries Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך ושעה</TableHead>
                    <TableHead>מטופל</TableHead>
                    <TableHead>סוג טיפול</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תשלום</TableHead>
                    <TableHead>סכום</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : entries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        לא נמצאו רשומות
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries?.map((entry) => {
                      const paymentStatus = getPaymentStatus(entry.invoices);
                      const appointmentStatus = getStatusBadge(entry.status);
                      const amount = entry.invoices?.[0]?.total || entry.appointment_type?.price || 0;
                      
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(entry.scheduled_at), 'dd/MM/yyyy', { locale: he })}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(entry.scheduled_at), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{entry.patient.first_name} {entry.patient.last_name}</p>
                                {entry.patient.id_number && (
                                  <p className="text-sm text-muted-foreground">{entry.patient.id_number}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {entry.appointment_type?.name_he || 'ביקור'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={appointmentStatus.variant}>
                              {appointmentStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentStatus.variant}>
                              {paymentStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">₪{amount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/admin/appointments/${entry.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {entry.invoices?.[0] && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/invoices/${entry.invoices[0].id}`)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>מחיקת רשומה</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      הרשומה תסומן כמחוקה אך תישמר במערכת לצורכי תיעוד ועמידה בתקנות.
                                      פעולה זו מתועדת ביומן הביקורת.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => softDelete.mutate(entry.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      מחק
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Footer Stats */}
          {entries && entries.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>מציג {entries.length} רשומות</span>
              <span>סה״כ: ₪{entries.reduce((sum, e) => sum + (e.invoices?.[0]?.total || e.appointment_type?.price || 0), 0).toLocaleString()}</span>
            </div>
          )}
        </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
