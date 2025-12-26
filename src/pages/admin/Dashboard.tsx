import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTodaysAppointments, useAppointmentsRealtime, useUpdateAppointment } from '@/hooks/useAppointments';
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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: todaysAppointments, isLoading: appointmentsLoading } = useTodaysAppointments();
  const updateAppointment = useUpdateAppointment();
  
  // Enable realtime updates
  useAppointmentsRealtime();

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
  const waitingCount = activeAppointments.filter(a => a.status === 'arrived' || a.status === 'in_progress').length;
  const completedCount = activeAppointments.filter(a => a.status === 'completed').length;

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-blue-100 text-blue-700',
    arrived: 'bg-orange-100 text-orange-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
    no_show: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'מתוכנן',
    confirmed: 'מאושר',
    arrived: 'הגיע',
    in_progress: 'בטיפול',
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
    const phone = patientData.phone.replace(/\D/g, '').replace(/^0/, '972');
    const message = encodeURIComponent(
      `שלום ${patientData.first_name},\n\nהתור שלך יגיע בעוד כמה דק על מנת לייעל את הטיפול בך השלם את טופס קליטה למרפאה:\n\n${intakeUrl}\n\nתודה,\nד״ר אנה ברמלי`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast({ title: 'נפתח WhatsApp לשליחת תזכורת' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#343e42] -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 rounded-lg">
          <div>
            <h1 className="text-2xl font-bold text-white">לוח בקרה</h1>
            <p className="text-gray-300">
              {format(new Date(), 'EEEE, d בMMMM yyyy', { locale: he })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/patients/new')} variant="outline">
              <Plus className="h-4 w-4 ml-2" />
              מטופל חדש
            </Button>
            <Button onClick={() => navigate('/admin/appointments/new')} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 ml-2" />
              תור חדש
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-3">
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

        {/* Today's Patients - Main View */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl">מטופלים להיום</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/appointments')}>
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
                      className={`p-4 rounded-lg transition-colors cursor-pointer border-r-4 ${
                        apt.status === 'arrived' || apt.status === 'in_progress' 
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
                            apt.status === 'arrived' || apt.status === 'in_progress'
                              ? 'bg-orange-100 text-orange-700'
                              : apt.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : apt.status === 'no_show'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-medical-100 text-medical-700'
                          }`}>
                            <Clock className="h-5 w-5" />
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
                            
                            {/* Reason/Appointment Type */}
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
                          </div>
                          
                          {/* Status action buttons */}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && (
                            <div className="flex flex-col gap-1">
                              {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9 text-orange-600 border-orange-300 hover:bg-orange-100 hover:text-orange-700"
                                    onClick={(e) => handleStatusChange(e, apt.id, 'arrived')}
                                    title="הגיע"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700"
                                    onClick={(e) => handleStatusChange(e, apt.id, 'no_show')}
                                    title="לא הגיע"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {(apt.status === 'arrived' || apt.status === 'in_progress') && (
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 text-green-600 border-green-300 hover:bg-green-100 hover:text-green-700"
                                  onClick={(e) => handleStatusChange(e, apt.id, 'completed')}
                                  title="סיים טיפול"
                                >
                                  <CheckCircle className="h-4 w-4" />
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
      </div>
    </AdminLayout>
  );
}
