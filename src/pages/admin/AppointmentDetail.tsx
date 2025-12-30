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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DocumentViewer } from '@/components/admin/DocumentViewer';
import { VoiceRecorder } from '@/components/admin/VoiceRecorder';
import { ScoringToolbar } from '@/components/admin/scoring/ScoringToolbar';
import { SignaturePad } from '@/components/admin/SignaturePad';
import { useElectronicSignatures, useCreateElectronicSignature } from '@/hooks/useElectronicSignatures';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowRight, User, Clock, Calendar, FileText, Save, 
  Upload, MessageCircle, CreditCard, File, Printer, Mail, Pill, Stethoscope, Eye, ClipboardList,
  Activity, FlaskConical, ScanLine, PenTool, CheckCircle, Sparkles, Copy
} from 'lucide-react';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { appointmentDetailTutorial } from '@/components/tutorial/tutorialData';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [internalNotes, setInternalNotes] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [currentIllness, setCurrentIllness] = useState('');
  const [hasAsthma, setHasAsthma] = useState(false);
  const [physicalExam, setPhysicalExam] = useState('');
  const [labTests, setLabTests] = useState('');
  const [auxiliaryTests, setAuxiliaryTests] = useState('');
  const [visitSummary, setVisitSummary] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [medications, setMedications] = useState('');
  const [status, setStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [reviewBeforeSend, setReviewBeforeSend] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  const { user } = useAuth();
  const { data: signatures } = useElectronicSignatures('appointment', id || '');
  const createSignature = useCreateElectronicSignature();

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
      visit_shared_email_at?: string;
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

  // File validation constants
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Upload file mutation
  const uploadFile = async (file: File) => {
    if (!appointment?.patient_id) return;
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ 
        title: 'סוג קובץ לא נתמך', 
        description: 'נא להעלות רק PDF, תמונות או מסמכי Office',
        variant: 'destructive' 
      });
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: 'קובץ גדול מדי', 
        description: 'גודל מקסימלי: 10MB',
        variant: 'destructive' 
      });
      return;
    }
    
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
          document_type: file.type.includes('image') ? 'imaging' : 'other',
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

  const handleGenerateSummary = async () => {
    if (!documents || documents.length === 0) return;
    
    setIsSummarizing(true);
    setAiSummary('');
    
    try {
      console.log('Starting AI summary generation for', documents.length, 'documents');
      const { data, error } = await supabase.functions.invoke('summarize-documents', {
        body: {
          documents: documents.map(doc => ({
            title: doc.title,
            document_type: doc.document_type,
            created_at: doc.created_at,
            file_path: doc.file_path,
            mime_type: doc.mime_type,
          })),
          patientName: appointment?.patients ? `${appointment.patients.first_name} ${appointment.patients.last_name}` : undefined,
          patientId: appointment?.patient_id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate summary');
      
      console.log('AI summary generated successfully');
      setAiSummary(data.summary);
      toast({ title: 'הסיכום נוצר בהצלחה' });
    } catch (error: any) {
      console.error('Summary error:', error);
      toast({ 
        title: 'שגיאה ביצירת הסיכום', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const getReminderMessage = () => {
    return `שלום ${appointment?.patients?.first_name || ''}, תזכורת לתור שלך בתאריך ${format(new Date(appointment!.scheduled_at), 'dd/MM/yyyy')} בשעה ${format(new Date(appointment!.scheduled_at), 'HH:mm')}`;
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
    
    if (physicalExam.trim()) {
      text += `🔍 בדיקה גופנית:\n${physicalExam}\n\n`;
    }
    if (labTests.trim()) {
      text += `🧪 בדיקות מעבדה:\n${labTests}\n\n`;
    }
    if (auxiliaryTests.trim()) {
      text += `📊 בדיקות עזר:\n${auxiliaryTests}\n\n`;
    }
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

  const handleSendEmail = async () => {
    if (!appointment?.patients?.email) {
      toast({ title: 'אין כתובת אימייל למטופל', variant: 'destructive' });
      return;
    }
    
    if (!visitSummary.trim() && !treatmentPlan.trim() && !medications.trim()) {
      toast({ title: 'אין תוכן לשליחה', variant: 'destructive' });
      return;
    }

    setIsSendingEmail(true);
    try {
      const patientName = `${appointment.patients.first_name || ''} ${appointment.patients.last_name || ''}`.trim();
      const visitDate = format(new Date(appointment.scheduled_at), 'dd/MM/yyyy', { locale: he });

      const { data, error } = await supabase.functions.invoke('send-visit-summary', {
        body: {
          patientEmail: appointment.patients.email,
          patientName,
          visitDate,
          visitSummary: visitSummary.trim() || undefined,
          treatmentPlan: treatmentPlan.trim() || undefined,
          medications: medications.trim() || undefined,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send email');

      // Mark as shared via email
      await updateAppointment.mutateAsync({ visit_shared_email_at: new Date().toISOString() });
      toast({ title: 'האימייל נשלח בהצלחה' });
    } catch (error: any) {
      console.error('Email send error:', error);
      toast({ title: 'שגיאה בשליחת האימייל', description: error.message, variant: 'destructive' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // HTML escape function to prevent XSS attacks
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Fetch clinic settings for doctor info
  const { data: clinicSettings } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('key, value');
      if (error) throw error;
      const settings: Record<string, any> = {};
      data?.forEach(s => settings[s.key] = s.value);
      return settings;
    }
  });

  // Generate print HTML (reusable for print and review)
  const generatePrintHtml = () => {
    const safeFirstName = escapeHtml(appointment?.patients?.first_name || '');
    const safeLastName = escapeHtml(appointment?.patients?.last_name || '');
    const safeIdNumber = escapeHtml(appointment?.patients?.id_number || '');
    const safePhysicalExam = escapeHtml(physicalExam).replace(/\n/g, '<br>');
    const safeLabTests = escapeHtml(labTests).replace(/\n/g, '<br>');
    const safeAuxiliaryTests = escapeHtml(auxiliaryTests).replace(/\n/g, '<br>');
    const safeVisitSummary = escapeHtml(visitSummary).replace(/\n/g, '<br>');
    const safeTreatmentPlan = escapeHtml(treatmentPlan).replace(/\n/g, '<br>');
    const safeMedications = escapeHtml(medications).replace(/\n/g, '<br>');

    const doctorName = clinicSettings?.doctor_name || 'ד״ר אנה ברמלי';
    const doctorLicense = clinicSettings?.doctor_license || '';
    const doctorSpecialty = clinicSettings?.doctor_specialty || 'רפואה משלימה';
    const clinicAddress = clinicSettings?.clinic_address || '';
    const clinicPhone = clinicSettings?.clinic_phone || '';
    const latestSignature = signatures?.[0];

    return `
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
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #0066cc;
            }
            .header h1 {
              color: #0066cc;
              margin-bottom: 5px;
            }
            .header p {
              margin: 3px 0;
              color: #666;
              font-size: 14px;
            }
            h2 { font-size: 20px; margin-bottom: 15px; color: #333; }
            .patient-info {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .section { margin-bottom: 24px; }
            .section-title { font-weight: bold; margin-bottom: 8px; color: #0066cc; }
            .content { white-space: pre-wrap; }
            .signature-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .signature-box {
              display: flex;
              align-items: flex-start;
              gap: 20px;
            }
            .signature-img {
              max-width: 200px;
              max-height: 80px;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            .signature-details {
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #0066cc;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${escapeHtml(doctorName)}</h1>
            <p>${escapeHtml(doctorSpecialty)}</p>
            ${doctorLicense ? `<p>מספר רישיון: ${escapeHtml(doctorLicense)}</p>` : ''}
            ${clinicAddress ? `<p>${escapeHtml(clinicAddress)}</p>` : ''}
            ${clinicPhone ? `<p>טלפון: ${escapeHtml(clinicPhone)}</p>` : ''}
          </div>
          
          <h2>סיכום ביקור</h2>
          
          <div class="patient-info">
            <p><strong>מטופל:</strong> ${safeFirstName} ${safeLastName}</p>
            <p><strong>תאריך:</strong> ${appointment?.scheduled_at ? format(new Date(appointment.scheduled_at), 'dd/MM/yyyy', { locale: he }) : ''}</p>
            ${safeIdNumber ? `<p><strong>ת.ז:</strong> ${safeIdNumber}</p>` : ''}
          </div>
          
          ${physicalExam.trim() ? `
            <div class="section">
              <div class="section-title">בדיקה גופנית:</div>
              <div class="content">${safePhysicalExam}</div>
            </div>
          ` : ''}
          
          ${labTests.trim() ? `
            <div class="section">
              <div class="section-title">בדיקות מעבדה:</div>
              <div class="content">${safeLabTests}</div>
            </div>
          ` : ''}
          
          ${auxiliaryTests.trim() ? `
            <div class="section">
              <div class="section-title">בדיקות עזר:</div>
              <div class="content">${safeAuxiliaryTests}</div>
            </div>
          ` : ''}
          
          ${visitSummary.trim() ? `
            <div class="section">
              <div class="section-title">סיכום הביקור:</div>
              <div class="content">${safeVisitSummary}</div>
            </div>
          ` : ''}
          
          ${treatmentPlan.trim() ? `
            <div class="section">
              <div class="section-title">תוכנית טיפול:</div>
              <div class="content">${safeTreatmentPlan}</div>
            </div>
          ` : ''}
          
          ${medications.trim() ? `
            <div class="section">
              <div class="section-title">תרופות:</div>
              <div class="content">${safeMedications}</div>
            </div>
          ` : ''}
          
          ${latestSignature ? `
            <div class="signature-section">
              <div class="signature-box">
                <img src="${latestSignature.signature_data}" alt="חתימה" class="signature-img" />
                <div class="signature-details">
                  <p><strong>${escapeHtml(latestSignature.signer_name)}</strong></p>
                  <p>${latestSignature.signer_role === 'doctor' ? 'רופא' : latestSignature.signer_role === 'admin' ? 'מנהל' : 'מזכירה'}</p>
                  <p>נחתם: ${format(new Date(latestSignature.signed_at), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
                </div>
              </div>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>${escapeHtml(doctorName)} | ${escapeHtml(doctorSpecialty)}</p>
            ${clinicAddress ? `<p>${escapeHtml(clinicAddress)}</p>` : ''}
            ${clinicPhone ? `<p>${escapeHtml(clinicPhone)}</p>` : ''}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintHtml());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendEmailClick = () => {
    if (reviewBeforeSend) {
      setShowReviewDialog(true);
    } else {
      handleSendEmail();
    }
  };

  const handleConfirmSendFromReview = async () => {
    setShowReviewDialog(false);
    await handleSendEmail();
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    waiting_room: 'bg-yellow-100 text-yellow-700',
    in_treatment: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'מתוכנן',
    waiting_room: 'בחדר המתנה',
    in_treatment: 'חדר רופא',
    completed: 'הושלם',
    cancelled: 'בוטל',
  };

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'cancelled') {
      setCancellationReason('');
      setCancelDialogOpen(true);
    } else {
      setStatus(newStatus);
      updateAppointment.mutate({ status: newStatus });
    }
  };

  const handleConfirmCancel = async () => {
    setStatus('cancelled');
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason || null
      })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'התור בוטל' });
      setCancelDialogOpen(false);
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
          <div className="flex items-center gap-2">
            {status !== 'cancelled' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setCancellationReason('');
                  setCancelDialogOpen(true);
                }}
              >
                ביטול תור
              </Button>
            )}
            <PageHelpButton tutorial={appointmentDetailTutorial} />
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center gap-3" data-tutorial="status-dropdown">
          <span className="text-sm text-muted-foreground">סטטוס:</span>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className={`w-40 ${statusColors[status] || 'bg-muted'}`}>
              <SelectValue placeholder="בחר סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">מתוכנן</SelectItem>
              <SelectItem value="waiting_room">בחדר המתנה</SelectItem>
              <SelectItem value="in_treatment">חדר רופא</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
              <SelectItem value="cancelled">בוטל</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cancellation Reason Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>סיבת ביטול התור</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label htmlFor="cancel-reason">
                למה התור בוטל? (המידע יעזור לנו לשפר את השירות)
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="לדוגמה: המטופל ביקש לדחות, בעיית לו&quot;ז, מחלה..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                חזור
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                בטל תור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/admin/billing/new?patient=${appointment.patient_id}&appointment=${id}`)}
                >
                  <CreditCard className="h-4 w-4 ml-2" />
                  חשבונית
                </Button>
              </div>
              
              {/* Fill Intake Button - Show if not completed */}
              {!appointment.patients?.intake_completed_at && (
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => navigate(`/admin/intake?patient=${appointment.patient_id}&appointment=${id}`)}
                >
                  <ClipboardList className="h-4 w-4 ml-2" />
                  מלא טופס קליטה
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Appointment Info */}
          <Card data-tutorial="appointment-info">
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
            <TabsTrigger value="documents" className="flex items-center gap-2" data-tutorial="documents-tab">
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
              <CardContent className="space-y-6" data-tutorial="visit-summary-form">
                {/* Scoring Toolbar */}
                <ScoringToolbar 
                  onScoreAdd={(toolName, score, interpretation) => {
                    const scoreText = `\n${toolName}: ${score} - ${interpretation}`;
                    setVisitSummary(prev => prev + scoreText);
                    toast({ title: `${toolName} נוסף לסיכום` });
                  }}
                />

                {/* Chief Complaint */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">תלונה עיקרית</Label>
                  <Textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="תלונה עיקרית של המטופל בביקור זה..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Current Illness with Voice Recording */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">מחלה נוכחית</Label>
                    <VoiceRecorder 
                      onTranscription={(text) => setCurrentIllness(prev => prev ? prev + '\n' + text : text)}
                    />
                  </div>
                  <Textarea
                    value={currentIllness}
                    onChange={(e) => setCurrentIllness(e.target.value)}
                    placeholder="תיאור המחלה הנוכחית, אנמנזה..."
                    rows={5}
                    className="resize-none"
                  />
                </div>


                {/* Medical Background from Intake */}
                {appointment?.patients && (
                  <div className="space-y-2">
                    <Label>רקע רפואי (מטופס קליטה)</Label>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                      {appointment.patients.chronic_conditions?.length ? (
                        <p><strong>מחלות כרוניות:</strong> {appointment.patients.chronic_conditions.join(', ')}</p>
                      ) : null}
                      {appointment.patients.previous_surgeries && (
                        <p><strong>ניתוחים קודמים:</strong> {appointment.patients.previous_surgeries}</p>
                      )}
                      {appointment.patients.current_medications && (
                        <p><strong>תרופות נוכחיות:</strong> {appointment.patients.current_medications}</p>
                      )}
                      {appointment.patients.allergies?.length ? (
                        <p><strong>אלרגיות:</strong> {appointment.patients.allergies.join(', ')}</p>
                      ) : null}
                      {!appointment.patients.chronic_conditions?.length && !appointment.patients.previous_surgeries && !appointment.patients.current_medications && !appointment.patients.allergies?.length && (
                        <p className="text-muted-foreground">אין מידע רפואי מטופס הקליטה</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Family History from Intake */}
                {appointment?.patients?.family_medical_history && (
                  <div className="space-y-2">
                    <Label>רקע משפחתי (מטופס קליטה)</Label>
                    <div className="p-3 bg-muted/30 rounded-lg text-sm">
                      {appointment.patients.family_medical_history}
                    </div>
                  </div>
                )}

                {/* Physical Examination */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    בדיקה גופנית
                  </Label>
                  <Textarea
                    value={physicalExam}
                    onChange={(e) => setPhysicalExam(e.target.value)}
                    placeholder="ממצאי הבדיקה הגופנית..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Lab Tests */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    בדיקות מעבדה
                  </Label>
                  <Textarea
                    value={labTests}
                    onChange={(e) => setLabTests(e.target.value)}
                    placeholder="בדיקות דם, שתן, תרביות וכו'..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Auxiliary Tests */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4" />
                    בדיקות עזר (הדמייה, פתולוגיה, פרוצדורות)
                  </Label>
                  <Textarea
                    value={auxiliaryTests}
                    onChange={(e) => setAuxiliaryTests(e.target.value)}
                    placeholder="CT, MRI, אולטרסאונד, ביופסיה וכו'..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

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

                <div className="flex flex-wrap gap-3 pt-4 border-t" data-tutorial="share-buttons">
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
                    onClick={handleSendEmailClick}
                    disabled={isSendingEmail || !appointment.patients?.email || (visitSummary.trim().length <= 2 && treatmentPlan.trim().length <= 2 && medications.trim().length <= 2 && chiefComplaint.trim().length <= 2 && currentIllness.trim().length <= 2 && physicalExam.trim().length <= 2 && labTests.trim().length <= 2 && auxiliaryTests.trim().length <= 2)}
                  >
                    <Mail className="h-4 w-4 ml-2" />
                    {isSendingEmail ? 'שולח...' : 'שלח באימייל'}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="reviewBeforeSend"
                      checked={reviewBeforeSend}
                      onCheckedChange={(checked) => setReviewBeforeSend(checked as boolean)}
                    />
                    <Label htmlFor="reviewBeforeSend" className="text-sm cursor-pointer">
                      בדיקה לפני שליחה
                    </Label>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handlePrint}
                    disabled={visitSummary.trim().length <= 2 && treatmentPlan.trim().length <= 2 && medications.trim().length <= 2 && chiefComplaint.trim().length <= 2 && currentIllness.trim().length <= 2 && physicalExam.trim().length <= 2 && labTests.trim().length <= 2 && auxiliaryTests.trim().length <= 2}
                  >
                    <Printer className="h-4 w-4 ml-2" />
                    הדפס
                  </Button>

                  <Dialog open={showSignaturePad} onOpenChange={setShowSignaturePad}>
                    <DialogTrigger asChild>
                      <Button 
                        variant={signatures?.length ? "outline" : "default"}
                        disabled={visitSummary.trim().length <= 2 && treatmentPlan.trim().length <= 2 && medications.trim().length <= 2 && chiefComplaint.trim().length <= 2 && currentIllness.trim().length <= 2 && physicalExam.trim().length <= 2 && labTests.trim().length <= 2 && auxiliaryTests.trim().length <= 2}
                        className={signatures?.length ? "" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        {signatures?.length ? (
                          <>
                            <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                            נחתם ({signatures.length})
                          </>
                        ) : (
                          <>
                            <PenTool className="h-4 w-4 ml-2" />
                            חתום דיגיטלית
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>חתימה דיגיטלית על סיכום הביקור</DialogTitle>
                      </DialogHeader>
                      <SignaturePad 
                        defaultName={user?.email?.split('@')[0] || ''}
                        defaultRole="doctor"
                        onSign={async (signatureData, signerName, signerRole, signatureMeaning) => {
                          await createSignature.mutateAsync({
                            record_type: 'appointment',
                            record_id: id!,
                            signature_data: signatureData,
                            signer_name: signerName,
                            signer_role: signerRole,
                            signature_meaning: signatureMeaning
                          });
                          setShowSignaturePad(false);
                        }}
                        onCancel={() => setShowSignaturePad(false)}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Review Before Send Dialog */}
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          בדיקה לפני שליחה
                        </DialogTitle>
                      </DialogHeader>
                      <div className="overflow-auto max-h-[60vh] border rounded-lg">
                        <iframe
                          srcDoc={generatePrintHtml()}
                          className="w-full h-[500px] bg-white"
                          title="תצוגה מקדימה של סיכום הביקור"
                        />
                      </div>
                      <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => setShowReviewDialog(false)}
                        >
                          חזרה
                        </Button>
                        <Button
                          onClick={handleConfirmSendFromReview}
                          disabled={isSendingEmail}
                          className="bg-primary text-primary-foreground"
                        >
                          <Mail className="h-4 w-4 ml-2" />
                          {isSendingEmail ? 'שולח...' : 'שלח עכשיו'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Existing Signatures Display */}
                {signatures && signatures.length > 0 && (
                  <div className="pt-4 border-t space-y-3" data-tutorial="signature-section">
                    <Label className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      חתימות דיגיטליות
                    </Label>
                    <div className="grid gap-3">
                      {signatures.map((sig) => (
                        <div 
                          key={sig.id} 
                          className="flex items-start gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <img 
                            src={sig.signature_data} 
                            alt="חתימה" 
                            className="h-12 w-24 object-contain bg-white rounded border"
                          />
                          <div className="flex-1 text-sm">
                            <p className="font-medium">{sig.signer_name}</p>
                            <p className="text-muted-foreground">
                              {sig.signer_role === 'doctor' ? 'רופא' : sig.signer_role === 'admin' ? 'מנהל' : 'מזכירה'} - {sig.signature_meaning === 'approval' ? 'אישור' : sig.signature_meaning === 'review' ? 'סקירה' : 'כותב'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(sig.signed_at), 'dd/MM/yyyy HH:mm:ss', { locale: he })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      <SelectItem value="arrived">הגיע</SelectItem>
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
            <div className="space-y-4">
              {/* AI Summary Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    סיכום מסמכים AI
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateSummary}
                    disabled={isSummarizing || !documents || documents.length === 0}
                  >
                    <Sparkles className="h-4 w-4 ml-2" />
                    {isSummarizing ? 'מייצר סיכום...' : 'צור סיכום'}
                  </Button>
                </CardHeader>
                {aiSummary && (
                  <CardContent>
                    <div className="relative bg-muted/50 p-4 rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(aiSummary);
                          toast({ title: 'הסיכום הועתק!' });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <div className="whitespace-pre-wrap text-sm pr-0 pl-10">
                        {aiSummary}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Documents List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    מסמכים וקבצים ({documents?.length || 0})
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
                      {documents.map((doc, index) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer group"
                          onClick={() => {
                            setViewerIndex(index);
                            setViewerOpen(true);
                          }}
                        >
                          <File className="h-8 w-8 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
            </div>
            
            {/* Document Viewer Modal */}
            {documents && documents.length > 0 && (
              <DocumentViewer
                documents={documents}
                initialIndex={viewerIndex}
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
