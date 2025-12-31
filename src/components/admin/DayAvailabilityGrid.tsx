import { useMemo } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useClinic, getClinicHoursForDay } from '@/hooks/useClinics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  patients?: {
    first_name: string;
    last_name: string;
  } | null;
  appointment_types?: {
    name_he: string;
  } | null;
}

interface DayAvailabilityGridProps {
  clinicId: string | undefined;
  date: Date;
  appointments: Appointment[];
  onSlotClick?: (time: string, isAvailable: boolean, appointmentId?: string) => void;
  durationMinutes?: number;
}

export function DayAvailabilityGrid({
  clinicId,
  date,
  appointments,
  onSlotClick,
  durationMinutes = 30,
}: DayAvailabilityGridProps) {
  const { data: clinic } = useClinic(clinicId);
  const { data: availableSlots, isLoading } = useAvailableSlots(clinicId, date, durationMinutes);
  
  // Get working hours for the day to generate all possible slots
  const workingHours = clinic ? getClinicHoursForDay(clinic, date) : null;
  
  // Generate all time slots based on working hours
  const allSlots = useMemo(() => {
    if (!workingHours) return [];
    
    const slots: string[] = [];
    const [openHour, openMin] = workingHours.open.split(':').map(Number);
    const [closeHour, closeMin] = workingHours.close.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMin = openMin;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const time = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(time);
      
      currentMin += 30; // 30-minute intervals
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }
    
    return slots;
  }, [workingHours]);
  
  // Create a map of time -> appointment for quick lookup
  const appointmentsByTime = useMemo(() => {
    const map = new Map<string, Appointment>();
    appointments.forEach(apt => {
      const time = format(new Date(apt.scheduled_at), 'HH:mm');
      map.set(time, apt);
    });
    return map;
  }, [appointments]);
  
  // Create set of available slots for quick lookup
  const availableSet = useMemo(() => new Set(availableSlots || []), [availableSlots]);
  
  const handleSlotClick = (time: string) => {
    const appointment = appointmentsByTime.get(time);
    const isAvailable = availableSet.has(time);
    onSlotClick?.(time, isAvailable, appointment?.id);
  };
  
  if (!workingHours) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <XCircle className="h-5 w-5 ml-2" />
        המרפאה סגורה ביום זה
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {format(date, 'EEEE, d בMMMM', { locale: he })}
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            פנוי
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
            תפוס
          </span>
        </div>
      </div>
      
      {/* Time grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {allSlots.map((time) => {
          const appointment = appointmentsByTime.get(time);
          const isAvailable = availableSet.has(time);
          const isTaken = !!appointment;
          
          return (
            <button
              key={time}
              onClick={() => handleSlotClick(time)}
              className={cn(
                "relative p-2 rounded-lg border text-sm transition-all",
                "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                isAvailable && !isTaken && "bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300",
                isTaken && "bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300",
                !isAvailable && !isTaken && "bg-muted/50 border-border opacity-50 cursor-not-allowed"
              )}
              disabled={!isAvailable && !isTaken}
            >
              <div className="font-bold text-base">{time}</div>
              
              {isTaken && appointment ? (
                <div className="mt-1">
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    תפוס
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {appointment.patients?.first_name?.[0]}.{appointment.patients?.last_name?.[0]}.
                  </p>
                </div>
              ) : isAvailable ? (
                <div className="mt-1">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-100 text-green-700 border-green-300">
                    פנוי
                  </Badge>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      
      {allSlots.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          אין שעות פעילות מוגדרות ליום זה
        </div>
      )}
    </div>
  );
}
