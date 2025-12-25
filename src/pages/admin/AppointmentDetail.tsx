import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowRight, User, Clock, Calendar, FileText, Save, 
  Upload, MessageCircle, CreditCard, File, Printer, Mail, Pill, Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [internalNotes, setInternalNotes] = useState('');
  const [visitSummary, setVisitSummary] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [medications, setMedications] = useState('');
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch appointment
  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (*),
          appointment_types (*)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setInternalNotes(data.internal_notes || '');
        setVisitSummary(data.visit_summary || '');
        setTreatmentPlan(data.treatment_plan || '');
        setMedications(data.medications || '');
        setStatus(data.status || 'scheduled');
      }
      return data;
    },
    enabled: !!id,
  });

  // Fetch patient documents
  const { data: documents } = useQuery({
    queryKey: ['patient-documents', appointment?.patient_id],
    queryFn: async () => {
      if (!appointment?.patient_id) return [];
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', appointment.patient_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!appointment?.patient_id,
  });

  // Update appointment mutation
  const updateAppointment = useMutation({
    mutationFn: async (updates: { 
      internal_notes?: string; 
      status?: string;
      visit_summary?: string;
      treatment_plan?: string;
      medications?: string;
      visit_completed_at?: string;
      visit_shared_whatsapp_at?: string;
    }) => {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'התור עודכן בהצלחה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  // Upload file mutation
  const uploadFile = async (file: File) => {
    if (!appointment?.patient_id) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${appointment.patient_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: appointment.patient_id,
          title: file.name,
          file_path: filePath,
          document_type: file.type.includes('image') ? 'image' : 'document',
          mime_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['patient-documents', appointment.patient_id] });
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

  const handleWhatsApp = () => {
    if (!appointment?.patients?.phone) return;
    const phone = appointment.patients.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`שלום ${appointment.patients.first_name}, תזכורת לתור שלך בתאריך ${format(new Date(appointment.scheduled_at), 'dd/MM/yyyy')} בשעה ${format(new Date(appointment.scheduled_at), 'HH:mm')}`);
    window.open(`https://wa.me/972${phone.slice(-9)}?text=${message}`, '_blank');
  };

  const handleSaveNotes = () => {
    updateAppointment.mutate({ internal_notes: internalNotes, status });
  };

  const handleSaveVisitSummary = () => {
    const isCompleted = visitSummary.trim() || treatmentPlan.trim() || medications.trim();
    updateAppointment.mutate({ 
      visit_summary: visitSummary, 
      treatment_plan: treatmentPlan,
      medications,
      visit_completed_at: isCompleted ? new Date().toISOString() : undefined,
      status: isCompleted ? 'completed' : status,
    });
  };

  const buildVisitSummaryText = () => {
    const patientName = `${appointment?.patients?.first_name || ''} ${appointment?.patients?.last_name || ''}`.trim();
    const visitDate = appointment?.scheduled_at ? format(new Date(appointment.scheduled_at), 'dd/MM/yyyy', { locale: he }) : '';
    
    let text = `סיכום ביקור - ${patientName}\n`;
    text += `תאריך: ${visitDate}\n\n`;
    
    if (visitSummary.trim()) {
      text += `📋 סיכום הביקור:\n${visitSummary}\n\n`;
    }
    if (treatmentPlan.trim()) {
      text += `🩺 תוכנית טיפול:\n${treatmentPlan}\n\n`;
    }
    if (medications.trim()) {
      text += `💊 תרופות:\n${medications}\n`;
    }
    
    return text;
  };

  const handleShareWhatsApp = () => {
    if (!appointment?.patients?.phone) {
      toast({ title: 'אין מספר טלפון למטופל', variant: 'destructive' });
      return;
    }
    
    const phone = appointment.patients.phone.replace(/\D/g, '');
    const message = encodeURIComponent(buildVisitSummaryText());
    window.open(`https://wa.me/972${phone.slice(-9)}?text=${message}`, '_blank');
    
    // Mark as shared via WhatsApp
    updateAppointment.mutate({ visit_shared_whatsapp_at: new Date().toISOString() });
  };

  const handlePrint = () => {
    const printContent = buildVisitSummaryText();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>סיכום ביקור</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.8;
              }
              h1 { font-size: 24px; margin-bottom: 20px; }
              .section { margin-bottom: 24px; }
              .section-title { font-weight: bold; margin-bottom: 8px; }
              .content { white-space: pre-wrap; }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <h1>סיכום ביקור</h1>
            <p><strong>מטופל:</strong> ${appointment?.patients?.first_name || ''} ${appointment?.patients?.last_name || ''}</p>
            <p><strong>תאריך:</strong> ${appointment?.scheduled_at ? format(new Date(appointment.scheduled_at), 'dd/MM/yyyy', { locale: he }) : ''}</p>
            ${appointment?.patients?.id_number ? `<p><strong>ת.ז:</strong> ${appointment.patients.id_number}</p>` : ''}
            <hr style="margin: 20px 0;" />
            
            ${visitSummary.trim() ? `
              <div class="section">
                <div class="section-title">סיכום הביקור:</div>
                <div class="content">${visitSummary.replace(/\n/g, '<br>')}</div>
              </div>
            ` : ''}
            
            ${treatmentPlan.trim() ? `
              <div class="section">
                <div class="section-title">תוכנית טיפול:</div>
                <div class="content">${treatmentPlan.replace(/\n/g, '<br>')}</div>
              </div>
            ` : ''}
            
            ${medications.trim() ? `
              <div class="section">
                <div class="section-title">תרופות:</div>
                <div class="content">${medications.replace(/\n/g, '<br>')}</div>
              </div>
            ` : ''}
            
            <hr style="margin: 30px 0;" />
            <p style="font-size: 12px; color: #666;">ד"ר אנה ברמלי - מרפאה לרפואה משלימה</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-orange-100 text-orange-700',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'מתוכנן',
    confirmed: 'מאושר',
    in_progress: 'בטיפול',
    completed: 'הושלם',
    cancelled: 'בוטל',
    no_show: 'לא הגיע',
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

  if (!appointment) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">התור לא נמצא</p>
          <Button variant="link" onClick={() => navigate('/admin/appointments')}>
            חזור לרשימת התורים
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/appointments')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">פרטי התור</h1>
              <p className="text-muted-foreground">
                {format(new Date(appointment.scheduled_at), 'EEEE, d בMMMM yyyy', { locale: he })}
              </p>
            </div>
          </div>
          <Badge className={statusColors[appointment.status] + ' text-lg px-4 py-2'}>
            {statusLabels[appointment.status]}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                פרטי המטופל
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20"
                onClick={() => navigate(`/admin/patients/${appointment.patient_id}`)}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary font-bold text-lg">
                  {appointment.patients?.first_name?.charAt(0)}{appointment.patients?.last_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {appointment.patients?.first_name} {appointment.patients?.last_name}
                  </p>
                  {appointment.patients?.id_number && (
                    <p className="text-sm text-muted-foreground">ת.ז: {appointment.patients.id_number}</p>
                  )}
                  {appointment.patients?.phone && (
                    <p className="text-sm text-muted-foreground" dir="ltr">{appointment.patients.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {appointment.patients?.phone && (
                  <Button variant="outline" className="flex-1" onClick={handleWhatsApp}>
                    <MessageCircle className="h-4 w-4 ml-2" />
                    WhatsApp
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/admin/billing/new?patient=${appointment.patient_id}&appointment=${id}`)}
                >
                  <CreditCard className="h-4 w-4 ml-2" />
                  חשבונית
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                פרטי התור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">שעה</p>
                    <p className="font-semibold text-lg">
                      {format(new Date(appointment.scheduled_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">משך</p>
                    <p className="font-semibold">{appointment.duration_minutes} דקות</p>
                  </div>
                </div>
              </div>
              
              {appointment.appointment_types && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: appointment.appointment_types.color }}
                  />
                  <div>
                    <p className="font-medium">{appointment.appointment_types.name_he}</p>
                    {appointment.appointment_types.price && (
                      <p className="text-sm text-muted-foreground">₪{appointment.appointment_types.price}</p>
                    )}
                  </div>
                </div>
              )}

              {appointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">הערות מהמטופל</p>
                  <p className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for visit management */}
        <Tabs defaultValue="visit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visit" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              סיכום ביקור
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              הערות פנימיות
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              מסמכים
            </TabsTrigger>
          </TabsList>

          {/* Visit Summary Tab */}
          <TabsContent value="visit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  סיכום ביקור ותוכנית טיפול
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    סיכום הביקור
                  </Label>
                  <Textarea
                    value={visitSummary}
                    onChange={(e) => setVisitSummary(e.target.value)}
                    placeholder="תאר את מהלך הביקור, ממצאים, אבחנה..."
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    תוכנית טיפול
                  </Label>
                  <Textarea
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder="המלצות לטיפול, פעולות נדרשות, תור המשך..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    תרופות ומרשמים
                  </Label>
                  <Textarea
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="רשום תרופות, מינון, אופן השימוש..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button 
                    onClick={handleSaveVisitSummary} 
                    disabled={updateAppointment.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    {updateAppointment.isPending ? 'שומר...' : 'שמור סיכום'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleShareWhatsApp}
                    disabled={!appointment.patients?.phone || (!visitSummary.trim() && !treatmentPlan.trim() && !medications.trim())}
                  >
                    <MessageCircle className="h-4 w-4 ml-2" />
                    שלח ב-WhatsApp
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handlePrint}
                    disabled={!visitSummary.trim() && !treatmentPlan.trim() && !medications.trim()}
                  >
                    <Printer className="h-4 w-4 ml-2" />
                    הדפס
                  </Button>
                </div>

                {(appointment.visit_shared_whatsapp_at || appointment.visit_shared_email_at) && (
                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    {appointment.visit_shared_whatsapp_at && (
                      <p>✓ נשלח ב-WhatsApp: {format(new Date(appointment.visit_shared_whatsapp_at), 'dd/MM/yyyy HH:mm')}</p>
                    )}
                    {appointment.visit_shared_email_at && (
                      <p>✓ נשלח באימייל: {format(new Date(appointment.visit_shared_email_at), 'dd/MM/yyyy HH:mm')}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internal Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  הערות פנימיות וסטטוס
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>סטטוס התור</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">מתוכנן</SelectItem>
                      <SelectItem value="confirmed">מאושר</SelectItem>
                      <SelectItem value="in_progress">בטיפול</SelectItem>
                      <SelectItem value="completed">הושלם</SelectItem>
                      <SelectItem value="no_show">לא הגיע</SelectItem>
                      <SelectItem value="cancelled">בוטל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>הערות פנימיות (לא מוצגות למטופל)</Label>
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="רשום כאן הערות פנימיות..."
                    rows={6}
                  />
                </div>

                <Button 
                  onClick={handleSaveNotes} 
                  disabled={updateAppointment.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 ml-2" />
                  {updateAppointment.isPending ? 'שומר...' : 'שמור הערות'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  מסמכים וקבצים
                </CardTitle>
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
                      <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
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
                  <p className="text-center text-muted-foreground py-8">
                    אין מסמכים. לחץ על "העלה קובץ" כדי להוסיף.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
