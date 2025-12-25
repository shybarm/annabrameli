import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePatientRecord } from '@/hooks/usePatientPortal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, FileText, ClipboardList, LogOut, Home, User, MessageCircle } from 'lucide-react';
import PatientAppointmentsTab from '@/components/patient/PatientAppointmentsTab';
import PatientDocumentsTab from '@/components/patient/PatientDocumentsTab';
import PatientVisitSummariesTab from '@/components/patient/PatientVisitSummariesTab';
import PatientMessagesTab from '@/components/patient/PatientMessagesTab';
import PatientAppointmentRequest from '@/components/patient/PatientAppointmentRequest';

export default function PatientPortal() {
  const navigate = useNavigate();
  const { user, loading, signOut, isPatient, isStaff } = useAuth();
  const { data: patient, isLoading: patientLoading } = usePatientRecord();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    // Redirect staff to admin
    if (!loading && user && isStaff) {
      navigate('/admin');
    }
  }, [loading, user, isStaff, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || patientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white p-4" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">לא נמצא רשומת מטופל</h1>
          <p className="text-muted-foreground">החשבון שלך לא מקושר לרשומת מטופל במערכת.</p>
          <p className="text-muted-foreground text-sm">אנא פנה למרפאה לקבלת סיוע.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 ml-2" />
              חזרה לאתר
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-medical-800">שלום, {patient.first_name}</h1>
            <p className="text-sm text-muted-foreground">הפורטל האישי שלך</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4 ml-1" />
                אתר המרפאה
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 ml-1" />
              יציאה
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">תורים</span>
            </TabsTrigger>
            <TabsTrigger value="summaries" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">סיכומים</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">הודעות</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">מסמכים</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <div className="mb-4">
              <PatientAppointmentRequest />
            </div>
            <PatientAppointmentsTab />
          </TabsContent>

          <TabsContent value="summaries">
            <PatientVisitSummariesTab />
          </TabsContent>

          <TabsContent value="messages">
            <PatientMessagesTab />
          </TabsContent>

          <TabsContent value="documents">
            <PatientDocumentsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
