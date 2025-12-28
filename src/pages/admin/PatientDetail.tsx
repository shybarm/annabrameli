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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatient, useUpdatePatient, useDeletePatient } from '@/hooks/usePatients';
import { useMarkPatientReviewed, useIsPatientUnreviewed } from '@/hooks/useUnreviewedPatients';
import { usePatientAppointments } from '@/hooks/useAppointments';
import { usePatientInvoices } from '@/hooks/useInvoices';
import { useClinics } from '@/hooks/useClinics';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DocumentViewer } from '@/components/admin/DocumentViewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  ArrowRight, User, Phone, Mail, Calendar, CreditCard, 
  FileText, Edit, Save, X, MessageCircle, Upload, File, Pill, Stethoscope, Eye, Sparkles,
  ClipboardList, Link, CheckCircle, Trash2, Tag, Loader2, Copy, UserPlus, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useInviteExistingPatient, usePatientPortalInvitation } from '@/hooks/usePatientInvitations';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: patient, isLoading } = usePatient(id);
  const { data: appointments } = usePatientAppointments(id);
  const { data: invoices } = usePatientInvoices(id);
  const { data: clinics } = useClinics();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();
  const markReviewed = useMarkPatientReviewed();
  const { data: isUnreviewed } = useIsPatientUnreviewed(id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingIntake, setIsGeneratingIntake] = useState(false);
  const [intakeLink, setIntakeLink] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; completed: number } | null>(null);
  const [taggingDocs, setTaggingDocs] = useState<Set<string>>(new Set());
  const [portalInviteLink, setPortalInviteLink] = useState<string | null>(null);
  
  const inviteExistingPatient = useInviteExistingPatient();
  const { data: portalInvitation, refetch: refetchPortalInvitation } = usePatientPortalInvitation(id);
  
  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([doc.file_path]);
      
      if (storageError) throw storageError;

      // Then delete from database
      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', doc.id);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-documents', id] });
      toast({ title: 'המסמך נמחק בהצלחה' });
      setDeletingDocId(null);
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה במחיקת המסמך', description: error.message, variant: 'destructive' });
      setDeletingDocId(null);
    },
  });

  const handleDeletePatient = async () => {
    if (!id) return;
    try {
      await deletePatient.mutateAsync(id);
      navigate('/admin/patients');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Fetch intake token
  const { data: intakeToken } = useQuery({
    queryKey: ['intake-token', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('intake_tokens')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!id) return null;
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ 
        title: 'סוג קובץ לא נתמך', 
        description: 'נא להעלות רק PDF, תמונות או מסמכי Office',
        variant: 'destructive' 
      });
      return null;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: 'קובץ גדול מדי', 
        description: 'גודל מקסימלי: 10MB',
        variant: 'destructive' 
      });
      return null;
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: docData, error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: id,
          title: file.name,
          file_path: filePath,
          document_type: file.type.includes('image') ? 'imaging' : 'other',
          mime_type: file.type,
          file_size: file.size,
        })
        .select('id')
        .single();

      if (dbError) throw dbError;
      return docData?.id || null;
    } catch (error: any) {
      toast({ title: `שגיאה בהעלאת ${file.name}`, description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const tagDocument = async (docId: string, filePath: string, mimeType: string, title: string) => {
    setTaggingDocs(prev => new Set(prev).add(docId));
    try {
      const { data, error } = await supabase.functions.invoke('tag-document', {
        body: { documentId: docId, filePath, mimeType, title },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['patient-documents', id] });
    } catch (error) {
      console.error('Tagging error:', error);
    } finally {
      setTaggingDocs(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    if (!id || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress({ total: files.length, completed: 0 });

    const uploadedDocs: { id: string; filePath: string; mimeType: string; title: string }[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const docId = await uploadFile(file);
      if (docId) {
        uploadedDocs.push({ id: docId, filePath, mimeType: file.type, title: file.name });
      }
      setUploadProgress({ total: files.length, completed: i + 1 });
    }

    queryClient.invalidateQueries({ queryKey: ['patient-documents', id] });
    
    if (uploadedDocs.length === files.length) {
      toast({ title: `${uploadedDocs.length} קבצים הועלו בהצלחה` });
    } else if (uploadedDocs.length > 0) {
      toast({ title: `${uploadedDocs.length} מתוך ${files.length} קבצים הועלו בהצלחה`, variant: 'default' });
    }
    
    setIsUploading(false);
    setUploadProgress(null);

    // Trigger AI tagging for all uploaded docs in background
    for (const doc of uploadedDocs) {
      tagDocument(doc.id, doc.filePath, doc.mimeType, doc.title);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadMultipleFiles(Array.from(files));
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => {
      const validTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.some(type => file.type.startsWith(type) || file.type === type);
    });

    if (files.length === 0) {
      toast({ title: 'סוג קובץ לא נתמך', description: 'ניתן להעלות תמונות, PDF או מסמכי Word', variant: 'destructive' });
      return;
    }

    uploadMultipleFiles(files);
  };

  const openDocumentViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleGenerateSummary = async () => {
    if (!documents || documents.length === 0) return;
    
    setIsSummarizing(true);
    setAiSummary('');
    
    try {
      const { data, error } = await supabase.functions.invoke('summarize-documents', {
        body: {
          documents: documents.map(doc => ({
            title: doc.title,
            document_type: doc.document_type,
            created_at: doc.created_at,
            file_path: doc.file_path,
            mime_type: doc.mime_type,
          })),
          patientName: patient ? `${patient.first_name} ${patient.last_name}` : undefined,
          patientId: id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate summary');
      
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

  const getPublicAppOrigin = () => {
    const host = window.location.host;

    // If we are in a Lovable preview URL (id-preview--<id>.lovable.app), convert to the public URL (<id>.lovableproject.com)
    if (/^id-preview--.+\.lovable\.app$/i.test(host)) {
      const publicHost = host
        .replace(/^id-preview--/i, '')
        .replace(/\.lovable\.app$/i, '.lovableproject.com');
      return `${window.location.protocol}//${publicHost}`;
    }

    return window.location.origin;
  };

  const buildIntakeLink = (token?: string | null) => {
    if (!token) return null;
    return `${getPublicAppOrigin()}/intake/${token}`;
  };

  const handleGenerateIntakeLink = async () => {
    if (!id) return;

    setIsGeneratingIntake(true);
    try {
      // Create new intake token
      const { data, error } = await supabase
        .from('intake_tokens')
        .insert({ patient_id: id })
        .select()
        .single();

      if (error) throw error;

      const link = buildIntakeLink(data.token);
      if (link) setIntakeLink(link);

      queryClient.invalidateQueries({ queryKey: ['intake-token', id] });
      toast({ title: 'הקישור נוצר בהצלחה' });
    } catch (error: any) {
      console.error('Intake link error:', error);
      toast({ title: 'שגיאה ביצירת הקישור', description: error.message, variant: 'destructive' });
    } finally {
      setIsGeneratingIntake(false);
    }
  };

  const handleSendIntakeWhatsApp = () => {
    if (!patient?.phone || (!intakeLink && !intakeToken?.token)) return;

    const phone = patient.phone.replace(/\D/g, '');
    const link = intakeLink || buildIntakeLink(intakeToken?.token) || '';
    const message = encodeURIComponent(
      `שלום ${patient.first_name}! 👋\n\n` +
        `לפני הביקור במרפאה, נבקש למלא טופס קליטה קצר:\n${link}\n\n` +
        `תודה,\nמרפאת ד"ר אנה ברמלי`
    );
    window.open(`https://wa.me/972${phone.slice(-9)}?text=${message}`, '_blank');

    // Mark as sent
    if (intakeToken?.id) {
      supabase
        .from('intake_tokens')
        .update({ sent_via: 'whatsapp', sent_at: new Date().toISOString() })
        .eq('id', intakeToken.id)
        .then(() => queryClient.invalidateQueries({ queryKey: ['intake-token', id] }));
    }
  };

  const handleCopyIntakeLink = () => {
    const link = intakeLink || buildIntakeLink(intakeToken?.token);
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast({ title: 'הקישור הועתק!' });
  };

  const buildPortalInviteLink = (code?: string | null) => {
    if (!code) return null;
    return `${getPublicAppOrigin()}/patient-invite/${code}`;
  };

  const handleGeneratePortalInvite = async () => {
    if (!id) return;
    try {
      const invitation = await inviteExistingPatient.mutateAsync(id);
      const link = buildPortalInviteLink(invitation.invite_code);
      setPortalInviteLink(link);
      refetchPortalInvitation();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleCopyPortalLink = () => {
    const link = portalInviteLink || buildPortalInviteLink(portalInvitation?.invite_code);
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast({ title: 'הקישור הועתק!' });
  };

  const handleSendPortalWhatsApp = () => {
    if (!patient?.phone) return;
    const link = portalInviteLink || buildPortalInviteLink(portalInvitation?.invite_code);
    if (!link) return;

    const phone = patient.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `שלום ${patient.first_name}! 👋\n\n` +
        `הוזמנת להצטרף לפורטל המטופלים שלנו. עם הפורטל תוכל/י:\n` +
        `✅ לראות ולנהל תורים\n` +
        `✅ לצפות בסיכומי ביקור\n` +
        `✅ לשלוח הודעות לצוות\n\n` +
        `להרשמה:\n${link}\n\n` +
        `תודה,\nמרפאת ד"ר אנה ברמלי`
    );
    window.open(`https://wa.me/972${phone.slice(-9)}?text=${message}`, '_blank');
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
                <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                  {patient.id_number && <span>ת.ז: {patient.id_number}</span>}
                  {/* Status selector - marks as reviewed when changed to scheduled */}
                  <Select
                    value={patient.status || 'active'}
                    onValueChange={(newStatus) => {
                      if (!id) return;
                      // Mark as reviewed when status changes to scheduled
                      if (newStatus === 'scheduled' && isUnreviewed) {
                        markReviewed.mutate(id);
                      }
                      updatePatient.mutate({
                        id,
                        first_name: patient.first_name,
                        last_name: patient.last_name,
                        status: newStatus,
                      });
                    }}
                  >
                    <SelectTrigger className={`h-6 w-auto min-w-[100px] text-xs ${
                      patient.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      patient.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' :
                      'bg-gray-100 text-gray-700 border-gray-300'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="scheduled">מתוכנן</SelectItem>
                      <SelectItem value="inactive">לא פעיל</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* New patient badge */}
                  {isUnreviewed && (
                    <Badge className="bg-amber-500 text-white text-xs animate-pulse">
                      <Sparkles className="h-3 w-3 ml-1" />
                      מטופל חדש
                    </Badge>
                  )}
                  {/* Clinic assignment */}
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <Select
                      value={patient.clinic_id || 'unassigned'}
                      onValueChange={(value) => {
                        if (!id) return;
                        updatePatient.mutate({
                          id,
                          first_name: patient.first_name,
                          last_name: patient.last_name,
                          clinic_id: value === 'unassigned' ? undefined : value,
                        });
                      }}
                    >
                      <SelectTrigger className="h-6 w-auto min-w-[120px] text-xs border-dashed">
                        <SelectValue placeholder="בחר מרפאה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">לא משויך</SelectItem>
                        {clinics?.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>מחיקת מטופל</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם אתה בטוח שברצונך למחוק את {patient.first_name} {patient.last_name}? פעולה זו לא ניתנת לביטול.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeletePatient}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    מחק מטופל
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Intake Form Card - Only show if NOT completed */}
        {!(patient as any).intake_completed_at && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">טופס קליטה</p>
                  <p className="text-sm text-muted-foreground">
                    {intakeToken?.token && !intakeToken.completed_at 
                      ? 'קישור נוצר - ממתין למילוי' 
                      : 'שלח קישור למטופל למילוי הטופס לפני הביקור הראשון'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {intakeToken?.token && !intakeToken.completed_at ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCopyIntakeLink}>
                      <Link className="h-4 w-4 ml-1" />
                      העתק קישור
                    </Button>
                    {patient.phone && (
                      <Button variant="outline" size="sm" onClick={handleSendIntakeWhatsApp}>
                        <MessageCircle className="h-4 w-4 ml-1" />
                        שלח בוואטסאפ
                      </Button>
                    )}
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={handleGenerateIntakeLink}
                    disabled={isGeneratingIntake}
                    className="bg-primary text-primary-foreground"
                  >
                    <ClipboardList className="h-4 w-4 ml-1" />
                    {isGeneratingIntake ? 'יוצר...' : 'צור קישור'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portal Access Card - Show only if patient doesn't have a linked user account */}
        {!patient.user_id && (
          <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">גישה לפורטל מטופלים</p>
                  <p className="text-sm text-muted-foreground">
                    {portalInvitation && !portalInvitation.accepted_at && new Date(portalInvitation.expires_at) > new Date()
                      ? 'קישור הזמנה נוצר - ממתין להרשמה'
                      : 'שלח הזמנה למטופל להירשם לפורטל'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {portalInvitation && !portalInvitation.accepted_at && new Date(portalInvitation.expires_at) > new Date() ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCopyPortalLink}>
                      <Link className="h-4 w-4 ml-1" />
                      העתק קישור
                    </Button>
                    {patient.phone && (
                      <Button variant="outline" size="sm" onClick={handleSendPortalWhatsApp}>
                        <MessageCircle className="h-4 w-4 ml-1" />
                        שלח בוואטסאפ
                      </Button>
                    )}
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={handleGeneratePortalInvite}
                    disabled={inviteExistingPatient.isPending || !patient.email}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 ml-1" />
                    {inviteExistingPatient.isPending ? 'יוצר...' : 'הזמן לפורטל'}
                  </Button>
                )}
              </div>
            </CardContent>
            {!patient.email && (
              <div className="px-6 pb-4">
                <p className="text-xs text-amber-600">⚠️ נדרש אימייל כדי לשלוח הזמנה לפורטל</p>
              </div>
            )}
          </Card>
        )}

        {/* Show badge if patient has portal access */}
        {patient.user_id && (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full mr-2" />
              פעיל בפורטל
            </Badge>
          </div>
        )}

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="info">פרטים אישיים</TabsTrigger>
            <TabsTrigger value="intake">נתוני קליטה</TabsTrigger>
            <TabsTrigger value="visits">סיכומי ביקורים</TabsTrigger>
            <TabsTrigger value="appointments">תורים ({appointments?.length || 0})</TabsTrigger>
            <TabsTrigger value="billing">חיוב ({invoices?.length || 0})</TabsTrigger>
            <TabsTrigger value="documents">מסמכים ({documents?.length || 0})</TabsTrigger>
            <TabsTrigger value="notes">הערות ותרופות</TabsTrigger>
            <TabsTrigger value="internal">הערות פנימיות</TabsTrigger>
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

          {/* Intake Data Tab */}
          <TabsContent value="intake">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  נתוני קליטה
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(patient as any).intake_completed_at ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(patient as any).main_complaint && (
                      <div className="sm:col-span-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">תלונה עיקרית:</p>
                        <p>{(patient as any).main_complaint}</p>
                      </div>
                    )}
                    {(patient as any).chronic_conditions?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">מחלות כרוניות:</p>
                        <p>{(patient as any).chronic_conditions.join(', ')}</p>
                      </div>
                    )}
                    {(patient as any).current_medications && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">תרופות:</p>
                        <p>{(patient as any).current_medications}</p>
                      </div>
                    )}
                    {(patient as any).smoking_status && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">עישון:</p>
                        <p>{(patient as any).smoking_status}</p>
                      </div>
                    )}
                    {(patient as any).treatment_goals && (
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">ציפיות מהטיפול:</p>
                        <p>{(patient as any).treatment_goals}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">טופס קליטה טרם מולא</p>
                    <p className="text-sm text-muted-foreground">שלח קישור למטופל למילוי הטופס</p>
                  </div>
                )}
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
                {appointments && appointments.filter(a => a.visit_summary || a.treatment_plan || a.medications).length > 0 ? (
                  <div className="space-y-4">
                    {appointments
                      .filter(apt => apt.visit_summary || apt.treatment_plan || apt.medications)
                      .map((apt) => (
                        <div 
                          key={apt.id}
                          className="p-4 rounded-lg border bg-card cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold">{apt.appointment_types?.name_he || 'ביקור'}</p>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(apt.scheduled_at), 'dd/MM/yyyy', { locale: he })}
                            </span>
                          </div>
                          {apt.visit_summary && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">סיכום:</p>
                              <p className="text-sm whitespace-pre-wrap line-clamp-3">{apt.visit_summary}</p>
                            </div>
                          )}
                          {apt.treatment_plan && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">תוכנית טיפול:</p>
                              <p className="text-sm whitespace-pre-wrap line-clamp-2">{apt.treatment_plan}</p>
                            </div>
                          )}
                          {apt.medications && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">תרופות:</p>
                              <p className="text-sm whitespace-pre-wrap line-clamp-2">{apt.medications}</p>
                            </div>
                          )}
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
                      <div 
                        key={inv.id} 
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/admin/billing/${inv.id}`)}
                      >
                        <div>
                          <p className="font-medium font-mono">{inv.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(inv.created_at), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold">₪{Number(inv.total).toLocaleString()}</p>
                          <Badge variant={inv.status === 'pending' || inv.status === 'overdue' ? 'destructive' : 'default'}>
                            {inv.status}
                          </Badge>
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

              {/* Documents List with Drag & Drop */}
              <Card
                className={`transition-all ${isDragging ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>מסמכים ({documents?.length || 0})</CardTitle>
                  <div className="flex items-center gap-2">
                    {uploadProgress && (
                      <span className="text-sm text-muted-foreground">
                        {uploadProgress.completed}/{uploadProgress.total}
                      </span>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      {isUploading ? 'מעלה...' : 'העלה קבצים'}
                    </Button>
                  </div>
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
                  {/* Drag & Drop Zone */}
                  {isDragging && (
                    <div className="border-2 border-dashed border-primary rounded-lg p-8 mb-4 text-center bg-primary/5 animate-pulse">
                      <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
                      <p className="text-primary font-medium">שחרר כדי להעלות</p>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && uploadProgress && (
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">מעלה קבצים...</span>
                        <span className="text-sm text-muted-foreground">
                          {uploadProgress.completed} / {uploadProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {documents && documents.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {documents.map((doc, index) => (
                        <div 
                          key={doc.id} 
                          className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-accent/50 group relative"
                        >
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => openDocumentViewer(index)}
                          >
                            <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </div>
                          {/* AI Tags */}
                          <div className="flex flex-wrap gap-1 min-h-[24px]">
                            {taggingDocs.has(doc.id) ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>מזהה סוג מסמך...</span>
                              </div>
                            ) : (doc as any).ai_tags?.length > 0 ? (
                              (doc as any).ai_tags.map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  tagDocument(doc.id, doc.file_path, doc.mime_type || '', doc.title);
                                }}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                זהה סוג מסמך
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-1 absolute top-2 left-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => openDocumentViewer(index)}
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>מחיקת מסמך</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    האם אתה בטוח שברצונך למחוק את "{doc.title}"? פעולה זו לא ניתנת לביטול.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteDocument.mutate({ id: doc.id, file_path: doc.file_path })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    מחק מסמך
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isDragging && (
                    <div 
                      className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">גרור קבצים לכאן</p>
                      <p className="text-sm text-muted-foreground">או לחץ לבחירת קבצים</p>
                      <p className="text-xs text-muted-foreground mt-2">תמונות, PDF, Word</p>
                    </div>
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

          {/* Internal Notes Tab */}
          <TabsContent value="internal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  הערות פנימיות
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
                          className="p-4 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {format(new Date(apt.scheduled_at), 'EEEE, d בMMMM yyyy', { locale: he })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{apt.internal_notes}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">אין הערות פנימיות</p>
                    <p className="text-sm text-muted-foreground">הערות פנימיות יופיעו כאן לאחר שיתווספו בדף התור</p>
                  </div>
                )}
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