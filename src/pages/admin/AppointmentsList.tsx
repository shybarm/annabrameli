import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppointments, useAppointmentsRealtime, useAppointmentTypes } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Calendar, Clock, ChevronRight, ChevronLeft, CalendarDays, MapPin } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWeekend, addWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';
import { useClinicContext } from '@/contexts/ClinicContext';
import { useClinic } from '@/hooks/useClinics';

export default function AppointmentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();
  
  // Get current clinic
  const { selectedClinicId } = useClinicContext();
  const { data: currentClinic } = useClinic(selectedClinicId);
  
  // Determine if today is weekend (Friday evening or Saturday in Israel context)
  const isCurrentlyWeekend = isWeekend(today);
  
  // For the week view: show current week, or next week if it's weekend
  const [weekOffset, setWeekOffset] = useState(isCurrentlyWeekend ? 1 : 0);
  const viewDate = addWeeks(today, weekOffset);
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Fetch today's appointments
  const { data: todayAppointments, isLoading: todayLoading } = useAppointments(
    format(today, 'yyyy-MM-dd'),
    format(addDays(today, 1), 'yyyy-MM-dd')
  );

  // Fetch week appointments
  const { data: weekAppointments, isLoading: weekLoading } = useAppointments(
    format(weekStart, 'yyyy-MM-dd'),
    format(addDays(weekEnd, 1), 'yyyy-MM-dd')
  );

  useAppointmentsRealtime();

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, cancellation_reason }: { id: string; status: string; cancellation_reason?: string }) => {
      const updateData: any = { status };
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = cancellation_reason || null;
      }
      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'סטטוס עודכן' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    waiting_room: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    in_treatment: 'bg-purple-100 text-purple-700 border-purple-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'מתוכנן',
    waiting_room: 'בחדר המתנה',
    in_treatment: 'חדר רופא',
    completed: 'הושלם',
    cancelled: 'בוטל',
  };

  const getTodayAppointments = () => {
    return todayAppointments?.filter(apt => apt.status !== 'cancelled') || [];
  };

  const getAppointmentsForDay = (date: Date) => {
    return weekAppointments?.filter(apt => 
      isSameDay(new Date(apt.scheduled_at), date) && apt.status !== 'cancelled'
    ) || [];
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => prev + (direction === 'next' ? 1 : -1));
  };

  const handleStatusChange = (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newStatus === 'cancelled') {
      setCancellingAppointmentId(id);
      setCancellationReason('');
      setCancelDialogOpen(true);
    } else {
      updateStatus.mutate({ id, status: newStatus });
    }
  };

  const handleConfirmCancel = () => {
    if (cancellingAppointmentId) {
      updateStatus.mutate({ 
        id: cancellingAppointmentId, 
        status: 'cancelled',
        cancellation_reason: cancellationReason 
      });
      setCancelDialogOpen(false);
      setCancellingAppointmentId(null);
      setCancellationReason('');
    }
  };

  const isThisWeek = weekOffset === 0;
  const isNextWeek = weekOffset === 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">תורים</h1>
            <p className="text-muted-foreground">ניהול ומעקב אחר תורים</p>
          </div>
          <div className="flex gap-2">
            <PageHelpButton tutorial={pageTutorials['/admin/appointments']} />
            <Button 
              data-tutorial="new-appointment-btn"
              onClick={() => navigate('/admin/appointments/new')} 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 ml-2" />
              תור חדש
            </Button>
          </div>
        </div>

        {/* Today's Appointments - FIRST */}
        <Card data-tutorial="appointments-list" className="border-2 border-medical-200 bg-medical-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-600" />
              תורים להיום - {format(today, 'EEEE, d בMMMM', { locale: he })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600" />
              </div>
            ) : getTodayAppointments().length > 0 ? (
              <div className="space-y-3">
                {getTodayAppointments()
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                  .map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-medical-100 text-medical-700">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {apt.patients?.first_name} {apt.patients?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.appointment_types?.name_he || 'ייעוץ'} | {apt.duration_minutes} דקות
                        </p>
                        {apt.patients?.phone && (
                          <p className="text-sm text-muted-foreground" dir="ltr">
                            {apt.patients.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xl font-bold text-medical-700">
                        {format(new Date(apt.scheduled_at), 'HH:mm')}
                      </p>
                      <Badge className={statusColors[apt.status]} data-tutorial="appointment-status">
                        {statusLabels[apt.status]}
                      </Badge>
                      
                      {/* Status dropdown */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={apt.status}
                          onValueChange={(newStatus) => handleStatusChange(apt.id, newStatus, { stopPropagation: () => {} } as React.MouseEvent)}
                        >
                          <SelectTrigger className={`w-32 h-8 text-xs ${statusColors[apt.status] || 'bg-gray-100'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">מתוכנן</SelectItem>
                            <SelectItem value="waiting_room">בחדר המתנה</SelectItem>
                            <SelectItem value="in_treatment">חדר רופא</SelectItem>
                            <SelectItem value="completed">הושלם</SelectItem>
                            <SelectItem value="cancelled">בוטל</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">אין תורים מתוכננים להיום</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/admin/appointments/new')}
                >
                  קבע תור חדש
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Week View - SECOND */}
        <Card data-tutorial="calendar-view">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  {isThisWeek ? 'השבוע' : isNextWeek ? 'שבוע הבא' : format(weekStart, 'd בMMMM', { locale: he })} 
                  {' - '}
                  {format(weekStart, 'd', { locale: he })} עד {format(weekEnd, 'd בMMMM yyyy', { locale: he })}
                </CardTitle>
                {currentClinic && (
                  <p className="text-sm font-medium text-primary mt-1 flex items-center justify-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {currentClinic.name}
                  </p>
                )}
                {isCurrentlyWeekend && isNextWeek && (
                  <p className="text-xs text-muted-foreground mt-1">מוצג שבוע הבא (היום סוף שבוע)</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {weekLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="grid grid-cols-7 gap-2 min-w-[600px] sm:min-w-0">
                  {weekDays.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isToday = isSameDay(day, today);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[120px] p-2 rounded-lg border ${
                          isToday ? 'border-medical-500 bg-medical-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="text-center mb-2">
                          <p className="text-xs text-muted-foreground">
                            {format(day, 'EEEE', { locale: he })}
                          </p>
                          <p className={`text-lg font-semibold ${isToday ? 'text-medical-700' : ''}`}>
                            {format(day, 'd')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((apt) => (
                            <div
                              key={apt.id}
                              className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 ${statusColors[apt.status]}`}
                              onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                            >
                              <p className="font-medium truncate">
                                {apt.patients?.first_name} {apt.patients?.last_name}
                              </p>
                              <p>{format(new Date(apt.scheduled_at), 'HH:mm')}</p>
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <p className="text-xs text-center text-muted-foreground">
                              +{dayAppointments.length - 3} נוספים
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancellation Reason Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>סיבת ביטול התור</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label htmlFor="cancellation-reason">
                למה התור בוטל? (המידע יעזור לנו לשפר את השירות)
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder="לדוגמה: המטופל ביקש לדחות, בעיית לו&quot;ז, מחלה..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                חזור
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                בטל תור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
