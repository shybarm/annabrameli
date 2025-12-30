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
import { Plus, Calendar, Clock, ChevronRight, ChevronLeft, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const { data: currentClinic } = useClinic(selectedClinicId ?? undefined);
  
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
  const [selectedReasonType, setSelectedReasonType] = useState<string>('');
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);

  const CANCELLATION_REASONS = [
    { value: 'patient_no_show', label: 'המטופל לא הגיע' },
    { value: 'patient_cancelled', label: 'ביטול ע״י מטופל' },
    { value: 'clinic_cancelled', label: 'ביטול ע״י מרפאה' },
    { value: 'scheduling_error', label: 'טעות בקביעת תור' },
    { value: 'other', label: 'אחר' },
  ];

  // Fetch today's appointments for current clinic
  const { data: todayAppointments, isLoading: todayLoading } = useAppointments(
    format(today, 'yyyy-MM-dd'),
    format(addDays(today, 1), 'yyyy-MM-dd'),
    selectedClinicId
  );

  // Fetch week appointments for current clinic
  const { data: weekAppointments, isLoading: weekLoading } = useAppointments(
    format(weekStart, 'yyyy-MM-dd'),
    format(addDays(weekEnd, 1), 'yyyy-MM-dd'),
    selectedClinicId
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
      setSelectedReasonType('');
      setCancelDialogOpen(true);
    } else {
      updateStatus.mutate({ id, status: newStatus });
    }
  };

  const handleConfirmCancel = () => {
    if (cancellingAppointmentId && selectedReasonType) {
      const reasonLabel = CANCELLATION_REASONS.find(r => r.value === selectedReasonType)?.label || '';
      const fullReason = selectedReasonType === 'other' 
        ? cancellationReason.trim() || reasonLabel
        : cancellationReason.trim() 
          ? `${reasonLabel}: ${cancellationReason.trim()}`
          : reasonLabel;
      
      updateStatus.mutate({ 
        id: cancellingAppointmentId, 
        status: 'cancelled',
        cancellation_reason: fullReason
      });
      setCancelDialogOpen(false);
      setCancellingAppointmentId(null);
      setCancellationReason('');
      setSelectedReasonType('');
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
                  .map((apt) => {
                    const isNewPatient = apt.patients?.intake_completed_at && !apt.patients?.reviewed_at;
                    return (
                  <div
                    key={apt.id}
                    className={cn(
                      "p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer",
                      isNewPatient ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400" : "bg-white"
                    )}
                    onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                  >
                    {/* Mobile-friendly stacked layout */}
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex-shrink-0",
                        isNewPatient ? "bg-amber-200 text-amber-700" : "bg-medical-100 text-medical-700"
                      )}>
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-base sm:text-lg">
                            {apt.patients?.first_name} {apt.patients?.last_name}
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-medical-700">
                            {format(new Date(apt.scheduled_at), 'HH:mm')}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {isNewPatient && (
                            <Badge className="bg-amber-500 text-white text-xs animate-pulse">
                              <Sparkles className="h-3 w-3 ml-1" />
                              מטופל חדש
                            </Badge>
                          )}
                          <Badge className={statusColors[apt.status]} data-tutorial="appointment-status">
                            {statusLabels[apt.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {apt.appointment_types?.name_he || 'ייעוץ'} | {apt.duration_minutes} דקות
                        </p>
                        {apt.patients?.phone && (
                          <p className="text-sm text-muted-foreground" dir="ltr">
                            {apt.patients.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Status dropdown - full width on mobile */}
                    <div onClick={(e) => e.stopPropagation()} className="mt-3 pt-3 border-t">
                      <Select
                        value={apt.status}
                        onValueChange={(newStatus) => handleStatusChange(apt.id, newStatus, { stopPropagation: () => {} } as React.MouseEvent)}
                      >
                        <SelectTrigger className={`w-full sm:w-40 min-h-[44px] text-sm ${statusColors[apt.status] || 'bg-gray-100'}`}>
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
                    );
                  })}
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
              <>
                {/* Mobile: Horizontal scroll list of days */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden snap-x snap-mandatory">
                  {weekDays.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isToday = isSameDay(day, today);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "min-w-[140px] flex-shrink-0 p-3 rounded-lg border snap-start",
                          isToday ? 'border-medical-500 bg-medical-50' : 'border-gray-200'
                        )}
                      >
                        <div className="text-center mb-2">
                          <p className="text-xs text-muted-foreground">
                            {format(day, 'EEEE', { locale: he })}
                          </p>
                          <p className={cn("text-lg font-semibold", isToday && "text-medical-700")}>
                            {format(day, 'd')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt) => {
                            const isNewPatient = apt.patients?.intake_completed_at && !apt.patients?.reviewed_at;
                            return (
                            <div
                              key={apt.id}
                              className={cn(
                                "text-xs p-1.5 rounded cursor-pointer hover:opacity-80",
                                isNewPatient ? "bg-amber-200 text-amber-800" : statusColors[apt.status]
                              )}
                              onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                            >
                              <p className="font-medium truncate">
                                {apt.patients?.first_name}
                              </p>
                              <p>{format(new Date(apt.scheduled_at), 'HH:mm')}</p>
                            </div>
                            );
                          })}
                          {dayAppointments.length > 2 && (
                            <button
                              className="text-xs text-center text-primary hover:underline w-full py-1"
                              onClick={() => setDayViewDate(day)}
                            >
                              +{dayAppointments.length - 2} נוספים
                            </button>
                          )}
                          {dayAppointments.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-2">-</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Desktop: Grid layout */}
                <div className="hidden sm:grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const dayAppointments = getAppointmentsForDay(day);
                    const isToday = isSameDay(day, today);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "min-h-[120px] p-2 rounded-lg border",
                          isToday ? 'border-medical-500 bg-medical-50' : 'border-gray-200'
                        )}
                      >
                        <div className="text-center mb-2">
                          <p className="text-xs text-muted-foreground">
                            {format(day, 'EEEE', { locale: he })}
                          </p>
                          <p className={cn("text-lg font-semibold", isToday && "text-medical-700")}>
                            {format(day, 'd')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((apt) => {
                            const isNewPatient = apt.patients?.intake_completed_at && !apt.patients?.reviewed_at;
                            return (
                            <div
                              key={apt.id}
                              className={cn(
                                "text-xs p-1.5 rounded cursor-pointer hover:opacity-80",
                                isNewPatient ? "bg-amber-200 text-amber-800 ring-1 ring-amber-400" : statusColors[apt.status]
                              )}
                              onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                            >
                              <div className="flex items-center gap-1">
                                {isNewPatient && <Sparkles className="h-3 w-3" />}
                                <p className="font-medium truncate">
                                  {apt.patients?.first_name} {apt.patients?.last_name}
                                </p>
                              </div>
                              <p>{format(new Date(apt.scheduled_at), 'HH:mm')}</p>
                            </div>
                            );
                          })}
                          {dayAppointments.length > 3 && (
                            <button
                              className="text-xs text-center text-primary hover:underline w-full py-1"
                              onClick={() => setDayViewDate(day)}
                            >
                              +{dayAppointments.length - 3} נוספים
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
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
              <div className="space-y-2">
                <Label>בחר סיבת ביטול</Label>
                <Select value={selectedReasonType} onValueChange={setSelectedReasonType}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="בחר סיבה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedReasonType && (
                <div className="space-y-2">
                  <Label htmlFor="cancellation-reason">
                    {selectedReasonType === 'other' ? 'תאר את הסיבה' : 'פרטים נוספים (אופציונלי)'}
                  </Label>
                  <Textarea
                    id="cancellation-reason"
                    placeholder={selectedReasonType === 'other' ? 'הזן סיבה...' : 'הוסף פרטים...'}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                חזור
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmCancel}
                disabled={!selectedReasonType || (selectedReasonType === 'other' && !cancellationReason.trim())}
              >
                בטל תור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Day View Dialog */}
        <Dialog open={!!dayViewDate} onOpenChange={(open) => !open && setDayViewDate(null)}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {dayViewDate && format(dayViewDate, 'EEEE, d בMMMM yyyy', { locale: he })}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {dayViewDate && getAppointmentsForDay(dayViewDate)
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                .map((apt) => {
                  const isNewPatient = apt.patients?.intake_completed_at && !apt.patients?.reviewed_at;
                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                        isNewPatient ? "bg-amber-50 border-amber-300" : "bg-white"
                      )}
                      onClick={() => {
                        setDayViewDate(null);
                        navigate(`/admin/appointments/${apt.id}`);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-medical-700">
                            {format(new Date(apt.scheduled_at), 'HH:mm')}
                          </span>
                          <span className="font-medium">
                            {apt.patients?.first_name} {apt.patients?.last_name}
                          </span>
                          {isNewPatient && (
                            <Badge className="bg-amber-500 text-white text-xs">
                              <Sparkles className="h-3 w-3 ml-1" />
                              חדש
                            </Badge>
                          )}
                        </div>
                        <Badge className={statusColors[apt.status]}>
                          {statusLabels[apt.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {apt.appointment_types?.name_he || 'ייעוץ'} | {apt.duration_minutes} דקות
                      </p>
                    </div>
                  );
                })}
              {dayViewDate && getAppointmentsForDay(dayViewDate).length === 0 && (
                <p className="text-center text-muted-foreground py-8">אין תורים ביום זה</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDayViewDate(null)}>
                סגור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
