import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/usePatients';
import { useTodaysAppointments, useAppointmentsRealtime, useUpdateAppointment } from '@/hooks/useAppointments';
import { useInvoiceStats } from '@/hooks/useInvoices';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Receipt, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Plus,
  ChevronLeft,
  UserCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: todaysAppointments, isLoading: appointmentsLoading } = useTodaysAppointments();
  const { data: invoiceStats, isLoading: statsLoading } = useInvoiceStats();
  const updateAppointment = useUpdateAppointment();
  
  // Enable realtime updates
  useAppointmentsRealtime();

  const upcomingAppointments = todaysAppointments?.filter(
    apt => new Date(apt.scheduled_at) > new Date() && apt.status !== 'cancelled'
  ) || [];

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

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                מטופלים רשומים
              </CardTitle>
              <Users className="h-4 w-4 text-medical-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patientsLoading ? '...' : patients?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">מטופלים פעילים במערכת</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                תורים היום
              </CardTitle>
              <Calendar className="h-4 w-4 text-medical-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appointmentsLoading ? '...' : todaysAppointments?.filter(a => a.status !== 'cancelled').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {upcomingAppointments.length} תורים קרובים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                הכנסות החודש
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : `₪${(invoiceStats?.paid || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoiceStats?.paidCount || 0} חשבוניות שולמו
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ממתינות לתשלום
              </CardTitle>
              <Receipt className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : `₪${(invoiceStats?.pending || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoiceStats?.pendingCount || 0} חשבוניות פתוחות
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">תורים להיום</CardTitle>
                <CardDescription>רשימת התורים המתוכננים</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/appointments')}>
                הכל
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">טוען...</div>
              ) : todaysAppointments && todaysAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todaysAppointments.slice(0, 8).map((apt) => (
                    <div
                      key={apt.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer border-r-4 ${
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
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
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
                        <div>
                          <p className="font-medium">
                            {apt.patients?.first_name} {apt.patients?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {apt.appointment_types?.name_he || 'ייעוץ'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-left ml-3">
                          <p className="font-medium">
                            {format(new Date(apt.scheduled_at), 'HH:mm')}
                          </p>
                          <Badge className={statusColors[apt.status] || statusColors.scheduled}>
                            {statusLabels[apt.status] || apt.status}
                          </Badge>
                        </div>
                        {/* Status action buttons */}
                        {apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && (
                          <div className="flex gap-1">
                            {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                                  onClick={(e) => handleStatusChange(e, apt.id, 'arrived')}
                                  title="הגיע"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
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
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
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

          {/* Recent Patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">מטופלים אחרונים</CardTitle>
                <CardDescription>מטופלים שנוספו לאחרונה</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/patients')}>
                הכל
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {patientsLoading ? (
                <div className="text-center py-8 text-muted-foreground">טוען...</div>
              ) : patients && patients.length > 0 ? (
                <div className="space-y-3">
                  {patients.slice(0, 5).map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/patients/${patient.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-medical-100 text-medical-700 font-medium">
                          {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {patient.phone || 'ללא טלפון'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left text-sm text-muted-foreground">
                        {format(new Date(patient.created_at), 'd/M/yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-muted-foreground">אין מטופלים במערכת</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => navigate('/admin/patients/new')}
                  >
                    הוסף מטופל ראשון
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {invoiceStats && invoiceStats.overdue > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">יש חשבוניות באיחור תשלום</p>
                <p className="text-sm text-orange-700">
                  סה״כ ₪{invoiceStats.overdue.toLocaleString()} בחובות פתוחים
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => navigate('/admin/billing?status=overdue')}
              >
                צפייה
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
