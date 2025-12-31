import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format, addMinutes, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { z } from 'zod';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAppointmentTypes } from '@/hooks/useAppointments';
import { usePublicClinics, getClinicHoursForDay, getAvailableTimeSlots, type PublicClinic } from '@/hooks/useClinics';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Stethoscope, Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle, Upload, X, FileText, MapPin, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// hCaptcha site key (publishable)
const HCAPTCHA_SITE_KEY = '56fe4e12-298c-4890-8ec0-eaeec68478c0';

const guestSchema = z.object({
  firstName: z.string().trim().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים').max(100),
  lastName: z.string().trim().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים').max(100),
  phone: z.string().trim().min(9, 'מספר טלפון לא תקין').max(20),
  email: z.string().trim().min(1, 'כתובת אימייל נדרשת').email('כתובת אימייל לא תקינה').max(255),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// Normalize phone to E.164 format for Israel
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '');
  if (normalized.startsWith('0')) {
    normalized = '+972' + normalized.substring(1);
  } else if (normalized.startsWith('972') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+972' + normalized;
  }
  return normalized;
}

export default function GuestBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'clinic' | 'info' | 'appointment' | 'success'>('clinic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captchaRef = useRef<HCaptcha>(null);

  // Form state
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: clinics, isLoading: loadingClinics } = usePublicClinics();
  const { data: appointmentTypes } = useAppointmentTypes();
  const selectedType = appointmentTypes?.find(t => t.id === appointmentTypeId);
  const selectedClinic = clinics?.find(c => c.id === selectedClinicId) as PublicClinic | undefined;

  // State for booked slots
  const [bookedSlots, setBookedSlots] = useState<{ start: Date; end: Date }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch booked appointments when date or clinic changes
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!date || !selectedClinicId) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const startOfDay = format(date, 'yyyy-MM-dd') + 'T00:00:00';
        const endOfDay = format(date, 'yyyy-MM-dd') + 'T23:59:59';

        const { data, error } = await supabase
          .from('appointments')
          .select('scheduled_at, duration_minutes')
          .eq('clinic_id', selectedClinicId)
          .gte('scheduled_at', startOfDay)
          .lte('scheduled_at', endOfDay)
          .not('status', 'eq', 'cancelled')
          .not('is_deleted', 'eq', true);

        if (error) {
          console.error('Error fetching booked slots:', error);
          setBookedSlots([]);
          return;
        }

        const slots = (data || []).map(apt => ({
          start: parseISO(apt.scheduled_at),
          end: addMinutes(parseISO(apt.scheduled_at), apt.duration_minutes || 30)
        }));
        setBookedSlots(slots);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [date, selectedClinicId]);
  
  const availableTimeSlots = useMemo(() => {
    if (!selectedClinic || !date) return [];
    
    const allSlots = getAvailableTimeSlots(selectedClinic as any, date, 30);
    const duration = selectedType?.duration_minutes || 30;
    
    // Filter out slots that conflict with booked appointments
    return allSlots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = addMinutes(slotStart, duration);
      
      // Check if this slot conflicts with any booked slot
      return !bookedSlots.some(booked => {
        // Overlap check: slot starts before booked ends AND slot ends after booked starts
        return slotStart < booked.end && slotEnd > booked.start;
      });
    });
  }, [selectedClinic, date, bookedSlots, selectedType?.duration_minutes]);

  // Get open days for calendar disabled dates
  const isDateDisabled = (date: Date) => {
    if (date < new Date()) return true;
    if (!selectedClinic) return false;
    const hours = getClinicHoursForDay(selectedClinic as any, date);
    return !hours;
  };

  // Format working days for display
  const formatWorkingDays = (clinic: PublicClinic | undefined) => {
    if (!clinic?.working_hours) return 'לא הוגדרו שעות';
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayLabels = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    const openDays = days.map((day, i) => clinic.working_hours?.[day] ? dayLabels[i] : null).filter(Boolean);
    return openDays.join(', ');
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'סוג קובץ לא נתמך',
          description: `${file.name} - נא להעלות PDF או תמונות בלבד`,
          variant: 'destructive',
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'קובץ גדול מדי',
          description: `${file.name} - גודל מקסימלי 10MB`,
          variant: 'destructive',
        });
        continue;
      }
      validFiles.push(file);
    }
    
    setDocuments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async (bookingId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    for (const file of documents) {
      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('document_type', 'referral');

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/guest-upload-document`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to upload document:', file.name, errorData);
        }
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }
  };

  const handleSelectClinic = () => {
    if (!selectedClinicId) {
      toast({ title: 'נא לבחור מרפאה', variant: 'destructive' });
      return;
    }
    setStep('info');
  };

  // Continue to appointment step (no OTP)
  const handleContinueToAppointment = () => {
    try {
      guestSchema.parse({ firstName, lastName, phone, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'שגיאה בטופס',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return;
    }
    setStep('appointment');
  };

  const handleSubmit = async () => {
    if (!appointmentTypeId || !date || !time) {
      toast({
        title: 'נא למלא את כל השדות',
        variant: 'destructive',
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: 'נא לאמת שאתה לא רובוט',
        description: 'השלם את אימות ה-CAPTCHA',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the guest-booking edge function (no OTP verification)
      const response = await supabase.functions.invoke('guest-booking', {
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          clinicId: selectedClinicId,
          appointmentTypeId,
          date: format(date, 'yyyy-MM-dd'),
          time,
          notes: notes.trim() || null,
          captchaToken,
        },
      });

      // Handle FunctionsHttpError (non-2xx responses) - parse the JSON body
      if (response.error) {
        if (response.error instanceof FunctionsHttpError) {
          // Try to get the actual error response from the body
          try {
            const errorData = await response.error.context.json();
            if (errorData.code === 'SLOT_TAKEN' || errorData.code === 'SLOT_RACE_CONDITION') {
              setTime('');
              throw new Error(errorData.error || 'הזמן הזה כבר תפוס. בחרו זמן אחר.');
            }
            throw new Error(errorData.error || 'שגיאה בשליחת הבקשה');
          } catch (parseError) {
            // If we can't parse the error, check if it's already the error we threw
            if (parseError instanceof Error && parseError.message.includes('תפוס')) {
              throw parseError;
            }
            throw new Error('שגיאה בשליחת הבקשה');
          }
        }
        throw new Error(response.error.message || 'שגיאה בשליחת הבקשה');
      }

      const data = response.data;

      if (!data.success) {
        // Handle slot taken errors specifically
        if (data.code === 'SLOT_TAKEN' || data.code === 'SLOT_RACE_CONDITION') {
          // Reset time selection so user picks a new slot
          setTime('');
          throw new Error(data.error || 'הזמן הזה כבר תפוס. בחרו זמן אחר.');
        }
        throw new Error(data.error || 'שגיאה בשליחת הבקשה');
      }

      // Upload documents if any (using booking ID)
      if (documents.length > 0 && data.bookingId) {
        await uploadDocuments(data.bookingId);
      }

      // Reset CAPTCHA after successful submit
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);

      setStep('success');
    } catch (error: any) {
      console.error('Booking error:', error);
      
      // Reset CAPTCHA on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      
      // Show appropriate error message
      const isSlotError = error.message?.includes('תפוס') || error.message?.includes('נתפס');
      toast({
        title: isSlotError ? 'הזמן הזה כבר תפוס' : 'שגיאה בקביעת התור',
        description: isSlotError ? 'בחרו זמן אחר מהרשימה' : error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md border-medical-200">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">התור נקבע בהצלחה!</h2>
            <p className="text-muted-foreground mb-6">
              פרטי התור נשמרו במערכת.
              {email && <><br />אישור נשלח לכתובת <strong>{email}</strong>.</>}
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6 text-right">
              <p className="text-sm text-muted-foreground">פרטי התור:</p>
              <p className="font-medium">{selectedClinic?.name}</p>
              <p className="font-medium">{selectedType?.name_he}</p>
              <p className="text-sm text-muted-foreground">
                {date && format(date, 'EEEE, d בMMMM yyyy', { locale: he })} בשעה {time}
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              חזרה לאתר
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white py-8 px-4" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-medical-700 hover:text-medical-800 transition-colors mb-4">
            <ArrowRight className="h-4 w-4" />
            <span>חזרה לאתר</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-medical-600" />
            <h1 className="text-2xl font-bold text-medical-800">קביעת תור</h1>
          </div>
          <p className="text-muted-foreground">ד״ר אנה ברמלי</p>
        </div>

        {/* Progress - 3 steps */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
            step === 'clinic' ? 'bg-medical-600 text-white' : 'bg-medical-100 text-medical-600'
          )}>
            1
          </div>
          <div className="w-6 h-0.5 bg-medical-200" />
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
            step === 'info' ? 'bg-medical-600 text-white' : 'bg-medical-100 text-medical-600'
          )}>
            2
          </div>
          <div className="w-6 h-0.5 bg-medical-200" />
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
            step === 'appointment' ? 'bg-medical-600 text-white' : 'bg-medical-100 text-medical-600'
          )}>
            3
          </div>
        </div>

        <Card className="border-medical-200 shadow-lg">
          {step === 'clinic' && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  בחירת מרפאה
                </CardTitle>
                <CardDescription>בחר את המרפאה הנוחה לך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingClinics ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600" />
                  </div>
                ) : clinics && clinics.length > 0 ? (
                  <div className="space-y-3">
                    {clinics.map((clinic) => (
                      <div
                        key={clinic.id}
                        onClick={() => setSelectedClinicId(clinic.id)}
                        className={cn(
                          'p-4 border rounded-lg cursor-pointer transition-all',
                          selectedClinicId === clinic.id
                            ? 'border-medical-600 bg-medical-50 ring-2 ring-medical-600'
                            : 'border-border hover:border-medical-300'
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-foreground">{clinic.name}</h3>
                            {clinic.city && (
                              <p className="text-sm text-muted-foreground">{clinic.city}</p>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">ימי קבלה:</p>
                            <p className="text-sm font-medium">{formatWorkingDays(clinic)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    אין מרפאות זמינות כרגע
                  </p>
                )}
                <Button
                  onClick={handleSelectClinic}
                  className="w-full"
                  disabled={!selectedClinicId}
                >
                  המשך
                </Button>
              </CardContent>
            </>
          )}

          {step === 'info' && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep('clinic')}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle>פרטים אישיים</CardTitle>
                    <CardDescription>נא למלא את הפרטים הבאים</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">שם פרטי *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="שם פרטי"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">שם משפחה *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="שם משפחה"
                      maxLength={100}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-1234567"
                    maxLength={20}
                    dir="ltr"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    maxLength={255}
                    dir="ltr"
                    required
                  />
                  <p className="text-xs text-muted-foreground">אופציונלי - לשליחת אישור</p>
                </div>
                <Button
                  onClick={handleContinueToAppointment}
                  className="w-full"
                  disabled={!firstName || !lastName || !phone}
                >
                  המשך לבחירת תור
                </Button>
              </CardContent>
            </>
          )}

          {step === 'appointment' && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep('info')}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle>בחירת תור</CardTitle>
                    <CardDescription>
                      {selectedClinic?.name} - בחר את סוג התור והזמן המבוקש
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Appointment Type */}
                <div className="space-y-2">
                  <Label>סוג תור *</Label>
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
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label>תאריך מבוקש *</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                        onSelect={(d) => {
                          setDate(d);
                          setTime('');
                          setCalendarOpen(false);
                        }}
                        disabled={isDateDisabled}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label>שעה מבוקשת *</Label>
                  <Select value={time} onValueChange={setTime} disabled={!date || loadingSlots}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSlots ? 'טוען שעות פנויות...' : (date ? 'בחר שעה' : 'נא לבחור תאריך קודם')}>
                        {time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{time}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {loadingSlots ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          טוען...
                        </div>
                      ) : availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          אין שעות פנויות ביום זה
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Upload */}
                <div className="space-y-2">
                  <Label>מסמכים (אופציונלי)</Label>
                  <p className="text-xs text-muted-foreground">ניתן להעלות הפניות, בדיקות קודמות או מסמכים רפואיים</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    העלאת מסמכים
                  </Button>
                  
                  {documents.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {documents.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">הערות (אופציונלי)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ספר/י לנו בקצרה על סיבת הפנייה..."
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                {/* CAPTCHA */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Shield className="h-4 w-4" />
                    <span>אימות אבטחה</span>
                  </div>
                  <div className="flex justify-center">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      languageOverride="he"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={isSubmitting || !appointmentTypeId || !date || !time || !captchaToken}
                >
                  {isSubmitting ? 'שולח בקשה...' : 'שלח בקשה לתור'}
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
