import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppointments, useAppointmentsRealtime } from '@/hooks/useAppointments';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Calendar, Clock, ChevronRight, ChevronLeft, CalendarDays, MapPin, Sparkles, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';
import { useClinicContext } from '@/contexts/ClinicContext';
import { useClinic } from '@/hooks/useClinics';
import { DayAvailabilityGrid } from '@/components/admin/DayAvailabilityGrid';

export default function AppointmentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();
  
  // Get current clinic
  const { selectedClinicId } = useClinicContext();
  const { data: currentClinic } = useClinic(selectedClinicId ?? undefined);
  
  const [weekOffset, setWeekOffset] = useState(0);
  const viewDate = addWeeks(today, weekOffset);
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedReasonType, setSelectedReasonType] = useState<string>('');
  const [selectedWeekday, setSelectedWeekday] = useState(today.getDay());
  const selectedDate = weekDays[selectedWeekday];
  const [viewMode, setViewMode] = useState<'list' | 'availability'>('list');
  const [availabilityDate, setAvailabilityDate] = useState<Date>(today);

  const CANCELLATION_REASONS = [
    { value: 'patient_cancelled', label: 'ביטול ע״י מטופל' },
    { value: 'clinic_cancelled', label: 'ביטול ע״י מרפאה' },
    { value: 'scheduling_error', label: 'טעות בקביעת תור' },
    { value: 'other', label: 'אחר' },
  ];

  // Fetch week appointments for current clinic
  const { data: weekAppointments, isLoading: weekLoading, isError: weekError, refetch: reloadWeek } = useAppointments(
    weekStart.toISOString(),
    weekEnd.toISOString(),
    selectedClinicId
  );

  // Fetch appointments for the selected availability date
  const { data: availabilityDateAppointments } = useAppointments(
    format(availabilityDate, 'yyyy-MM-dd'),
    format(addDays(availabilityDate, 1), 'yyyy-MM-dd'),
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

  const statusLabels: Record<string, string> = {
    scheduled: 'מתוכנן',
    waiting_room: 'בחדר המתנה',
    in_treatment: 'חדר רופא',
    completed: 'הושלם',
    cancelled: 'בוטל',
  };

  const getAppointmentsForDay = (date: Date) => {
    return weekAppointments?.filter(apt => 
      isSameDay(new Date(apt.scheduled_at), date) && apt.status !== 'cancelled'
    ) || [];
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => prev + (direction === 'next' ? 1 : -1));
  };

  const handleStatusChange = (id: string, newStatus: string) => {
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

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">יומן מרפאה</h1>

          </div>
          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'availability')} className="w-auto">
              <TabsList className="grid grid-cols-2 h-10">
                <TabsTrigger value="list" className="gap-1.5 px-3">
                  <List className="h-4 w-4" />
                  <span>יומן שבועי</span>
                </TabsTrigger>
                <TabsTrigger value="availability" className="gap-1.5 px-3">
                  <LayoutGrid className="h-4 w-4" />
                  <span>זמינות</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
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

        {/* Availability View */}
        {viewMode === 'availability' && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setAvailabilityDate(prev => addDays(prev, 1))}
                  aria-label="יום הבא"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    לוח זמינות
                  </CardTitle>
                  {currentClinic && (
                    <p className="text-sm font-medium text-primary mt-1 flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {currentClinic.name}
                    </p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setAvailabilityDate(prev => addDays(prev, -1))}
                  aria-label="יום קודם"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Quick date navigation */}
              <div className="flex justify-center gap-1 mt-3 flex-wrap">
                {[-1, 0, 1, 2, 3].map(offset => {
                  const d = addDays(today, offset);
                  const isSelected = isSameDay(d, availabilityDate);
                  return (
                    <Button
                      key={offset}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn("text-xs", isSelected && "pointer-events-none")}
                      onClick={() => setAvailabilityDate(d)}
                    >
                      {offset === 0 ? 'היום' : offset === 1 ? 'מחר' : format(d, 'EEE d/M', { locale: he })}
                    </Button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <DayAvailabilityGrid
                clinicId={selectedClinicId ?? undefined}
                date={availabilityDate}
                appointments={(availabilityDateAppointments || []).filter(apt => apt.status !== 'cancelled')}
                onSlotClick={(time, isAvailable, appointmentId) => {
                  if (isAvailable) {
                    // Navigate to create appointment with pre-filled date/time
                    const dateStr = format(availabilityDate, 'yyyy-MM-dd');
                    navigate(`/admin/appointments/new?date=${dateStr}&time=${time}`);
                  } else if (appointmentId) {
                    // Navigate to appointment details
                    navigate(`/admin/appointments/${appointmentId}`);
                  }
                }}
              />
            </CardContent>
          </Card>
        )}

        {viewMode === 'list' && <>
          <section className="clinic-week" data-tutorial="calendar-view" aria-label="יומן שבועי">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="שבוע קודם" onClick={()=>navigateWeek('prev')}><ChevronRight/></Button>
              <bdi>{format(weekStart,'d/M')} - {format(weekEnd,'d/M/yyyy')}</bdi>
              <Button variant="ghost" size="icon" aria-label="שבוע הבא" onClick={()=>navigateWeek('next')}><ChevronLeft/></Button>
              <Button className="ms-auto" variant="outline" size="sm" onClick={()=>{setWeekOffset(0);setSelectedWeekday(today.getDay())}}>היום</Button>
            </div>
            <div className="clinic-days">{weekDays.map((day,i)=><button type="button" key={day.toISOString()} aria-pressed={selectedWeekday===i} onClick={()=>setSelectedWeekday(i)}>
              <span>{format(day,'EEEE',{locale:he})}</span><strong>{format(day,'d/M')}</strong>
              <small>{weekLoading || weekError ? '…' : getAppointmentsForDay(day).length+' תורים'}</small>
            </button>)}</div>
          </section>
          <section data-tutorial="appointments-list" className="clinic-agenda">
            <h2 className="!text-xl">{format(selectedDate,'EEEE, d בMMMM',{locale:he})}</h2>
            {weekError ? <div role="alert">טעינת היומן נכשלה. <Button variant="ghost" onClick={()=>reloadWeek()}>ניסיון נוסף</Button></div> : weekLoading ? <p role="status">טוען תורים…</p> :
            getAppointmentsForDay(selectedDate).length===0 ? <p>אין תורים ביום זה.</p> :
            <ul>{getAppointmentsForDay(selectedDate).map(apt=><li key={apt.id}>
              <time dir="ltr">{format(new Date(apt.scheduled_at),'HH:mm')}</time>
              <div><Link to={'/admin/appointments/'+apt.id}>{apt.patients?.first_name} {apt.patients?.last_name}</Link>
                <small>{apt.appointment_types?.name_he || 'ביקור'} · {apt.duration_minutes} דקות</small></div>
              <bdi className="agenda-phone">{apt.patients?.phone}</bdi>
              <Select value={apt.status} onValueChange={value=>handleStatusChange(apt.id,value)}>
                <SelectTrigger aria-label="מצב התור" className="w-28"><SelectValue/></SelectTrigger>
                <SelectContent>{!['scheduled','in_treatment','completed','cancelled'].includes(apt.status) && <SelectItem value={apt.status} disabled>{statusLabels[apt.status] || 'מצב קודם'}</SelectItem>}
                  <SelectItem value="scheduled">מתוכנן</SelectItem><SelectItem value="in_treatment">חדר רופא</SelectItem><SelectItem value="completed">הושלם</SelectItem><SelectItem value="cancelled">ביטול תור</SelectItem>
                </SelectContent>
              </Select></li>)}</ul>}
          </section></>}
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

      </div>
    </>
  );
}
