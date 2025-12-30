import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreatePatient, useFindExistingPatient, normalizePhoneForStorage } from '@/hooks/usePatients';
import { ArrowRight, Save } from 'lucide-react';
import { useClinicContext } from '@/contexts/ClinicContext';
import { toast } from '@/hooks/use-toast';

export default function NewPatient() {
  const navigate = useNavigate();
  const { selectedClinicId } = useClinicContext();
  const createPatient = useCreatePatient();
  const findExistingPatient = useFindExistingPatient();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    id_number: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    insurance_provider: '',
    insurance_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    allergies: '',
    consent_signed: false,
    gdpr_consent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone is provided
    if (!formData.phone.trim()) {
      toast({ title: 'שגיאה', description: 'טלפון הוא שדה חובה', variant: 'destructive' });
      return;
    }

    const normalizedPhone = normalizePhoneForStorage(formData.phone);
    
    // Check for existing patient by clinic_id + normalized phone
    if (selectedClinicId) {
      const existingPatient = await findExistingPatient(selectedClinicId, normalizedPhone);
      if (existingPatient) {
        toast({ 
          title: 'מטופל קיים', 
          description: 'נמצא מטופל עם מספר טלפון זה. מעביר לכרטיס המטופל.',
        });
        navigate(`/admin/patients/${existingPatient.id}`);
        return;
      }
    }
    
    const allergiesArray = formData.allergies
      ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean)
      : undefined;

    await createPatient.mutateAsync({
      first_name: formData.first_name,
      last_name: formData.last_name || undefined,
      id_number: formData.id_number || undefined,
      date_of_birth: formData.date_of_birth || undefined,
      gender: formData.gender || undefined,
      phone: normalizedPhone,
      email: formData.email || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      insurance_provider: formData.insurance_provider || undefined,
      insurance_number: formData.insurance_number || undefined,
      emergency_contact_name: formData.emergency_contact_name || undefined,
      emergency_contact_phone: formData.emergency_contact_phone || undefined,
      medical_notes: formData.medical_notes || undefined,
      allergies: allergiesArray,
      clinic_id: selectedClinicId || undefined,
    });

    navigate('/admin/patients');
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/patients')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">מטופל חדש</h1>
            <p className="text-muted-foreground">הוספת מטופל חדש למערכת</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>פרטים אישיים</CardTitle>
              <CardDescription>מידע בסיסי על המטופל</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">שם פרטי *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">שם משפחה *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_number">תעודת זהות</Label>
                <Input
                  id="id_number"
                  value={formData.id_number}
                  onChange={(e) => updateField('id_number', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">תאריך לידה</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">מין</Label>
                <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מין" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">זכר</SelectItem>
                    <SelectItem value="female">נקבה</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>פרטי התקשרות</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  dir="ltr"
                  placeholder="050-1234567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">עיר</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Insurance */}
          <Card>
            <CardHeader>
              <CardTitle>ביטוח</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insurance_provider">קופת חולים / ביטוח</Label>
                <Select value={formData.insurance_provider} onValueChange={(v) => updateField('insurance_provider', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קופה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clalit">כללית</SelectItem>
                    <SelectItem value="maccabi">מכבי</SelectItem>
                    <SelectItem value="meuhedet">מאוחדת</SelectItem>
                    <SelectItem value="leumit">לאומית</SelectItem>
                    <SelectItem value="private">ביטוח פרטי</SelectItem>
                    <SelectItem value="none">ללא ביטוח</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_number">מספר מבוטח</Label>
                <Input
                  id="insurance_number"
                  value={formData.insurance_number}
                  onChange={(e) => updateField('insurance_number', e.target.value)}
                  dir="ltr"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>איש קשר לחירום</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">שם</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => updateField('emergency_contact_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">טלפון</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
                  dir="ltr"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Info */}
          <Card>
            <CardHeader>
              <CardTitle>מידע רפואי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">אלרגיות ידועות</Label>
                <Input
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  placeholder="הפרד באמצעות פסיקים: בוטנים, חלב, ביצים..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_notes">הערות רפואיות</Label>
                <Textarea
                  id="medical_notes"
                  value={formData.medical_notes}
                  onChange={(e) => updateField('medical_notes', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader>
              <CardTitle>הסכמות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="consent_signed"
                  checked={formData.consent_signed}
                  onCheckedChange={(checked) => updateField('consent_signed', !!checked)}
                />
                <Label htmlFor="consent_signed" className="cursor-pointer">
                  המטופל חתם על טופס הסכמה לטיפול
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="gdpr_consent"
                  checked={formData.gdpr_consent}
                  onCheckedChange={(checked) => updateField('gdpr_consent', !!checked)}
                />
                <Label htmlFor="gdpr_consent" className="cursor-pointer">
                  המטופל אישר שמירת מידע אישי בהתאם לתקנות הפרטיות
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/patients')}>
              ביטול
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={createPatient.isPending}>
              <Save className="h-4 w-4 ml-2" />
              {createPatient.isPending ? 'שומר...' : 'שמור מטופל'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
