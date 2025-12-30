import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicContext } from '@/contexts/ClinicContext';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { XCircle, Calendar, User, Clock, FileText, TrendingDown } from 'lucide-react';

const CANCELLATION_REASONS_MAP: Record<string, { label: string; color: string }> = {
  'המטופל לא הגיע': { label: 'לא הגיע', color: 'bg-red-100 text-red-700' },
  'ביטול ע״י מטופל': { label: 'מטופל ביטל', color: 'bg-orange-100 text-orange-700' },
  'ביטול ע״י מרפאה': { label: 'מרפאה ביטלה', color: 'bg-blue-100 text-blue-700' },
  'טעות בקביעת תור': { label: 'טעות', color: 'bg-yellow-100 text-yellow-700' },
};

export default function CancellationsReport() {
  const { selectedClinicId } = useClinicContext();
  const [dateFilter, setDateFilter] = useState('this_month');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'this_month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        };
      case 'last_3_months':
        return {
          start: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          start: customStartDate || format(startOfMonth(now), 'yyyy-MM-dd'),
          end: customEndDate || format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch cancelled appointments
  const { data: cancellations, isLoading } = useQuery({
    queryKey: ['cancelled-appointments', selectedClinicId, dateRange.start, dateRange.end],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name, phone),
          appointment_types (name_he)
        `)
        .eq('status', 'cancelled')
        .gte('scheduled_at', `${dateRange.start}T00:00:00`)
        .lte('scheduled_at', `${dateRange.end}T23:59:59`)
        .order('cancelled_at', { ascending: false });

      if (selectedClinicId) {
        query = query.eq('clinic_id', selectedClinicId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Filter by reason
  const filteredCancellations = cancellations?.filter(apt => {
    if (reasonFilter === 'all') return true;
    const reason = apt.cancellation_reason || '';
    return reason.includes(reasonFilter);
  }) || [];

  // Stats
  const stats = {
    total: filteredCancellations.length,
    byPatient: filteredCancellations.filter(a => 
      a.cancellation_reason?.includes('מטופל') || a.cancellation_reason?.includes('לא הגיע')
    ).length,
    byClinic: filteredCancellations.filter(a => 
      a.cancellation_reason?.includes('מרפאה')
    ).length,
  };

  const getReasonBadge = (reason: string | null) => {
    if (!reason) return <Badge variant="secondary">לא צוין</Badge>;
    
    for (const [key, config] of Object.entries(CANCELLATION_REASONS_MAP)) {
      if (reason.includes(key) || reason.startsWith(key)) {
        return <Badge className={config.color}>{config.label}</Badge>;
      }
    }
    return <Badge variant="secondary">אחר</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              דוח ביטולי תורים
            </h1>
            <p className="text-muted-foreground">מעקב אחר תורים שבוטלו וסיבות הביטול</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.total}</p>
                  <p className="text-sm text-red-600">סה״כ ביטולים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700">{stats.byPatient}</p>
                  <p className="text-sm text-orange-600">ביטולי מטופלים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.byClinic}</p>
                  <p className="text-sm text-blue-600">ביטולי מרפאה</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1">
                <Label className="text-sm">תקופה</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">החודש</SelectItem>
                    <SelectItem value="last_month">חודש קודם</SelectItem>
                    <SelectItem value="last_3_months">3 חודשים אחרונים</SelectItem>
                    <SelectItem value="custom">טווח מותאם</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter === 'custom' && (
                <>
                  <div className="flex-1 space-y-1">
                    <Label className="text-sm">מתאריך</Label>
                    <Input 
                      type="date" 
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      dir="ltr"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-sm">עד תאריך</Label>
                    <Input 
                      type="date" 
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      dir="ltr"
                      className="min-h-[44px]"
                    />
                  </div>
                </>
              )}

              <div className="flex-1 space-y-1">
                <Label className="text-sm">סיבת ביטול</Label>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="לא הגיע">לא הגיע</SelectItem>
                    <SelectItem value="מטופל">ביטול מטופל</SelectItem>
                    <SelectItem value="מרפאה">ביטול מרפאה</SelectItem>
                    <SelectItem value="טעות">טעות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancellations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              רשימת ביטולים ({filteredCancellations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredCancellations.length > 0 ? (
              <div className="space-y-3">
                {filteredCancellations.map((apt) => (
                  <div 
                    key={apt.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {apt.patients?.first_name} {apt.patients?.last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(apt.scheduled_at), 'dd/MM/yyyy', { locale: he })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(apt.scheduled_at), 'HH:mm')}
                            </span>
                            {apt.appointment_types?.name_he && (
                              <span>• {apt.appointment_types.name_he}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        {getReasonBadge(apt.cancellation_reason)}
                        {apt.cancelled_at && (
                          <p className="text-xs text-muted-foreground">
                            בוטל ב: {format(new Date(apt.cancelled_at), 'dd/MM HH:mm', { locale: he })}
                          </p>
                        )}
                      </div>
                    </div>
                    {apt.cancellation_reason && !Object.keys(CANCELLATION_REASONS_MAP).some(k => apt.cancellation_reason === k) && (
                      <p className="text-sm text-muted-foreground mt-2 pr-13">
                        {apt.cancellation_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">אין ביטולים בתקופה הנבחרת</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
