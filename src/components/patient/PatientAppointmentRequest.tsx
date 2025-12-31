import { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useAppointmentTypes, useCreateAppointment } from '@/hooks/useAppointments';
import { usePatientRecord } from '@/hooks/usePatientPortal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarPlus, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function PatientAppointmentRequest() {
  const [open, setOpen] = useState(false);
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const { data: appointmentTypes } = useAppointmentTypes();
  const { data: patient } = usePatientRecord();
  const createAppointment = useCreateAppointment();
  
  const selectedType = appointmentTypes?.find(t => t.id === appointmentTypeId);
  
  // Note: PatientAppointmentRequest uses hardcoded slots since patient may not have clinic_id
  // For patients, we use static time slots - the server validates on submission
  const staticTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];
  const loadingSlots = false;
  const availableSlots = staticTimeSlots;

  const handleSubmit = async () => {
    if (!patient || !appointmentTypeId || !date || !time) {
      toast({
        title: 'נא למלא את כל השדות',
        variant: 'destructive',
      });
      return;
    }

    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    try {
      await createAppointment.mutateAsync({
        patient_id: patient.id,
        appointment_type_id: appointmentTypeId,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: selectedType?.duration_minutes || 30,
        notes: notes || undefined,
      });

      setOpen(false);
      resetForm();
      toast({
        title: 'בקשת תור נשלחה',
        description: 'המרפאה תאשר את התור בהקדם',
      });
    } catch (error) {
      // Error handled in mutation - slots are auto-refreshed
    }
  };

  const resetForm = () => {
    setAppointmentTypeId('');
    setDate(undefined);
    setTime('');
    setNotes('');
  };

  // Reset time when date changes (as available slots change)
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    setTime(''); // Reset time selection
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <CalendarPlus className="h-4 w-4 ml-2" />
          בקשת תור חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>בקשת תור חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Appointment Type */}
          <div className="space-y-2">
            <Label>סוג תור</Label>
            <Select value={appointmentTypeId} onValueChange={setAppointmentTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג תור" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name_he}</span>
                      <span className="text-muted-foreground text-sm">
                        ({type.duration_minutes} דקות)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>תאריך מבוקש</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-right font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date ? format(date, 'EEEE, d בMMMM yyyy', { locale: he }) : 'בחר תאריך'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  disabled={(date) => date < new Date() || date.getDay() === 6}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time - from server */}
          <div className="space-y-2">
            <Label>שעה מבוקשת</Label>
            <Select value={time} onValueChange={setTime} disabled={!date || loadingSlots}>
              <SelectTrigger>
                <SelectValue placeholder={loadingSlots ? "טוען..." : "בחר שעה"}>
                  {loadingSlots ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>טוען...</span>
                    </div>
                  ) : time ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{time}</span>
                    </div>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableSlots.length === 0 && !loadingSlots ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    אין שעות פנויות בתאריך זה
                  </div>
                ) : (
                  availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>הערות (אופציונלי)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="פרט על הסיבה לתור או הערות נוספות..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createAppointment.isPending || !appointmentTypeId || !date || !time}
            className="w-full"
          >
            {createAppointment.isPending ? 'שולח בקשה...' : 'שלח בקשת תור'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
