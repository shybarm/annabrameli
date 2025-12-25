import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { z } from 'zod';
import { useAppointmentTypes } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Stethoscope, Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle, Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const guestSchema = z.object({
  firstName: z.string().trim().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  lastName: z.string().trim().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  phone: z.string().trim().min(9, 'מספר טלפון לא תקין'),
  email: z.string().trim().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
});

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export default function GuestBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'appointment' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);

  const { data: appointmentTypes } = useAppointmentTypes();
  const selectedType = appointmentTypes?.find(t => t.id === appointmentTypeId);

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

  const uploadDocuments = async (patientId: string, uploadToken: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    for (const file of documents) {
      const formData = new FormData();
      formData.append('patient_id', patientId);
      formData.append('upload_token', uploadToken);
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

  const handleContinue = () => {
    try {
      guestSchema.parse({ firstName, lastName, phone, email });
      setStep('appointment');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'שגיאה בטופס',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!appointmentTypeId || !date || !time) {
      toast({
        title: 'נא למלא את כל השדות',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          status: 'active',
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Upload documents if any - create secure upload token first
      if (documents.length > 0) {
        // Create a short-lived upload token for secure document upload
        const { data: tokenData, error: tokenError } = await supabase
          .from('upload_tokens')
          .insert({ patient_id: patient.id })
          .select('token')
          .single();

        if (tokenError) {
          console.error('Failed to create upload token:', tokenError);
        } else {
          await uploadDocuments(patient.id, tokenData.token);
        }
      }

      // Create appointment
      const scheduledAt = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patient.id,
          appointment_type_id: appointmentTypeId,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: selectedType?.duration_minutes || 30,
          notes: notes.trim() || null,
          // Let the database default status apply ("scheduled") to satisfy constraints
        });

      if (appointmentError) throw appointmentError;

      setStep('success');
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'שגיאה בקביעת התור',
        description: error.message,
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
            <h2 className="text-2xl font-bold text-foreground mb-2">הבקשה נשלחה בהצלחה!</h2>
            <p className="text-muted-foreground mb-6">
              קיבלנו את בקשתך לתור. צוות המרפאה ייצור איתך קשר בהקדם לאישור.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6 text-right">
              <p className="text-sm text-muted-foreground">פרטי הבקשה:</p>
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

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            step === 'info' ? 'bg-medical-600 text-white' : 'bg-medical-100 text-medical-600'
          )}>
            1
          </div>
          <div className="w-8 h-0.5 bg-medical-200" />
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            step === 'appointment' ? 'bg-medical-600 text-white' : 'bg-medical-100 text-medical-600'
          )}>
            2
          </div>
        </div>

        <Card className="border-medical-200 shadow-lg">
          {step === 'info' && (
            <>
              <CardHeader>
                <CardTitle>פרטים אישיים</CardTitle>
                <CardDescription>נא למלא את הפרטים הבאים</CardDescription>
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
                    dir="ltr"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל (אופציונלי)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
                <Button
                  onClick={handleContinue}
                  className="w-full"
                  disabled={!firstName || !lastName || !phone}
                >
                  המשך
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  כבר יש לך חשבון?{' '}
                  <Link to="/auth" className="text-medical-600 hover:underline">
                    התחבר
                  </Link>
                </p>
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
                    <CardDescription>בחר את סוג התור והזמן המבוקש</CardDescription>
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
                        onSelect={setDate}
                        disabled={(date) => date < new Date() || date.getDay() === 6}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label>שעה מבוקשת *</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר שעה">
                        {time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{time}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
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
                  disabled={isSubmitting || !appointmentTypeId || !date || !time}
                  className="w-full"
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
