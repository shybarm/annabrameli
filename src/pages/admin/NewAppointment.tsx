import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAppointment, useAppointmentTypes } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useClinics } from '@/hooks/useClinics';
import { useSendAppointmentConfirmation } from '@/hooks/useAppointmentConfirmation';
import { ArrowRight, Save, Search, MapPin, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useClinicContext } from '@/contexts/ClinicContext';

export default function NewAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedClinicId } = useClinicContext();
  const createAppointment = useCreateAppointment();
  const sendConfirmation = useSendAppointmentConfirmation();
  const { data: appointmentTypes } = useAppointmentTypes();
  const { data: clinics } = useClinics();
  const [appointmentClinicId, setAppointmentClinicId] = useState<string | undefined>(selectedClinicId || undefined);
  const { data: patients } = usePatients(selectedClinicId);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  
  // Get pre-filled patient/date/time from URL params (from patient context or availability grid)
  const prefilledPatientId = searchParams.get('patient');
  const prefilledDate = searchParams.get('date');
  const prefilledTime = searchParams.get('time');
  
  const [selectedPatientId, setSelectedPatientId] = useState(prefilledPatientId || '');
  
  const [formData, setFormData] = useState({
    appointment_type_id: '',
    date: prefilledDate || format(new Date(), 'yyyy-MM-dd'),
    time: prefilledTime || '09:00',
    duration_minutes: 30,
    notes: '',
  });

  const filteredPatients = patients?.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.first_name.toLowerCase().includes(query) ||
           p.last_name.toLowerCase().includes(query) ||
           p.phone?.includes(query);
  }).slice(0, 10) || [];

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
  const selectedType = appointmentTypes?.find(t => t.id === formData.appointment_type_id);
  const selectedClinic = clinics?.find(c => c.id === appointmentClinicId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId) return;

    const scheduled_at = `${formData.date}T${formData.time}:00`;

    try {
      const appointment = await createAppointment.mutateAsync({
        patient_id: selectedPatientId,
        appointment_type_id: formData.appointment_type_id || undefined,
        clinic_id: appointmentClinicId || undefined,
        scheduled_at,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes || undefined,
      });

      // Send confirmation email if enabled and patient has email
      if (sendEmail && selectedPatient?.email && selectedClinic) {
        try {
          await sendConfirmation.mutateAsync({
            appointmentId: appointment.id,
            patientEmail: selectedPatient.email,
            patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
            appointmentDate: scheduled_at,
            appointmentTypeName: selectedType?.name_he || 'ביקור',
            clinicName: selectedClinic.name,
            clinicAddress: selectedClinic.address || '',
            clinicCity: selectedClinic.city || '',
            clinicPhone: selectedClinic.phone || undefined
          });
        } catch (emailError) {
          // Email error already handled by hook toast, don't block navigation
          console.error('Email sending failed:', emailError);
        }
      }

      navigate('/admin/appointments');
    } catch (error: any) {
      // Error handling is done in the hook, just prevent navigation
      // The hook shows appropriate Hebrew toast messages for SLOT_TAKEN and SLOT_RACE_CONDITION
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/appointments')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">תור חדש</h1>
            <p className="text-muted-foreground">קביעת תור חדש למטופל</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>בחירת מטופל</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedPatient ? (
                <>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חפש מטופל לפי שם או טלפון..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  {searchQuery && (
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              setSearchQuery('');
                            }}
                          >
                            <div>
                              <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                              <p className="text-sm text-muted-foreground">{patient.phone}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          לא נמצאו מטופלים
                        </div>
                      )}
                    </div>
                  )}
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/admin/patients/new')}
                  >
                    הוסף מטופל חדש
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-between p-4 bg-medical-50 rounded-lg border border-medical-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-medical-200 text-medical-700 font-medium">
                      {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatientId('')}>
                    שנה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>פרטי התור</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>סוג הביקור</Label>
                <Select 
                  value={formData.appointment_type_id} 
                  onValueChange={(v) => {
                    const type = appointmentTypes?.find(t => t.id === v);
                    setFormData(prev => ({
                      ...prev,
                      appointment_type_id: v,
                      duration_minutes: type?.duration_minutes || prev.duration_minutes,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג ביקור" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name_he} ({type.duration_minutes} דק׳)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">תאריך</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    dir="ltr"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">שעה</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">משך (דקות)</Label>
                <Select 
                  value={String(formData.duration_minutes)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, duration_minutes: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 דקות</SelectItem>
                    <SelectItem value="20">20 דקות</SelectItem>
                    <SelectItem value="30">30 דקות</SelectItem>
                    <SelectItem value="45">45 דקות</SelectItem>
                    <SelectItem value="60">60 דקות</SelectItem>
                    <SelectItem value="90">90 דקות</SelectItem>
                    <SelectItem value="120">120 דקות</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clinic Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  מרפאה
                </Label>
                <Select 
                  value={appointmentClinicId || 'unassigned'}
                  onValueChange={(v) => setAppointmentClinicId(v === 'unassigned' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מרפאה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">לא משויך</SelectItem>
                    {clinics?.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="הערות לתור..."
                  rows={3}
                />
              </div>

              {/* Send confirmation email checkbox */}
              {selectedPatient?.email && selectedClinic && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox 
                    id="sendEmail" 
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer text-blue-800">
                      <Mail className="h-4 w-4" />
                      שלח אישור תור למטופל
                    </Label>
                    <p className="text-xs text-blue-600 mt-0.5">
                      אימייל עם פרטי התור ואפשרות להוספה ליומן
                    </p>
                  </div>
                </div>
              )}
              {selectedPatient && !selectedPatient.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  למטופל אין כתובת אימייל - לא ניתן לשלוח אישור
                </p>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedPatient && formData.date && formData.time && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <p className="text-green-800">
                  <strong>סיכום:</strong> תור ל{selectedPatient.first_name} {selectedPatient.last_name}{' '}
                  {selectedType && `(${selectedType.name_he})`}{' '}
                  בתאריך {format(new Date(formData.date), 'dd/MM/yyyy')} בשעה {formData.time}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/appointments')}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90" 
              disabled={!selectedPatientId || createAppointment.isPending}
            >
              <Save className="h-4 w-4 ml-2" />
              {createAppointment.isPending ? 'שומר...' : 'קבע תור'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
