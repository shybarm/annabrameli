import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePatient, useUpdatePatient } from '@/hooks/usePatients';
import { usePatientAppointments } from '@/hooks/useAppointments';
import { usePatientInvoices } from '@/hooks/useInvoices';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowRight, User, Phone, Mail, Calendar, CreditCard, 
  FileText, Edit, Save, X, MessageCircle, Upload, File, Pill, Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: patient, isLoading } = usePatient(id);
  const { data: appointments } = usePatientAppointments(id);
  const { data: invoices } = usePatientInvoices(id);
  const updatePatient = useUpdatePatient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');

  // Fetch patient documents
  const { data: documents } = useQuery({
    queryKey: ['patient-documents', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleEdit = () => {
    setEditData(patient);
    setMedicalNotes(patient?.medical_notes || '');
    setAllergiesInput(patient?.allergies?.join(', ') || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData || !id) return;
    await updatePatient.mutateAsync({ id, ...editData });
    setIsEditing(false);
  };

  const handleSaveMedicalNotes = async () => {
    if (!id) return;
    const allergiesArray = allergiesInput.split(',').map(a => a.trim()).filter(Boolean);
    await updatePatient.mutateAsync({ 
      id, 
      first_name: patient?.first_name || '',
      last_name: patient?.last_name || '',
      medical_notes: medicalNotes,
      allergies: allergiesArray.length > 0 ? allergiesArray : undefined,
    });
    toast({ title: 'הערות רפואיות נשמרו' });
  };

  const handleWhatsApp = () => {
    if (!patient?.phone) return;
    const phone = patient.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`שלום ${patient.first_name}, זו הודעה מהמרפאה של ד"ר אנה ברמלי.`);
    window.open(`https://wa.me/972${phone.slice(-9)}?text=${message}`, '_blank');
  };

  const uploadFile = async (file: File) => {
    if (!id) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: id,
          title: file.name,
          file_path: filePath,
          document_type: file.type.includes('image') ? 'image' : 'document',
          mime_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['patient-documents', id] });
      toast({ title: 'הקובץ הועלה בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה בהעלאת הקובץ', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">מטופל לא נמצא</p>
          <Button variant="link" onClick={() => navigate('/admin/patients')}>
            חזור לרשימת המטופלים
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/patients')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl">
                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {patient.first_name} {patient.last_name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {patient.id_number && <span>ת.ז: {patient.id_number}</span>}
                  <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                    {patient.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {patient.phone && (
              <Button variant="outline" onClick={handleWhatsApp}>
                <MessageCircle className="h-4 w-4 ml-2" />
                WhatsApp
              </Button>
            )}
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate(`/admin/appointments/new?patient=${id}`)}>
              <Calendar className="h-4 w-4 ml-2" />
              קבע תור
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="info">פרטים אישיים</TabsTrigger>
            <TabsTrigger value="visits">סיכומי ביקורים</TabsTrigger>
            <TabsTrigger value="appointments">תורים ({appointments?.length || 0})</TabsTrigger>
            <TabsTrigger value="billing">חיוב ({invoices?.length || 0})</TabsTrigger>
            <TabsTrigger value="documents">מסמכים ({documents?.length || 0})</TabsTrigger>
            <TabsTrigger value="notes">הערות ותרופות</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>פרטים אישיים</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 ml-2" />
                    עריכה
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSave} disabled={updatePatient.isPending}>
                      <Save className="h-4 w-4 ml-2" />
                      שמור
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>שם פרטי</Label>
                      <Input 
                        value={editData?.first_name || ''} 
                        onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>שם משפחה</Label>
                      <Input 
                        value={editData?.last_name || ''} 
                        onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>תעודת זהות</Label>
                      <Input 
                        value={editData?.id_number || ''} 
                        onChange={(e) => setEditData({...editData, id_number: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>טלפון</Label>
                      <Input 
                        value={editData?.phone || ''} 
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>אימייל</Label>
                      <Input 
                        value={editData?.email || ''} 
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        type="email"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>תאריך לידה</Label>
                      <Input 
                        value={editData?.date_of_birth || ''} 
                        onChange={(e) => setEditData({...editData, date_of_birth: e.target.value})}
                        type="date"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>כתובת</Label>
                      <Input 
                        value={editData?.address || ''} 
                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem icon={User} label="שם מלא" value={`${patient.first_name} ${patient.last_name}`} />
                    <InfoItem icon={FileText} label="ת.ז" value={patient.id_number || '-'} />
                    <InfoItem icon={Phone} label="טלפון" value={patient.phone || '-'} dir="ltr" />
                    <InfoItem icon={Mail} label="אימייל" value={patient.email || '-'} />
                    <InfoItem icon={Calendar} label="תאריך לידה" value={patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy') : '-'} />
                    <InfoItem icon={User} label="מגדר" value={patient.gender === 'male' ? 'זכר' : patient.gender === 'female' ? 'נקבה' : '-'} />
                    <InfoItem icon={FileText} label="כתובת" value={patient.address || '-'} />
                    <InfoItem icon={FileText} label="עיר" value={patient.city || '-'} />
                    <InfoItem icon={CreditCard} label="ביטוח" value={patient.insurance_provider || '-'} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>איש קשר לחירום</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoItem icon={User} label="שם" value={patient.emergency_contact_name || '-'} />
                  <InfoItem icon={Phone} label="טלפון" value={patient.emergency_contact_phone || '-'} dir="ltr" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visit Summaries Tab */}
          <TabsContent value="visits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  סיכומי ביקורים
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments && appointments.filter(a => a.internal_notes).length > 0 ? (
                  <div className="space-y-4">
                    {appointments
                      .filter(apt => apt.internal_notes)
                      .map((apt) => (
                        <div 
                          key={apt.id}
                          className="p-4 rounded-lg border bg-card cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">{apt.appointment_types?.name_he || 'ביקור'}</p>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(apt.scheduled_at), 'dd/MM/yyyy', { locale: he })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {apt.internal_notes}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Stethoscope className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">אין סיכומי ביקורים</p>
                    <p className="text-sm text-muted-foreground">סיכומי ביקורים יופיעו כאן לאחר שיתווספו בדף התור</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>היסטוריית תורים</CardTitle>
                <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate(`/admin/appointments/new?patient=${id}`)}>
                  <Calendar className="h-4 w-4 ml-2" />
                  תור חדש
                </Button>
              </CardHeader>
              <CardContent>
                {appointments && appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div 
                        key={apt.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                        onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                      >
                        <div>
                          <p className="font-medium">{apt.appointment_types?.name_he || 'ביקור'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.scheduled_at), 'EEEE, d בMMMM yyyy בשעה HH:mm', { locale: he })}
                          </p>
                        </div>
                        <Badge>{apt.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">אין תורים</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>חשבוניות</CardTitle>
                <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate(`/admin/billing/new?patient=${id}`)}>
                  <CreditCard className="h-4 w-4 ml-2" />
                  חשבונית חדשה
                </Button>
              </CardHeader>
              <CardContent>
                {invoices && invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium font-mono">{inv.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(inv.created_at), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold">₪{Number(inv.total).toLocaleString()}</p>
                          <Badge>{inv.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">אין חשבוניות</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>מסמכים</CardTitle>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 ml-2" />
                  {isUploading ? 'מעלה...' : 'העלה קובץ'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50">
                        <File className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">אין מסמכים</p>
                    <p className="text-sm text-muted-foreground">לחץ על "העלה קובץ" כדי להוסיף מסמכים</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-4">
              {/* Allergies Card */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Pill className="h-5 w-5" />
                    אלרגיות ורגישויות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>אלרגיות (מופרדות בפסיקים)</Label>
                    <Input
                      value={allergiesInput || patient.allergies?.join(', ') || ''}
                      onChange={(e) => setAllergiesInput(e.target.value)}
                      placeholder="פניצילין, אספירין, אגוזים..."
                    />
                    {patient.allergies && patient.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {patient.allergies.map((allergy, idx) => (
                          <Badge key={idx} variant="destructive">{allergy}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Medical Notes Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    הערות רפואיות כלליות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={medicalNotes || patient.medical_notes || ''}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="הערות רפואיות כלליות, היסטוריה רפואית, תרופות קבועות..."
                    rows={6}
                  />
                  <Button 
                    className="bg-primary text-primary-foreground" 
                    onClick={handleSaveMedicalNotes}
                    disabled={updatePatient.isPending}
                  >
                    <Save className="h-4 w-4 ml-2" />
                    שמור הערות
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function InfoItem({ icon: Icon, label, value, dir }: { 
  icon: any; 
  label: string; 
  value: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-medium ${dir === 'ltr' ? 'dir-ltr text-left' : ''}`} dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}