import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Stethoscope, User, Heart, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PatientIntake() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);
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
    chronic_conditions: '',
    current_medications: '',
    previous_surgeries: '',
    family_history_father: '',
    family_history_mother: '',
    family_history_other: '',
    
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
    if (token) {
      loadTokenData();
    }
  }, [token]);

  const loadTokenData = async () => {
    try {
      // Use edge function to fetch token and patient data securely
      const { data, error } = await supabase.functions.invoke('get-intake-patient', {
        body: { token },
      });

      if (error) {
        console.error('Token validation error:', error);
        setError('שגיאה בטעינת הטופס');
        setLoading(false);
        return;
      }

      if (!data?.valid) {
        setError('הקישור לא תקף או שפג תוקפו');
        setLoading(false);
        return;
      }

      setTokenData(data.tokenData);
      
      if (data.patientData) {
        const patientInfo = data.patientData;
        setPatientData(patientInfo);
        // Pre-fill form with existing patient data
        setFormData(prev => ({
          ...prev,
          first_name: patientInfo.first_name || '',
          last_name: patientInfo.last_name || '',
          id_number: patientInfo.id_number || '',
          date_of_birth: patientInfo.date_of_birth || '',
          gender: patientInfo.gender || '',
          phone: patientInfo.phone || '',
          email: patientInfo.email || '',
          address: patientInfo.address || '',
          city: patientInfo.city || '',
          emergency_contact_name: patientInfo.emergency_contact_name || '',
          emergency_contact_phone: patientInfo.emergency_contact_phone || '',
          insurance_provider: patientInfo.insurance_provider || '',
          insurance_number: patientInfo.insurance_number || '',
          allergies: patientInfo.allergies?.join(', ') || '',
          medical_notes: patientInfo.medical_notes || '',
        }));
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading intake:', err);
      setError('שגיאה בטעינת הטופס');
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consentChecked) {
      toast({ title: 'יש לאשר את ההסכמה', variant: 'destructive' });
      return;
    }

    if (!tokenData?.patient_id) {
      toast({ title: 'שגיאה בטופס', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      // Use edge function to submit intake securely
      const { data, error } = await supabase.functions.invoke('submit-intake', {
        body: { token, formData },
      });

      if (error) {
        console.error('Submit error:', error);
        throw new Error('שגיאה בשליחת הטופס');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'שגיאה בשליחת הטופס');
      }

      // Send notification email to clinic staff
      try {
        await supabase.functions.invoke('notify-intake-complete', {
          body: {
            patientId: data.patientId,
            patientName: data.patientName,
          },
        });
      } catch (notifyError) {
        console.error('Failed to send intake notification:', notifyError);
        // Don't fail the form submission if notification fails
      }

      setSubmitted(true);
      toast({ title: 'הטופס נשלח בהצלחה!' });
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({ title: 'שגיאה בשליחת הטופס', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">הקישור לא תקף</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              אנא פנו למרפאה לקבלת קישור חדש
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">תודה רבה!</h2>
            <p className="text-muted-foreground">
              הטופס נשלח בהצלחה. נתראה בביקור הקרוב!
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              מרפאת ד"ר אנה ברמלי
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Stethoscope className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">טופס קליטה למטופל חדש</h1>
          <p className="text-muted-foreground">מרפאת ד"ר אנה ברמלי</p>
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
                  <Label htmlFor="id_number">תעודת זהות *</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => handleChange('id_number', e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">תאריך לידה *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>מגדר *</Label>
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
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
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
                <Label>איך שמעת עלינו?</Label>
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
                  <Label htmlFor="insurance_provider">קופת חולים</Label>
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
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  placeholder="פניצילין, אספירין, אגוזים..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chronic_conditions">מחלות כרוניות (מופרדות בפסיקים)</Label>
                <Textarea
                  id="chronic_conditions"
                  value={formData.chronic_conditions}
                  onChange={(e) => handleChange('chronic_conditions', e.target.value)}
                  placeholder="סוכרת, יתר לחץ דם..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_medications">תרופות נוכחיות</Label>
                <Textarea
                  id="current_medications"
                  value={formData.current_medications}
                  onChange={(e) => handleChange('current_medications', e.target.value)}
                  placeholder="רשום/י את כל התרופות והתוספים שאת/ה לוקח/ת"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous_surgeries">ניתוחים קודמים</Label>
                <Textarea
                  id="previous_surgeries"
                  value={formData.previous_surgeries}
                  onChange={(e) => handleChange('previous_surgeries', e.target.value)}
                  placeholder="פרט/י ניתוחים שעברת ומתי"
                  rows={2}
                />
              </div>
              <Separator className="my-4" />
              <p className="text-sm font-medium text-muted-foreground mb-3">היסטוריה משפחתית</p>
              <div className="space-y-2">
                <Label htmlFor="family_history_father">אב - מחלות/מצבים רפואיים</Label>
                <Textarea
                  id="family_history_father"
                  value={formData.family_history_father}
                  onChange={(e) => handleChange('family_history_father', e.target.value)}
                  placeholder="סוכרת, לחץ דם, מחלות לב..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family_history_mother">אם - מחלות/מצבים רפואיים</Label>
                <Textarea
                  id="family_history_mother"
                  value={formData.family_history_mother}
                  onChange={(e) => handleChange('family_history_mother', e.target.value)}
                  placeholder="סוכרת, לחץ דם, מחלות לב..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family_history_other">בני משפחה אחרים - מחלות/מצבים רפואיים</Label>
                <Textarea
                  id="family_history_other"
                  value={formData.family_history_other}
                  onChange={(e) => handleChange('family_history_other', e.target.value)}
                  placeholder="אחים, סבים, דודים..."
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
                      <SelectItem value="never">מעולם לא</SelectItem>
                      <SelectItem value="former">בעבר</SelectItem>
                      <SelectItem value="occasional">מדי פעם</SelectItem>
                      <SelectItem value="regular">באופן קבוע</SelectItem>
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
                      <SelectItem value="never">בכלל לא</SelectItem>
                      <SelectItem value="occasional">לעיתים נדירות</SelectItem>
                      <SelectItem value="moderate">בצורה מתונה</SelectItem>
                      <SelectItem value="frequent">באופן תדיר</SelectItem>
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
                      <SelectItem value="none">לא מתאמן/ת</SelectItem>
                      <SelectItem value="occasional">1-2 פעמים בשבוע</SelectItem>
                      <SelectItem value="regular">3-4 פעמים בשבוע</SelectItem>
                      <SelectItem value="daily">כמעט כל יום</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep_hours">שעות שינה בלילה</Label>
                  <Input
                    id="sleep_hours"
                    type="number"
                    min="1"
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
                <Label htmlFor="main_complaint">תלונה עיקרית / סיבת הביקור *</Label>
                <Textarea
                  id="main_complaint"
                  value={formData.main_complaint}
                  onChange={(e) => handleChange('main_complaint', e.target.value)}
                  placeholder="תאר/י את הבעיה או הסיבה לביקור"
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
                  placeholder="לדוגמה: שבועיים, חודש, שנה..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous_treatments">טיפולים קודמים לבעיה זו</Label>
                <Textarea
                  id="previous_treatments"
                  value={formData.previous_treatments}
                  onChange={(e) => handleChange('previous_treatments', e.target.value)}
                  placeholder="האם קיבלת טיפול לבעיה זו בעבר? אם כן, פרט/י"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment_goals">ציפיות מהטיפול</Label>
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
              <CardTitle>העדפות תקשורת</CardTitle>
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
                      <SelectItem value="whatsapp">וואטסאפ</SelectItem>
                      <SelectItem value="email">אימייל</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>זמן מועדף ליצירת קשר</Label>
                  <Select value={formData.preferred_contact_time} onValueChange={(v) => handleChange('preferred_contact_time', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר/י" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">בוקר (8:00-12:00)</SelectItem>
                      <SelectItem value="afternoon">צהריים (12:00-16:00)</SelectItem>
                      <SelectItem value="evening">ערב (16:00-20:00)</SelectItem>
                      <SelectItem value="anytime">כל זמן</SelectItem>
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
                  placeholder="משהו נוסף שחשוב שנדע?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader>
              <CardTitle>הסכמה ואישור</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                />
                <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  אני מאשר/ת כי המידע שמסרתי נכון ומדויק. אני מסכים/ה לשמירת ועיבוד המידע הרפואי שלי למטרות טיפול רפואי בהתאם לחוק הגנת הפרטיות.
                </label>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                שולח...
              </>
            ) : (
              'שלח טופס'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
