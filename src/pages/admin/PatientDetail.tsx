import { useState } from 'react';
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
import { 
  ArrowRight, User, Phone, Mail, Calendar, CreditCard, 
  FileText, Edit, Save, X, MessageCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patient, isLoading } = usePatient(id);
  const { data: appointments } = usePatientAppointments(id);
  const { data: invoices } = usePatientInvoices(id);
  const updatePatient = useUpdatePatient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const handleEdit = () => {
    setEditData(patient);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData || !id) return;
    await updatePatient.mutateAsync({ id, ...editData });
    setIsEditing(false);
  };

  const handleWhatsApp = () => {
    if (!patient?.phone) return;
    const phone = patient.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`שלום ${patient.first_name}, זו הודעה מהמרפאה של ד"ר אנה ברמלי.`);
    window.open(`https://wa.me/972${phone.slice(-9)}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600" />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/patients')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-medical-100 text-medical-700 font-bold text-xl">
                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
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
            <Button onClick={() => navigate(`/admin/appointments/new?patient=${id}`)}>
              <Calendar className="h-4 w-4 ml-2" />
              קבע תור
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">פרטים אישיים</TabsTrigger>
            <TabsTrigger value="appointments">תורים ({appointments?.length || 0})</TabsTrigger>
            <TabsTrigger value="billing">חיוב ({invoices?.length || 0})</TabsTrigger>
            <TabsTrigger value="documents">מסמכים</TabsTrigger>
            <TabsTrigger value="notes">הערות רפואיות</TabsTrigger>
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
                    <Button size="sm" onClick={handleSave} disabled={updatePatient.isPending}>
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

          <TabsContent value="appointments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>היסטוריית תורים</CardTitle>
                <Button size="sm" onClick={() => navigate(`/admin/appointments/new?patient=${id}`)}>
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
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
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
                <Button size="sm" onClick={() => navigate(`/admin/billing/new?patient=${id}`)}>
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
              <CardHeader>
                <CardTitle>מסמכים</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">אין מסמכים</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>הערות רפואיות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>אלרגיות</Label>
                    <p className="mt-1 text-sm bg-red-50 p-3 rounded-lg text-red-700">
                      {patient.allergies?.join(', ') || 'לא ידוע'}
                    </p>
                  </div>
                  <div>
                    <Label>הערות רפואיות</Label>
                    <Textarea 
                      className="mt-1" 
                      value={patient.medical_notes || ''} 
                      readOnly
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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