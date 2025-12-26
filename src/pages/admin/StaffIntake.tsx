import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, User, Heart, FileText, Save, Loader2 } from 'lucide-react';

export default function StaffIntake() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const appointmentId = searchParams.get('appointment');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Info
    first_name: '',
    last_name: '',
    id_number: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    occupation: '',
    marital_status: '',
    num_children: '',
    referral_source: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    
    // Insurance
    insurance_provider: '',
    insurance_number: '',
    
    // Medical History
    allergies: '',
    allergy_reaction_type: '',
    allergy_severity: '',
    chronic_conditions: '',
    current_medications: '',
    previous_surgeries: '',
    family_medical_history: '',
    
    // Lifestyle
    smoking_status: '',
    alcohol_consumption: '',
    exercise_frequency: '',
    sleep_hours: '',
    stress_level: '',
    
    // Current Complaint
    main_complaint: '',
    symptoms_duration: '',
    previous_treatments: '',
    treatment_goals: '',
    
    // Preferences
    preferred_contact_method: '',
    preferred_contact_time: '',
    medical_notes: '',
  });

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    } else {
      setLoading(false);
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;

      if (data) {
        setPatientData(data);
        setFormData(prev => ({
          ...prev,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          id_number: data.id_number || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          occupation: data.occupation || '',
          marital_status: data.marital_status || '',
          num_children: data.num_children?.toString() || '',
          referral_source: data.referral_source || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          insurance_provider: data.insurance_provider || '',
          insurance_number: data.insurance_number || '',
          allergies: data.allergies?.join(', ') || '',
          allergy_reaction_type: data.allergy_reaction_type || '',
          allergy_severity: data.allergy_severity || '',
          chronic_conditions: data.chronic_conditions?.join(', ') || '',
          current_medications: data.current_medications || '',
          previous_surgeries: data.previous_surgeries || '',
          family_medical_history: data.family_medical_history || '',
          smoking_status: data.smoking_status || '',
          alcohol_consumption: data.alcohol_consumption || '',
          exercise_frequency: data.exercise_frequency || '',
          sleep_hours: data.sleep_hours?.toString() || '',
          stress_level: data.stress_level || '',
          main_complaint: data.main_complaint || '',
          symptoms_duration: data.symptoms_duration || '',
          previous_treatments: data.previous_treatments || '',
          treatment_goals: data.treatment_goals || '',
          preferred_contact_method: data.preferred_contact_method || '',
          preferred_contact_time: data.preferred_contact_time || '',
          medical_notes: data.medical_notes || '',
        }));
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading patient:', err);
      toast({ title: 'שגיאה בטעינת נתוני המטופל', variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      toast({ title: 'שגיאה - לא נמצא מטופל', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      // Process arrays
      const allergiesArray = formData.allergies
        ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
        : null;
      const chronicArray = formData.chronic_conditions
        ? formData.chronic_conditions.split(',').map(c => c.trim()).filter(Boolean)
        : null;

      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        id_number: formData.id_number || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city || null,
        occupation: formData.occupation || null,
        marital_status: formData.marital_status || null,
        num_children: formData.num_children ? parseInt(formData.num_children) : null,
        referral_source: formData.referral_source || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_number: formData.insurance_number || null,
        allergies: allergiesArray,
        allergy_reaction_type: formData.allergy_reaction_type || null,
        allergy_severity: formData.allergy_severity || null,
        chronic_conditions: chronicArray,
        current_medications: formData.current_medications || null,
        previous_surgeries: formData.previous_surgeries || null,
        family_medical_history: formData.family_medical_history || null,
        smoking_status: formData.smoking_status || null,
        alcohol_consumption: formData.alcohol_consumption || null,
        exercise_frequency: formData.exercise_frequency || null,
        sleep_hours: formData.sleep_hours ? parseInt(formData.sleep_hours) : null,
        stress_level: formData.stress_level || null,
        main_complaint: formData.main_complaint || null,
        symptoms_duration: formData.symptoms_duration || null,
        previous_treatments: formData.previous_treatments || null,
        treatment_goals: formData.treatment_goals || null,
        preferred_contact_method: formData.preferred_contact_method || null,
        preferred_contact_time: formData.preferred_contact_time || null,
        medical_notes: formData.medical_notes || null,
        intake_completed_at: new Date().toISOString(),
        consent_signed: consentChecked,
        consent_signed_at: consentChecked ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId);

      if (error) throw error;

      toast({ title: 'טופס הקליטה נשמר בהצלחה!' });
      
      // Navigate back
      if (appointmentId) {
        navigate(`/admin/appointments/${appointmentId}`);
      } else {
        navigate(`/admin/patients/${patientId}`);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({ title: 'שגיאה בשמירת הטופס', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => appointmentId ? navigate(`/admin/appointments/${appointmentId}`) : navigate(-1)}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">מילוי טופס קליטה</h1>
            {patientData && (
              <p className="text-muted-foreground">
                {patientData.first_name} {patientData.last_name}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                פרטים אישיים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">שם פרטי *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">שם משפחה *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_number">תעודת זהות</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => handleChange('id_number', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">תאריך לידה</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מגדר</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">זכר</SelectItem>
                      <SelectItem value="female">נקבה</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מצב משפחתי</Label>
                  <Select value={formData.marital_status} onValueChange={(v) => handleChange('marital_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">רווק/ה</SelectItem>
                      <SelectItem value="married">נשוי/ה</SelectItem>
                      <SelectItem value="divorced">גרוש/ה</SelectItem>
                      <SelectItem value="widowed">אלמן/ה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num_children">מספר ילדים</Label>
                  <Input
                    id="num_children"
                    type="number"
                    min="0"
                    value={formData.num_children}
                    onChange={(e) => handleChange('num_children', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">מקצוע</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleChange('occupation', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">עיר</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>איך שמע/ה עלינו?</Label>
                <Select value={formData.referral_source} onValueChange={(v) => handleChange('referral_source', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר/י" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friend">חבר/משפחה</SelectItem>
                    <SelectItem value="google">חיפוש בגוגל</SelectItem>
                    <SelectItem value="social">רשתות חברתיות</SelectItem>
                    <SelectItem value="doctor">הפניה מרופא</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact & Insurance */}
          <Card>
            <CardHeader>
              <CardTitle>איש קשר לחירום וביטוח</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">שם איש קשר לחירום</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">טלפון איש קשר</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>קופת חולים</Label>
                  <Select value={formData.insurance_provider} onValueChange={(v) => handleChange('insurance_provider', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clalit">כללית</SelectItem>
                      <SelectItem value="maccabi">מכבי</SelectItem>
                      <SelectItem value="meuhedet">מאוחדת</SelectItem>
                      <SelectItem value="leumit">לאומית</SelectItem>
                      <SelectItem value="private">פרטי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_number">מספר מבוטח</Label>
                  <Input
                    id="insurance_number"
                    value={formData.insurance_number}
                    onChange={(e) => handleChange('insurance_number', e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                היסטוריה רפואית
              </CardTitle>
              <CardDescription>מידע חשוב לטיפול בטוח ויעיל</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">אלרגיות ורגישויות (מופרדות בפסיקים)</Label>
                <Input
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  placeholder="לדוגמה: פניצילין, אגוזים, אבק"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>סוג תגובה</Label>
                  <Select value={formData.allergy_reaction_type} onValueChange={(v) => handleChange('allergy_reaction_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skin">עורית (פריחה, גרד)</SelectItem>
                      <SelectItem value="respiratory">נשימתית (קוצר נשימה, נזלת)</SelectItem>
                      <SelectItem value="digestive">עיכולית (בחילות, הקאות)</SelectItem>
                      <SelectItem value="anaphylactic">אנפילקטית (תגובה חמורה)</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>חומרת התגובה</Label>
                  <Select value={formData.allergy_severity} onValueChange={(v) => handleChange('allergy_severity', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">קל</SelectItem>
                      <SelectItem value="moderate">בינוני</SelectItem>
                      <SelectItem value="severe">קשה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chronic_conditions">מחלות כרוניות (מופרד בפסיקים)</Label>
                <Input
                  id="chronic_conditions"
                  value={formData.chronic_conditions}
                  onChange={(e) => handleChange('chronic_conditions', e.target.value)}
                  placeholder="לדוגמה: סוכרת, לחץ דם גבוה"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_medications">תרופות נוכחיות</Label>
                <Textarea
                  id="current_medications"
                  value={formData.current_medications}
                  onChange={(e) => handleChange('current_medications', e.target.value)}
                  placeholder="פרט/י את התרופות שאת/ה לוקח/ת כעת"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous_surgeries">ניתוחים קודמים</Label>
                <Textarea
                  id="previous_surgeries"
                  value={formData.previous_surgeries}
                  onChange={(e) => handleChange('previous_surgeries', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family_medical_history">היסטוריה רפואית משפחתית</Label>
                <Textarea
                  id="family_medical_history"
                  value={formData.family_medical_history}
                  onChange={(e) => handleChange('family_medical_history', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lifestyle */}
          <Card>
            <CardHeader>
              <CardTitle>אורח חיים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>עישון</Label>
                  <Select value={formData.smoking_status} onValueChange={(v) => handleChange('smoking_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">לא מעשן/ת</SelectItem>
                      <SelectItem value="former">לשעבר</SelectItem>
                      <SelectItem value="occasional">מדי פעם</SelectItem>
                      <SelectItem value="regular">מעשן/ת קבוע</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>צריכת אלכוהול</Label>
                  <Select value={formData.alcohol_consumption} onValueChange={(v) => handleChange('alcohol_consumption', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">לא שותה</SelectItem>
                      <SelectItem value="occasional">מדי פעם</SelectItem>
                      <SelectItem value="moderate">מתון</SelectItem>
                      <SelectItem value="heavy">רב</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>פעילות גופנית</Label>
                  <Select value={formData.exercise_frequency} onValueChange={(v) => handleChange('exercise_frequency', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">לא פעיל/ה</SelectItem>
                      <SelectItem value="occasional">1-2 בשבוע</SelectItem>
                      <SelectItem value="regular">3-4 בשבוע</SelectItem>
                      <SelectItem value="daily">כל יום</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep_hours">שעות שינה ממוצעות</Label>
                  <Input
                    id="sleep_hours"
                    type="number"
                    min="0"
                    max="24"
                    value={formData.sleep_hours}
                    onChange={(e) => handleChange('sleep_hours', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>רמת מתח</Label>
                  <Select value={formData.stress_level} onValueChange={(v) => handleChange('stress_level', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">נמוכה</SelectItem>
                      <SelectItem value="moderate">בינונית</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                      <SelectItem value="very_high">גבוהה מאוד</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Complaint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                סיבת הפנייה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="main_complaint">תלונה עיקרית *</Label>
                <Textarea
                  id="main_complaint"
                  value={formData.main_complaint}
                  onChange={(e) => handleChange('main_complaint', e.target.value)}
                  placeholder="תאר/י את הסיבה העיקרית לפנייתך"
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms_duration">משך התסמינים</Label>
                <Input
                  id="symptoms_duration"
                  value={formData.symptoms_duration}
                  onChange={(e) => handleChange('symptoms_duration', e.target.value)}
                  placeholder="מתי התחילו התסמינים?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous_treatments">טיפולים קודמים</Label>
                <Textarea
                  id="previous_treatments"
                  value={formData.previous_treatments}
                  onChange={(e) => handleChange('previous_treatments', e.target.value)}
                  placeholder="האם קיבלת טיפולים קודמים לבעיה זו?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment_goals">מטרות הטיפול</Label>
                <Textarea
                  id="treatment_goals"
                  value={formData.treatment_goals}
                  onChange={(e) => handleChange('treatment_goals', e.target.value)}
                  placeholder="מה את/ה מצפה להשיג מהטיפול?"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>העדפות קשר</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>דרך יצירת קשר מועדפת</Label>
                  <Select value={formData.preferred_contact_method} onValueChange={(v) => handleChange('preferred_contact_method', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">טלפון</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">אימייל</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>שעות מועדפות לקשר</Label>
                  <Select value={formData.preferred_contact_time} onValueChange={(v) => handleChange('preferred_contact_time', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">בוקר (8:00-12:00)</SelectItem>
                      <SelectItem value="afternoon">צהריים (12:00-17:00)</SelectItem>
                      <SelectItem value="evening">ערב (17:00-20:00)</SelectItem>
                      <SelectItem value="anytime">כל שעה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_notes">הערות נוספות</Label>
                <Textarea
                  id="medical_notes"
                  value={formData.medical_notes}
                  onChange={(e) => handleChange('medical_notes', e.target.value)}
                  placeholder="כל מידע נוסף שחשוב לך לשתף"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked === true)}
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  המטופל/ת מאשר/ת את נכונות הפרטים ומסכים/ה לקבלת טיפול ושמירת המידע הרפואי במערכת המרפאה.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => appointmentId ? navigate(`/admin/appointments/${appointmentId}`) : navigate(-1)}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  שמור טופס קליטה
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
