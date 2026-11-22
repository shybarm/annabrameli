import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppointmentsRealtime, useUpdateAppointment, useAppointments } from '@/hooks/useAppointments';
import { useClinicContext } from '@/contexts/ClinicContext';
import { useProjectAnalytics } from '@/hooks/useAnalytics';
import { format, differenceInMinutes, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  Plus,
  UserCheck,
  CheckCircle,
  XCircle,
  UserPlus,
  RotateCcw,
  MessageCircle,
  FileWarning,
  Send,
  AlertTriangle,
  Stethoscope,
  Armchair,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { he } from 'date-fns/locale';

import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { selectedClinicId } = useClinicContext();
  
  // Get today's appointments for current clinic
  const today = new Date();
  const { data: todaysAppointments, isLoading: appointmentsLoading } = useAppointments(
    format(today, 'yyyy-MM-dd'),
    format(addDays(today, 1), 'yyyy-MM-dd'),
    selectedClinicId
  );
  const updateAppointment = useUpdateAppointment();
  
  // Enable realtime updates
  useAppointmentsRealtime();

  // Get week appointments (Sun-Fri) - show next week if Friday/Saturday
  const dayOfWeek = today.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
  
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const weekStart = isWeekend ? addDays(currentWeekStart, 7) : currentWeekStart; // Next week if weekend
  const weekEnd = addDays(weekStart, 5); // Friday
  
  const { data: weekAppointments } = useAppointments(
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd'),
    selectedClinicId
  );

  // Fetch patient appointment counts to determine new vs returning
  const patientIds = todaysAppointments?.map(apt => apt.patient_id) || [];
  
  const { data: patientAppointmentCounts } = useQuery({
    queryKey: ['patient-appointment-counts', patientIds],
    queryFn: async () => {
      if (patientIds.length === 0) return {};
      
      const counts: Record<string, number> = {};
      
      for (const patientId of patientIds) {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patientId)
          .neq('status', 'cancelled');
        
        counts[patientId] = count || 0;
      }
      
      return counts;
    },
    enabled: patientIds.length > 0,
  });

  // Fetch last message for each patient
  const { data: patientLastMessages } = useQuery({
    queryKey: ['patient-last-messages', patientIds],
    queryFn: async () => {
      if (patientIds.length === 0) return {};
      
      const messages: Record<string, string> = {};
      
      for (const patientId of patientIds) {
        const { data } = await supabase
          .from('messages')
          .select('content')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data?.content) {
          // Get first line only
          const firstLine = data.content.split('\n')[0].trim();
          messages[patientId] = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
        }
      }
      
      return messages;
    },
    enabled: patientIds.length > 0,
  });

  const activeAppointments = todaysAppointments?.filter(a => a.status !== 'cancelled') || [];
  const completedCount = activeAppointments.filter(a => a.status === 'completed').length;

  // Analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useProjectAnalytics();

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-blue-100 text-blue-700',
    arrived: 'bg-orange-100 text-orange-700',
    waiting_room: 'bg-yellow-100 text-yellow-700',
    with_doctor: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-purple-100 text-purple-700',
    in_treatment: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
    no_show: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'מתוכנן',
    confirmed: 'מאושר',
    arrived: 'הגיע',
    waiting_room: 'בחדר המתנה',
    with_doctor: 'חדר רופא',
    in_progress: 'חדר רופא',
    in_treatment: 'חדר רופא',
    completed: 'הושלם',
    cancelled: 'בוטל',
    no_show: 'לא הגיע',
  };

  const handleStatusChange = (e: React.MouseEvent, appointmentId: string, newStatus: string) => {
    e.stopPropagation();
    updateAppointment.mutate({ 
      id: appointmentId, 
      status: newStatus,
      ...(newStatus === 'completed' ? { visit_completed_at: new Date().toISOString() } : {})
    });
  };

  const isNewPatient = (patientId: string) => {
    const count = patientAppointmentCounts?.[patientId] || 0;
    return count <= 1;
  };

  const handleSendIntakeReminder = async (e: React.MouseEvent, patientData: any, patientId: string) => {
    e.stopPropagation();
    
    if (!patientData?.phone) {
      toast({ title: 'אין מספר טלפון למטופל', variant: 'destructive' });
      return;
    }

    // Get or create intake token
    let intakeToken = patientData.intake_token_id;
    
    if (!intakeToken) {
      // Create new intake token
      const { data: tokenData, error: tokenError } = await supabase
        .from('intake_tokens')
        .insert({ patient_id: patientId })
        .select('token')
        .single();
      
      if (tokenError) {
        toast({ title: 'שגיאה ביצירת קישור', variant: 'destructive' });
        return;
      }
      intakeToken = tokenData.token;
    } else {
      // Get existing token
      const { data: existingToken } = await supabase
        .from('intake_tokens')
        .select('token')
        .eq('id', intakeToken)
        .single();
      intakeToken = existingToken?.token;
    }

    const intakeUrl = `${window.location.origin}/intake?token=${intakeToken}`;
    navigator.clipboard.writeText(intakeUrl);
    toast({ title: 'קישור הועתק! שלח ללקוח בוואטסאפ' });
  };

  // Get appointments grouped by day for weekly calendar
  const getAppointmentsByDay = () => {
    if (!weekAppointments) return {};
    
    const byDay: Record<string, typeof weekAppointments> = {};
    const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
    
    for (let i = 0; i < 6; i++) {
      const day = addDays(weekStart, i);
      const dayKey = format(day, 'yyyy-MM-dd');
      byDay[dayKey] = weekAppointments.filter(apt => 
        isSameDay(new Date(apt.scheduled_at), day) && apt.status !== 'cancelled'
      );
    }
    
    return byDay;
  };

  const appointmentsByDay = getAppointmentsByDay();
  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

  return (
    <>
      <div className="space-y-6">


        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">לוח בקרה</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, d בMMMM yyyy', { locale: he })}
            </p>
          </div>
          <div className="flex gap-2">
            <PageHelpButton tutorial={pageTutorials['/admin']} />
            <Button onClick={() => navigate('/admin/patients/new')} variant="outline" data-tutorial="new-patient-btn">
              <Plus className="h-4 w-4 ml-2" />
              מטופל חדש
            </Button>
            <Button onClick={() => navigate('/admin/appointments/new')} className="bg-primary text-primary-foreground hover:bg-primary/90" data-tutorial="new-appointment-btn">
              <Plus className="h-4 w-4 ml-2" />
              תור חדש
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="doctor-stats" data-tutorial="stats-cards">
          <div className="doctor-stat">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {appointmentsLoading ? '...' : activeAppointments.length}
              </div>
              <p className="text-sm text-muted-foreground">תורים היום</p>
            </div>
          </div>
          <div className="doctor-stat">
            <div>
              <div className="text-3xl font-bold text-foreground">
                {appointmentsLoading ? '...' : completedCount}
              </div>
              <p className="text-sm text-muted-foreground">הושלמו</p>
            </div>
          </div>
          
          {/* Visitors KPI */}
          <div className="doctor-stat">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={cn(
                    "font-bold text-foreground",
                    analyticsData?.available === false && !analyticsLoading
                      ? "text-base py-2"
                      : "text-3xl"
                  )}>
                    {analyticsLoading
                      ? '...'
                      : analyticsData?.available
                        ? analyticsData.visitors.today
                        : 'אין נתונים זמינים'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {analyticsData?.available === false && !analyticsLoading
                      ? analyticsData.unavailableReason ?? 'מבקרים באתר היום'
                      : 'מבקרים באתר היום'}
                  </p>
                </div>
                {analyticsData?.available && !analyticsLoading && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    analyticsData.visitors.trend === 'up' 
                      ? "bg-green-100 text-foreground"
                      : analyticsData.visitors.trend === 'down'
                        ? "bg-gray-100 text-gray-600"
                        : "bg-gray-100 text-gray-600"
                  )}>
                    {analyticsData.visitors.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : analyticsData.visitors.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    <span>{analyticsData.visitors.change}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Patients - Main View (FIRST) */}
        <Card data-tutorial="todays-patients">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl">מטופלים להיום</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/appointments')} data-tutorial="all-appointments-link">
              כל התורים
            </Button>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="text-center py-8 text-muted-foreground">טוען...</div>
            ) : activeAppointments.length > 0 ? (
              <div className="space-y-3">
                {activeAppointments.map((apt) => {
                  const patientData = apt.patients as any;
                  const isNew = isNewPatient(apt.patient_id);
                  const lastMessage = patientLastMessages?.[apt.patient_id];
                  
                  return (
                    <div
                      key={apt.id}
                      className="rounded-lg border border-border/70 bg-card p-4 hover:border-primary/40 cursor-pointer"
                      onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        {/* Patient Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-lg">
                                {patientData?.first_name} {patientData?.last_name}
                              </p>
                              {/* New/Return Badge */}
                              {isNew ? (
                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                  <UserPlus className="h-3 w-3 ml-1" />
                                  חדש
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-600 text-xs">
                                  <RotateCcw className="h-3 w-3 ml-1" />
                                  חוזר
                                </Badge>
                              )}
                            </div>
                            
                            {/* Reason/Appointment Type - WITHOUT price */}
                            <p className="text-sm font-medium text-primary mt-1">
                              {apt.appointment_types?.name_he || 'ייעוץ'}
                            </p>
                            
                            {/* Main Complaint */}
                            {patientData?.main_complaint && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                <span className="font-medium">תלונה:</span> {patientData.main_complaint}
                              </p>
                            )}
                            
                            {/* Last Message */}
                            {lastMessage && (
                              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1 line-clamp-1">
                                <MessageCircle className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{lastMessage}</span>
                              </p>
                            )}
                            
                            {/* Intake Status */}
                            {!patientData?.intake_completed_at && (
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs whitespace-nowrap">
                                  <FileWarning className="h-3 w-3 ml-1" />
                                  לא השלים קליטה
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2 text-green-600 border-green-300 hover:bg-green-50 whitespace-nowrap"
                                  onClick={(e) => handleSendIntakeReminder(e, patientData, apt.patient_id)}
                                >
                                  <Send className="h-3 w-3 ml-1" />
                                  שלח תזכורת
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Time & Status */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                          <div className="text-right sm:text-left">
                            <p className="font-bold text-lg">
                              {format(new Date(apt.scheduled_at), 'HH:mm')}
                            </p>
                            <Badge className={statusColors[apt.status] || statusColors.scheduled}>
                              {statusLabels[apt.status] || apt.status}
                            </Badge>
                          </div>
                          
                          {/* Status action buttons with next step indicator */}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && (
                            <div className="flex flex-row sm:flex-col gap-1">
                              {['scheduled','confirmed','arrived'].includes(apt.status) && <Button variant="outline" size="sm" onClick={e=>handleStatusChange(e,apt.id,'in_treatment')}>התחלת ביקור</Button>}
                              {/* Waiting Room -> In Treatment (Doctor) */}
                              {apt.status === 'waiting_room' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-purple-600 border-purple-300 hover:bg-purple-100 hover:text-purple-700 gap-1"
                                  onClick={(e) => handleStatusChange(e, apt.id, 'in_treatment')}
                                  title="העבר לחדר רופא"
                                >
                                  <Stethoscope className="h-4 w-4" />
                                  <span className="text-xs hidden sm:inline">חדר רופא</span>
                                </Button>
                              )}
                              {/* In Treatment / With Doctor / In Progress -> Completed */}
                              {(apt.status === 'in_treatment' || apt.status === 'with_doctor' || apt.status === 'in_progress') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-100 hover:text-green-700 gap-1"
                                  onClick={(e) => handleStatusChange(e, apt.id, 'completed')}
                                  title="סיים טיפול"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs hidden sm:inline">הושלם</span>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-muted-foreground mb-2">אין תורים מתוכננים להיום</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/admin/appointments/new')}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  קבע תור חדש
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Mini Calendar (SECOND) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {isWeekend ? 'השבוע הבא' : 'השבוע הזה'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile: Horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden snap-x snap-mandatory">
              {daysOfWeek.map((dayName, index) => {
                const day = addDays(weekStart, index);
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayAppts = appointmentsByDay[dayKey] || [];
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={dayKey}
                    className={cn(
                      "min-w-[80px] flex-shrink-0 p-3 rounded-lg border text-center cursor-pointer transition-colors hover:bg-accent/50 snap-start",
                      isToday ? 'border-primary bg-primary/5' : 'border-muted'
                    )}
                    onClick={() => navigate(`/admin/appointments?date=${dayKey}`)}
                  >
                    <p className={cn("text-xs font-medium", isToday ? 'text-primary' : 'text-muted-foreground')}>
                      {dayName}
                    </p>
                    <p className={cn("text-lg font-bold", isToday && "text-primary")}>
                      {format(day, 'd')}
                    </p>
                    <div className="mt-1">
                      {dayAppts.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {dayAppts.length}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Desktop: Grid */}
            <div className="hidden sm:grid grid-cols-6 gap-2">
              {daysOfWeek.map((dayName, index) => {
                const day = addDays(weekStart, index);
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayAppts = appointmentsByDay[dayKey] || [];
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={dayKey}
                    className={cn(
                      "p-2 rounded-lg border text-center cursor-pointer transition-colors hover:bg-accent/50",
                      isToday ? 'border-primary bg-primary/5' : 'border-muted'
                    )}
                    onClick={() => navigate(`/admin/appointments?date=${dayKey}`)}
                  >
                    <p className={cn("text-xs font-medium", isToday ? 'text-primary' : 'text-muted-foreground')}>
                      {dayName}
                    </p>
                    <p className={cn("text-lg font-bold", isToday && "text-primary")}>
                      {format(day, 'd')}
                    </p>
                    <div className="mt-1">
                      {dayAppts.length > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {dayAppts.length} תורים
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
