import { format, isPast, isFuture, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { usePatientPortalAppointments } from '@/hooks/usePatientPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  scheduled: { label: 'מתוכנן', variant: 'default', icon: Calendar },
  confirmed: { label: 'מאושר', variant: 'default', icon: CheckCircle },
  completed: { label: 'הושלם', variant: 'secondary', icon: CheckCircle },
  cancelled: { label: 'בוטל', variant: 'destructive', icon: XCircle },
  no_show: { label: 'לא הגיע', variant: 'destructive', icon: AlertCircle },
};

export default function PatientAppointmentsTab() {
  const { data: appointments, isLoading } = usePatientPortalAppointments();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const upcomingAppointments = appointments?.filter(
    (apt) => isFuture(new Date(apt.scheduled_at)) || isToday(new Date(apt.scheduled_at))
  ) || [];

  const pastAppointments = appointments?.filter(
    (apt) => isPast(new Date(apt.scheduled_at)) && !isToday(new Date(apt.scheduled_at))
  ) || [];

  if (!appointments?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">אין תורים</h3>
          <p className="text-muted-foreground">
            אין לך תורים מתוכננים כרגע. צור קשר עם המרפאה לקביעת תור.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {upcomingAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground">תורים קרובים</h3>
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} isUpcoming />
            ))}
          </div>
        </div>
      )}

      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">היסטוריית תורים</h3>
          <div className="space-y-3">
            {pastAppointments.slice(0, 10).map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, isUpcoming }: { appointment: any; isUpcoming?: boolean }) {
  const status = statusConfig[appointment.status || 'scheduled'];
  const StatusIcon = status?.icon || Calendar;

  return (
    <Card className={isUpcoming ? 'border-medical-300 bg-medical-50/50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: appointment.appointment_type?.color || '#3B82F6' }}
              />
              <span className="font-medium text-foreground">
                {appointment.appointment_type?.name_he || 'תור'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(appointment.scheduled_at), 'EEEE, d בMMMM yyyy', { locale: he })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(appointment.scheduled_at), 'HH:mm')}
              </span>
            </div>
            {appointment.notes && (
              <p className="text-sm text-muted-foreground mt-2">{appointment.notes}</p>
            )}
          </div>
          <Badge variant={status?.variant || 'default'} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status?.label || appointment.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
