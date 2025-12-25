import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowRight, User, Clock, Calendar, FileText, Save, 
  Upload, MessageCircle, CreditCard, X, File
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [internalNotes, setInternalNotes] = useState('');
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
    mutationFn: async (updates: { internal_notes?: string; status?: string }) => {
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
      <div className="space-y-6 max-w-4xl">
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
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                  <p className="bg-yellow-50 p-3 rounded-lg text-sm">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visit Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              סיכום ביקור והערות פנימיות
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
              <Label>הערות פנימיות וסיכום ביקור</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="רשום כאן הערות פנימיות, סיכום הביקור, המלצות לטיפול וכו׳..."
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

        {/* Documents */}
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
      </div>
    </AdminLayout>
  );
}