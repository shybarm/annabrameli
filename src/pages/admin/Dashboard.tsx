import { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppointmentsRealtime, useUpdateAppointment, useAppointments } from '@/hooks/useAppointments';
import { useClinicContext } from '@/contexts/ClinicContext';
import { format, differenceInMinutes, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { he } from 'date-fns/locale';
import { OnboardingTutorial } from '@/components/tutorial/OnboardingTutorial';
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
  const waitingCount = activeAppointments.filter(a => a.status === 'arrived' || a.status === 'in_progress' || a.status === 'waiting_room').length;
  const completedCount = activeAppointments.filter(a => a.status === 'completed').length;

  // Track appointments that changed to waiting_room status
  const [waitingStartTimes, setWaitingStartTimes] = useState<Record<string, Date>>({});
  const alertedAppointments = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate waiting time for an appointment
  const getWaitingMinutes = useCallback((appointmentId: string): number => {
    const startTime = waitingStartTimes[appointmentId];
    if (!startTime) return 0;
    return differenceInMinutes(new Date(), startTime);
  }, [waitingStartTimes]);

  // Track when appointments enter waiting_room status
  useEffect(() => {
    if (!activeAppointments) return;
    
    const newWaitingTimes: Record<string, Date> = { ...waitingStartTimes };
    let hasChanges = false;
    
    activeAppointments.forEach(apt => {
      if (apt.status === 'waiting_room' && !waitingStartTimes[apt.id]) {
        // Started waiting now
        newWaitingTimes[apt.id] = new Date();
        hasChanges = true;
      } else if (apt.status !== 'waiting_room' && waitingStartTimes[apt.id]) {
        // No longer waiting
        delete newWaitingTimes[apt.id];
        alertedAppointments.current.delete(apt.id);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setWaitingStartTimes(newWaitingTimes);
    }
  }, [activeAppointments]);

  // Check for long waiting times and show alerts
  useEffect(() => {
    const checkWaitingTimes = () => {
      Object.entries(waitingStartTimes).forEach(([aptId, startTime]) => {
        const waitingMinutes = differenceInMinutes(new Date(), startTime);
        
        if (waitingMinutes >= 15 && !alertedAppointments.current.has(aptId)) {
          alertedAppointments.current.add(aptId);
          
          const apt = activeAppointments.find(a => a.id === aptId);
          const patientName = apt?.patients ? `${(apt.patients as any).first_name} ${(apt.patients as any).last_name}` : 'מטופל';
          
          // Play alert sound
          try {
            if (!audioRef.current) {
              audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1iZ2xvcXJzdHNycnJycnJycnJycnJycXBvbmxraWhmY2BeW1hVUk9MSUZDQDs4NTIvLCknJCEeGxgVEg8MCgcEAQAAAAAAAQQHCg0QExYZHB8iJScqLTAzNjlASUtOUVRXWl1gY2ZpbG9ycnJycnJycnJycnJycnNycnJxcG5sa2loZmRhXltYVVJPTElGQz86NzQxLisnJCEeGxgVEg8MCgcEAQAAAAAAAQQHCg0QExYZHB8iJSgqLTAzNjpASUtOUVRXWl1gY2ZpbG9ycnJycnJycnJycnJy');
            }
            audioRef.current.play().catch(() => {});
          } catch (e) {}
          
          // Show toast notification
          toast({
            title: '⚠️ המתנה ארוכה',
            description: `${patientName} ממתין/ה יותר מ-15 דקות בחדר ההמתנה`,
            variant: 'destructive',
            duration: 10000,
          });
        }
      });
    };
    
    // Check immediately and then every minute
    checkWaitingTimes();
    const interval = setInterval(checkWaitingTimes, 60000);
    
    return () => clearInterval(interval);
  }, [waitingStartTimes, activeAppointments]);

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

    // WhatsApp functionality removed - will be rebuilt
    toast({ title: 'פונקציית WhatsApp בבנייה מחדש' });
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Onboarding Tutorial */}
        <OnboardingTutorial />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#343e42] -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 rounded-lg">
          <div>
            <h1 className="text-2xl font-bold text-white">לוח בקרה</h1>
            <p className="text-gray-300">
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
        <div className="grid gap-4 grid-cols-3" data-tutorial="stats-cards">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-blue-700">
                {appointmentsLoading ? '...' : activeAppointments.length}
              </div>
              <p className="text-sm text-blue-600">תורים היום</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-orange-700">
                {waitingCount}
              </div>
              <p className="text-sm text-orange-600">ממתינים</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 text-center">
              <div className="text-3xl font-bold text-green-700">
                {completedCount}
              </div>
              <p className="text-sm text-green-600">הושלמו</p>
            </CardContent>
          </Card>
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
                  
                  const waitingMinutes = apt.status === 'waiting_room' ? getWaitingMinutes(apt.id) : 0;
                  const isLongWait = waitingMinutes >= 15;
                  
                  return (
                    <div
                      key={apt.id}
                      className={`p-4 rounded-lg transition-colors cursor-pointer border-r-4 ${
                        apt.status === 'waiting_room'
                          ? isLongWait 
                            ? 'waiting-alert border-r-red-500' 
                            : 'bg-yellow-50 border-r-yellow-500'
                          : apt.status === 'with_doctor' || apt.status === 'in_treatment'
                            ? 'bg-purple-50 border-r-purple-500'
                            : apt.status === 'arrived' || apt.status === 'in_progress' 
                              ? 'bg-orange-50 border-r-orange-500' 
                              : apt.status === 'completed' 
                                ? 'bg-green-50 border-r-green-500' 
                                : apt.status === 'no_show' 
                                  ? 'bg-red-50 border-r-red-500' 
                                  : 'bg-gray-50 border-r-blue-500 hover:bg-gray-100'
                      }`}
                      onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Patient Info */}
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0 ${
                            apt.status === 'waiting_room'
                              ? isLongWait ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              : apt.status === 'with_doctor' || apt.status === 'in_treatment'
                                ? 'bg-purple-100 text-purple-700'
                                : apt.status === 'arrived' || apt.status === 'in_progress'
                                  ? 'bg-orange-100 text-orange-700'
                                  : apt.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : apt.status === 'no_show'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-medical-100 text-medical-700'
                          }`}>
                            {apt.status === 'waiting_room' ? (
                              isLongWait ? <AlertTriangle className="h-5 w-5" /> : <Armchair className="h-5 w-5" />
                            ) : apt.status === 'with_doctor' || apt.status === 'in_treatment' ? (
                              <Stethoscope className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
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
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                  <FileWarning className="h-3 w-3 ml-1" />
                                  לא השלים קליטה
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2 text-green-600 border-green-300 hover:bg-green-50"
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
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-left">
                            <p className="font-bold text-lg">
                              {format(new Date(apt.scheduled_at), 'HH:mm')}
                            </p>
                            <Badge className={statusColors[apt.status] || statusColors.scheduled}>
                              {statusLabels[apt.status] || apt.status}
                            </Badge>
                            {/* Show waiting time for waiting_room status */}
                            {apt.status === 'waiting_room' && waitingMinutes > 0 && (
                              <p className={`text-xs mt-1 font-medium ${isLongWait ? 'text-red-600' : 'text-yellow-600'}`}>
                                {isLongWait && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                                ממתין {waitingMinutes} דק׳
                              </p>
                            )}
                          </div>
                          
                          {/* Status action buttons with next step indicator */}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && (
                            <div className="flex flex-col gap-1">
                              {/* Scheduled/Confirmed -> Waiting Room or No Show */}
                              {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-yellow-600 border-yellow-300 hover:bg-yellow-100 hover:text-yellow-700 gap-1"
                                    onClick={(e) => handleStatusChange(e, apt.id, 'waiting_room')}
                                    title="העבר לחדר המתנה"
                                  >
                                    <Armchair className="h-4 w-4" />
                                    <span className="text-xs hidden sm:inline">חדר המתנה</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 gap-1"
                                    onClick={(e) => handleStatusChange(e, apt.id, 'no_show')}
                                    title="לא הגיע"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-xs hidden sm:inline">לא הגיע</span>
                                  </Button>
                                </>
                              )}
                              {/* Arrived -> Waiting Room */}
                              {apt.status === 'arrived' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-yellow-600 border-yellow-300 hover:bg-yellow-100 hover:text-yellow-700 gap-1"
                                  onClick={(e) => handleStatusChange(e, apt.id, 'waiting_room')}
                                  title="העבר לחדר המתנה"
                                >
                                  <Armchair className="h-4 w-4" />
                                  <span className="text-xs hidden sm:inline">חדר המתנה</span>
                                </Button>
                              )}
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
            <div className="grid grid-cols-6 gap-2">
              {daysOfWeek.map((dayName, index) => {
                const day = addDays(weekStart, index);
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayAppts = appointmentsByDay[dayKey] || [];
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={dayKey}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-colors hover:bg-accent/50 ${
                      isToday ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => navigate(`/admin/appointments?date=${dayKey}`)}
                  >
                    <p className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {dayName}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
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
    </AdminLayout>
  );
}
