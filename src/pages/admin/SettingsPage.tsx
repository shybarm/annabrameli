import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings, Building, Clock, Users, Bell, Plus, Trash2, Play, HelpCircle, RotateCcw, CreditCard, Edit, Save, X, MapPin } from 'lucide-react';
import { useOnboarding } from '@/components/tutorial/OnboardingTutorial';
import { FullAppTour } from '@/components/tutorial/FullAppTour';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAppointmentTypes } from '@/hooks/useAppointments';
import { useClinicContext } from '@/contexts/ClinicContext';
import { useClinic, useUpdateClinic, Clinic } from '@/hooks/useClinics';

interface ReminderSchedule {
  id: string;
  hours_before: number;
  send_whatsapp: boolean;
  send_email: boolean;
  is_active: boolean;
}

type DayName = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

interface WorkingHours {
  sunday?: { open: string; close: string } | null;
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
}

const dayLabels: Record<DayName, string> = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'שבת',
};

// Custom 24-hour time picker component
function TimeSelect({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) {
  const [hours, minutes] = value.split(':').map(Number);
  
  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = e.target.value.padStart(2, '0');
    onChange(`${newHours}:${minutes.toString().padStart(2, '0')}`);
  };
  
  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = e.target.value.padStart(2, '0');
    onChange(`${hours.toString().padStart(2, '0')}:${newMinutes}`);
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`} dir="ltr">
      <select 
        value={hours.toString().padStart(2, '0')}
        onChange={handleHoursChange}
        className="h-10 w-14 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i.toString().padStart(2, '0')}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className="text-lg font-bold">:</span>
      <select 
        value={minutes.toString().padStart(2, '0')}
        onChange={handleMinutesChange}
        className="h-10 w-14 rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {[0, 15, 30, 45].map((m) => (
          <option key={m} value={m.toString().padStart(2, '0')}>
            {m.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newHours, setNewHours] = useState('');
  const { resetOnboarding } = useOnboarding();
  const [showTutorial, setShowTutorial] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  
  // Get current clinic context
  const { selectedClinicId } = useClinicContext();
  const { data: currentClinic, isLoading: loadingClinic } = useClinic(selectedClinicId ?? undefined);
  const updateClinic = useUpdateClinic();
  
  // Form state for clinic settings
  const [clinicForm, setClinicForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    doctor_name: '',
    doctor_license: '',
    doctor_specialty: '',
  });
  
  // Working hours state
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    sunday: { open: '09:00', close: '18:00' },
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '13:00' },
    saturday: null,
  });

  // Update form when clinic data loads
  useEffect(() => {
    if (currentClinic) {
      setClinicForm({
        name: currentClinic.name || '',
        phone: currentClinic.phone || '',
        email: currentClinic.email || '',
        address: currentClinic.address || '',
        doctor_name: currentClinic.doctor_name || '',
        doctor_license: currentClinic.doctor_license || '',
        doctor_specialty: currentClinic.doctor_specialty || '',
      });
      if (currentClinic.working_hours) {
        setWorkingHours(currentClinic.working_hours as WorkingHours);
      }
    }
  }, [currentClinic]);
  
  const { data: appointmentTypes, isLoading: loadingTypes } = useAppointmentTypes();

  // Update appointment type price mutation
  const updatePrice = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase
        .from('appointment_types')
        .update({ price })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      toast({ title: 'המחיר עודכן בהצלחה' });
      setEditingPriceId(null);
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const handleResetTutorial = () => {
    resetOnboarding();
    setShowTutorial(true);
  };

  // Fetch reminder schedules
  const { data: reminders, isLoading: loadingReminders } = useQuery({
    queryKey: ['reminder-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .order('hours_before', { ascending: false });
      if (error) throw error;
      return data as ReminderSchedule[];
    },
  });

  // Update reminder mutation
  const updateReminder = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ReminderSchedule> }) => {
      const { error } = await supabase
        .from('reminder_schedules')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-schedules'] });
      toast({ title: 'התזכורת עודכנה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  // Add reminder mutation
  const addReminder = useMutation({
    mutationFn: async (hours_before: number) => {
      const { error } = await supabase
        .from('reminder_schedules')
        .insert({ hours_before, send_whatsapp: true, send_email: true, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-schedules'] });
      setNewHours('');
      toast({ title: 'התזכורת נוספה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  // Delete reminder mutation
  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminder_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-schedules'] });
      toast({ title: 'התזכורת נמחקה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  // Test reminders
  const testReminders = async () => {
    try {
      toast({ title: 'בודק תזכורות...' });
      const { data, error } = await supabase.functions.invoke('send-appointment-reminders');
      if (error) throw error;
      toast({ 
        title: 'בדיקת תזכורות הסתיימה', 
        description: data.message || 'הבדיקה בוצעה בהצלחה'
      });
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddReminder = () => {
    const hours = parseInt(newHours);
    if (isNaN(hours) || hours <= 0) {
      toast({ title: 'יש להזין מספר חיובי', variant: 'destructive' });
      return;
    }
    if (reminders?.some(r => r.hours_before === hours)) {
      toast({ title: 'כבר קיימת תזכורת לזמן זה', variant: 'destructive' });
      return;
    }
    addReminder.mutate(hours);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${hours * 60} דקות`;
    if (hours === 1) return 'שעה';
    if (hours < 24) return `${hours} שעות`;
    if (hours === 24) return 'יום';
    return `${Math.floor(hours / 24)} ימים`;
  };

  // Save clinic info
  const handleSaveClinicInfo = () => {
    if (!selectedClinicId) return;
    updateClinic.mutate({
      id: selectedClinicId,
      name: clinicForm.name,
      phone: clinicForm.phone || null,
      email: clinicForm.email || null,
      address: clinicForm.address || null,
      doctor_name: clinicForm.doctor_name || null,
      doctor_license: clinicForm.doctor_license || null,
      doctor_specialty: clinicForm.doctor_specialty || null,
    });
  };

  // Save working hours
  const handleSaveWorkingHours = () => {
    if (!selectedClinicId) return;
    updateClinic.mutate({
      id: selectedClinicId,
      working_hours: workingHours,
    });
  };

  // Toggle day open/closed
  const toggleDayOpen = (day: DayName) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: prev[day] ? null : { open: '09:00', close: '18:00' },
    }));
  };

  // Update day hours
  const updateDayHours = (day: DayName, field: 'open' | 'close', value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day], [field]: value } : { open: '09:00', close: '18:00', [field]: value },
    }));
  };

  if (loadingClinic) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">הגדרות</h1>
          <p className="text-muted-foreground">
            הגדרות עבור: <span className="font-medium text-foreground">{currentClinic?.name || 'המרפאה'}</span>
          </p>
        </div>

        {/* Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              תזכורות תורים
            </CardTitle>
            <CardDescription>
              הגדרת תזכורות אוטומטיות בוואטסאפ ובאימייל לפני תורים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingReminders ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {reminders && reminders.length > 0 ? (
                  <div className="space-y-3">
                    {reminders.map((reminder) => (
                      <div 
                        key={reminder.id} 
                        className="flex items-center justify-between p-4 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-medium min-w-[80px]">
                            {formatHours(reminder.hours_before)} לפני
                          </div>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={reminder.send_whatsapp}
                                onCheckedChange={(checked) => 
                                  updateReminder.mutate({ 
                                    id: reminder.id, 
                                    updates: { send_whatsapp: checked } 
                                  })
                                }
                              />
                              WhatsApp
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={reminder.send_email}
                                onCheckedChange={(checked) => 
                                  updateReminder.mutate({ 
                                    id: reminder.id, 
                                    updates: { send_email: checked } 
                                  })
                                }
                              />
                              אימייל
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={reminder.is_active}
                                onCheckedChange={(checked) => 
                                  updateReminder.mutate({ 
                                    id: reminder.id, 
                                    updates: { is_active: checked } 
                                  })
                                }
                              />
                              פעיל
                            </label>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReminder.mutate(reminder.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    אין תזכורות מוגדרות
                  </p>
                )}

                <Separator />

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number"
                      value={newHours}
                      onChange={(e) => setNewHours(e.target.value)}
                      placeholder="שעות לפני"
                      className="w-32"
                      min={1}
                    />
                    <span className="text-muted-foreground">שעות לפני התור</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleAddReminder}
                    disabled={addReminder.isPending}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף תזכורת
                  </Button>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={testReminders}
                    className="w-full sm:w-auto"
                  >
                    <Play className="h-4 w-4 ml-2" />
                    בדוק ושלח תזכורות עכשיו
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    לחץ כדי לשלוח תזכורות לכל התורים הקרובים שעדיין לא קיבלו תזכורת
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Clinic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              פרטי המרפאה והרופא
            </CardTitle>
            <CardDescription>
              מידע בסיסי על המרפאה והרופא (ישמש בסיכומי ביקור להדפסה)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clinic_name">שם המרפאה</Label>
                <Input 
                  id="clinic_name" 
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_phone">טלפון</Label>
                <Input 
                  id="clinic_phone" 
                  value={clinicForm.phone}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, phone: e.target.value }))}
                  dir="ltr" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_email">אימייל</Label>
                <Input 
                  id="clinic_email" 
                  type="email" 
                  value={clinicForm.email}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, email: e.target.value }))}
                  dir="ltr" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_address">כתובת</Label>
                <Input 
                  id="clinic_address" 
                  value={clinicForm.address}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-sm font-medium">פרטי הרופא (לסיכומי ביקור)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doctor_name">שם הרופא</Label>
                <Input 
                  id="doctor_name" 
                  value={clinicForm.doctor_name}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, doctor_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor_license">מספר רישיון</Label>
                <Input 
                  id="doctor_license" 
                  value={clinicForm.doctor_license}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, doctor_license: e.target.value }))}
                  placeholder="לדוגמא: 123456" 
                  dir="ltr" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor_specialty">התמחות</Label>
                <Input 
                  id="doctor_specialty" 
                  value={clinicForm.doctor_specialty}
                  onChange={(e) => setClinicForm(prev => ({ ...prev, doctor_specialty: e.target.value }))}
                />
              </div>
            </div>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSaveClinicInfo}
              disabled={updateClinic.isPending}
            >
              {updateClinic.isPending ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              שעות פעילות
            </CardTitle>
            <CardDescription>הגדרת שעות קבלה (שעון 24 שעות)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(Object.keys(dayLabels) as DayName[]).map((day) => {
                const dayHours = workingHours[day];
                const isOpen = dayHours !== null && dayHours !== undefined;
                
                return (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-20 font-medium">{dayLabels[day]}</span>
                    <label className="flex items-center gap-2 min-w-[80px]">
                      <Switch
                        checked={isOpen}
                        onCheckedChange={() => toggleDayOpen(day)}
                      />
                      <span className="text-sm">{isOpen ? 'פתוח' : 'סגור'}</span>
                    </label>
                    {isOpen && dayHours && (
                      <>
                        <TimeSelect 
                          value={dayHours.open} 
                          onChange={(val) => updateDayHours(day, 'open', val)} 
                        />
                        <span>עד</span>
                        <TimeSelect 
                          value={dayHours.close} 
                          onChange={(val) => updateDayHours(day, 'close', val)} 
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSaveWorkingHours}
              disabled={updateClinic.isPending}
            >
              {updateClinic.isPending ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              הגדרות תורים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buffer">הפסקה בין תורים (דקות)</Label>
                <Input id="buffer" type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_daily">מקסימום תורים ביום</Label>
                <Input id="max_daily" type="number" defaultValue="20" />
              </div>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Treatment Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              מחירון טיפולים
            </CardTitle>
            <CardDescription>עדכון מחירי טיפולים לשימוש בחשבוניות</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTypes ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : appointmentTypes && appointmentTypes.length > 0 ? (
              <div className="space-y-3">
                {appointmentTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{type.name_he}</p>
                      <p className="text-sm text-muted-foreground">{type.duration_minutes} דקות</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingPriceId === type.id ? (
                        <>
                          <Input
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(Number(e.target.value))}
                            className="w-24"
                            dir="ltr"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updatePrice.mutate({ id: type.id, price: editingPrice })}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingPriceId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold">₪{type.price?.toLocaleString() || 0}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingPriceId(type.id);
                              setEditingPrice(type.price || 0);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">אין סוגי טיפולים</p>
            )}
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              צוות המרפאה
            </CardTitle>
            <CardDescription>ניהול משתמשים והרשאות</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              ניהול משתמשי הצוות והרשאות הגישה שלהם למערכת
            </p>
            <Button variant="outline" onClick={() => navigate('/admin/team')}>ניהול צוות</Button>
          </CardContent>
        </Card>

        {/* Help & Tutorial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              עזרה והדרכה
            </CardTitle>
            <CardDescription>הצג את ההדרכה הראשונית מחדש</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              לחץ כאן כדי לאפס ולהציג מחדש את ההדרכה הראשונית של המערכת
            </p>
            <Button 
              variant="outline" 
              onClick={handleResetTutorial}
            >
              <RotateCcw className="h-4 w-4 ml-2" />
              הפעל הדרכה מחדש
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Full App Tour */}
      {showTutorial && (
        <FullAppTour 
          onComplete={() => setShowTutorial(false)} 
        />
      )}
    </AdminLayout>
  );
}
