import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppointments, useAppointmentsRealtime, useAppointmentTypes } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Calendar, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';

export default function AppointmentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: appointments, isLoading } = useAppointments(
    format(weekStart, 'yyyy-MM-dd'),
    format(addDays(weekEnd, 1), 'yyyy-MM-dd')
  );
  const { data: appointmentTypes } = useAppointmentTypes();

  useAppointmentsRealtime();

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
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
    in_treatment: 'בטיפול',
    completed: 'הושלם',
    cancelled: 'בוטל',
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments?.filter(apt => 
      isSameDay(new Date(apt.scheduled_at), date) && apt.status !== 'cancelled'
    ) || [];
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const handleStatusChange = (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate({ id, status: newStatus });
  };

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

        {/* Week Navigation */}
        <Card data-tutorial="calendar-view">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <CardTitle className="text-center">
                {format(weekStart, 'd בMMMM', { locale: he })} - {format(weekEnd, 'd בMMMM yyyy', { locale: he })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week View - Scrollable on mobile */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="grid grid-cols-7 gap-2 min-w-[600px] sm:min-w-0">
                {weekDays.map((day) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  
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
          </CardContent>
        </Card>

        {/* Today's Appointments List */}
        <Card data-tutorial="appointments-list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-600" />
              תורים ל{format(selectedDate, 'EEEE, d בMMMM', { locale: he })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600" />
              </div>
            ) : getAppointmentsForDay(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getAppointmentsForDay(selectedDate).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
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
                            <SelectItem value="in_treatment">בטיפול</SelectItem>
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
                <p className="text-muted-foreground">אין תורים מתוכננים ליום זה</p>
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
      </div>
    </AdminLayout>
  );
}
