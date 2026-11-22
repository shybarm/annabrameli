import { ClinicalVisitWorkspace } from '@/components/admin/clinical/ClinicalVisitWorkspace';
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useElectronicSignatures, useCreateElectronicSignature } from '@/hooks/useElectronicSignatures';
import { TelephoneInvitation } from '@/components/admin/TelephoneInvitation';
import { useAuth } from '@/hooks/useAuth';
import { useStaffProfile } from '@/hooks/useStaffProfile';
import { generateMedicalVisitSummaryPdf } from '@/utils/medicalPdfTemplate';
import { shareViaWhatsApp, copyToClipboard } from '@/utils/shareHelper';
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
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [reviewBeforeSend, setReviewBeforeSend] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  
  const { user } = useAuth();
  const { data: staffProfile } = useStaffProfile();
  const { data: signatures } = useElectronicSignatures('appointment', id || '');
  const createSignature = useCreateElectronicSignature();

  // Set pdfReady if signatures already exist
  useEffect(() => {
    if (signatures && signatures.length > 0) {
      setPdfReady(true);
    }
  }, [signatures]);

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
        setVisitSummary(data.visit_summary || '');
        setTreatmentPlan(data.treatment_plan || '');
        setMedications(data.medications || '');
        setStatus(data.status || 'scheduled');
      }
      return data;
    },
    enabled: !!id,
  });

  // Fetch internal notes from secure table (staff-only)
  const { data: internalNotesData } = useQuery({
    queryKey: ['appointment-internal-notes', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('appointment_internal_notes')
        .select('notes')
        .eq('appointment_id', id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.notes) {
        setInternalNotes(data.notes);
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
      // Handle internal_notes separately - save to secure table
      if (updates.internal_notes !== undefined) {
        const { error: notesError } = await supabase
          .from('appointment_internal_notes')
          .upsert({
            appointment_id: id,
            notes: updates.internal_notes,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'appointment_id' });
        if (notesError) throw notesError;
        // Remove from main update
        delete updates.internal_notes;
      }
      
      // Update remaining fields on appointments table
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('appointments')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointment-internal-notes', id] });
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

  // Check if at least one field has >2 chars
  const hasValidContent = () => {
    const fields = [chiefComplaint, currentIllness, physicalExam, labTests, auxiliaryTests, visitSummary, treatmentPlan, medications];
    return fields.some(field => field.trim().length > 2);
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

  // Generate print HTML using medical PDF template
  const generatePrintHtml = () => {
    const latestSignature = signatures?.[0];
    
    return generateMedicalVisitSummaryPdf(
      {
        first_name: appointment?.patients?.first_name || '',
        last_name: appointment?.patients?.last_name || '',
        id_number: appointment?.patients?.id_number || '',
        date_of_birth: appointment?.patients?.date_of_birth || '',
        phone: appointment?.patients?.phone || '',
        address: appointment?.patients?.address || '',
        city: appointment?.patients?.city || '',
      },
      {
        doctor_name: clinicSettings?.doctor_name || 'ד״ר אנה ברמלי',
        doctor_license: clinicSettings?.doctor_license || '',
        doctor_specialty: clinicSettings?.doctor_specialty || 'מומחית לאלרגיה ואימונולוגיה',
        clinic_name: clinicSettings?.clinic_name || '',
        clinic_address: clinicSettings?.clinic_address || '',
        clinic_phone: clinicSettings?.clinic_phone || '',
      },
      {
        visit_date: appointment?.scheduled_at || new Date().toISOString(),
        visit_summary: visitSummary.trim() || undefined,
        treatment_plan: treatmentPlan.trim() || undefined,
        medications: medications.trim() || undefined,
        current_diagnoses: physicalExam.trim() || undefined,
        past_diagnoses: labTests.trim() || undefined,
      },
      latestSignature ? {
        signature_data: latestSignature.signature_data,
        signer_name: latestSignature.signer_name,
        signed_at: latestSignature.signed_at,
      } : undefined
    );
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
  const [selectedReasonType, setSelectedReasonType] = useState('');

  const CANCELLATION_REASONS = [
    { value: 'patient_no_show', label: 'המטופל לא הגיע' },
    { value: 'patient_cancelled', label: 'ביטול ע״י מטופל' },
    { value: 'clinic_cancelled', label: 'ביטול ע״י מרפאה' },
    { value: 'scheduling_error', label: 'טעות בקביעת תור' },
    { value: 'other', label: 'אחר' },
  ];

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'cancelled') {
      setCancellationReason('');
      setSelectedReasonType('');
      setCancelDialogOpen(true);
    } else {
      setStatus(newStatus);
      updateAppointment.mutate({ status: newStatus });
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedReasonType) return;
    
    const reasonLabel = CANCELLATION_REASONS.find(r => r.value === selectedReasonType)?.label || '';
    const fullReason = selectedReasonType === 'other' 
      ? cancellationReason.trim() || reasonLabel
      : cancellationReason.trim() 
        ? `${reasonLabel}: ${cancellationReason.trim()}`
        : reasonLabel;
    
    setStatus('cancelled');
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: fullReason
      })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'התור בוטל' });
      setCancelDialogOpen(false);
      setCancellationReason('');
      setSelectedReasonType('');
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  if (!appointment) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-muted-foreground">התור לא נמצא</p>
          <Button variant="link" onClick={() => navigate('/admin/appointments')}>
            חזור לרשימת התורים
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
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

        {appointment.modality === 'telephone' && ['scheduled','confirmed'].includes(appointment.status) &&
          new Date(appointment.scheduled_at).getTime() + (appointment.duration_minutes + 60) * 60000 > Date.now() &&
          <Card><CardContent className="pt-6"><TelephoneInvitation appointment={appointment}
            phone={appointment.patients?.phone} email={appointment.patients?.email} /></CardContent></Card>}

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
              <div className="space-y-2">
                <Label>בחר סיבת ביטול</Label>
                <Select value={selectedReasonType} onValueChange={setSelectedReasonType}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="בחר סיבה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedReasonType && (
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">
                    {selectedReasonType === 'other' ? 'תאר את הסיבה' : 'פרטים נוספים (אופציונלי)'}
                  </Label>
                  <Textarea
                    id="cancel-reason"
                    placeholder={selectedReasonType === 'other' ? 'הזן סיבה...' : 'הוסף פרטים...'}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                חזור
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmCancel}
                disabled={!selectedReasonType || (selectedReasonType === 'other' && !cancellationReason.trim())}
              >
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
          <TabsContent value="visit" forceMount className="data-[state=inactive]:hidden">
            <ClinicalVisitWorkspace key={id} appointmentId={id!} legacy={appointment} />
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
    </>
  );
}
