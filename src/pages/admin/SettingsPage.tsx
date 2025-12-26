import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Settings, Building, Clock, Users, Bell, Plus, Trash2, Play, HelpCircle, RotateCcw } from 'lucide-react';
import { useOnboarding } from '@/components/tutorial/OnboardingTutorial';
import { FullAppTour } from '@/components/tutorial/FullAppTour';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReminderSchedule {
  id: string;
  hours_before: number;
  send_whatsapp: boolean;
  send_email: boolean;
  is_active: boolean;
}

interface DaySchedule {
  day: string;
  defaultOpen: string;
  defaultClose: string;
  defaultClosed: boolean;
}

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

function DayScheduleRow({ day, defaultOpen, defaultClose, defaultClosed }: DaySchedule) {
  const [isClosed, setIsClosed] = useState(defaultClosed);
  const [openTime, setOpenTime] = useState(defaultOpen);
  const [closeTime, setCloseTime] = useState(defaultClose);
  
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 font-medium">{day}</span>
      <label className="flex items-center gap-2 min-w-[80px]">
        <Switch
          checked={!isClosed}
          onCheckedChange={(checked) => setIsClosed(!checked)}
        />
        <span className="text-sm">{isClosed ? 'סגור' : 'פתוח'}</span>
      </label>
      {!isClosed && (
        <>
          <TimeSelect value={openTime} onChange={setOpenTime} />
          <span>עד</span>
          <TimeSelect value={closeTime} onChange={setCloseTime} />
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newHours, setNewHours] = useState('');
  const { resetOnboarding } = useOnboarding();
  const [showTutorial, setShowTutorial] = useState(false);

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

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">הגדרות</h1>
          <p className="text-muted-foreground">הגדרות המרפאה והמערכת</p>
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
              פרטי המרפאה
            </CardTitle>
            <CardDescription>מידע בסיסי על המרפאה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clinic_name">שם המרפאה</Label>
                <Input id="clinic_name" defaultValue="מרפאת ד״ר אנה ברמלי" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_phone">טלפון</Label>
                <Input id="clinic_phone" defaultValue="+972-XXX-XXXXXX" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_email">אימייל</Label>
                <Input id="clinic_email" type="email" defaultValue="clinic@example.com" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_address">כתובת</Label>
                <Input id="clinic_address" defaultValue="רחוב הרופאים 1, תל אביב" />
              </div>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">שמור שינויים</Button>
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
              <DayScheduleRow key="sunday" day="ראשון" defaultOpen="08:00" defaultClose="18:00" defaultClosed={false} />
              <DayScheduleRow key="monday" day="שני" defaultOpen="08:00" defaultClose="18:00" defaultClosed={false} />
              <DayScheduleRow key="tuesday" day="שלישי" defaultOpen="08:00" defaultClose="18:00" defaultClosed={false} />
              <DayScheduleRow key="wednesday" day="רביעי" defaultOpen="08:00" defaultClose="18:00" defaultClosed={false} />
              <DayScheduleRow key="thursday" day="חמישי" defaultOpen="08:00" defaultClose="14:00" defaultClosed={false} />
              <DayScheduleRow key="friday" day="שישי" defaultOpen="08:00" defaultClose="13:00" defaultClosed={true} />
              <DayScheduleRow key="saturday" day="שבת" defaultOpen="08:00" defaultClose="18:00" defaultClosed={true} />
            </div>
            <Separator className="my-4" />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">שמור שינויים</Button>
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
