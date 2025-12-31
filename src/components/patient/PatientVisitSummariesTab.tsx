import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { usePatientPortalAppointments } from '@/hooks/usePatientPortal';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ClipboardList, Pill, FileText, Calendar, Printer, CheckCircle, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateMedicalVisitSummaryPdf } from '@/utils/medicalPdfTemplate';


export default function PatientVisitSummariesTab() {
  const { data: appointments, isLoading } = usePatientPortalAppointments();

  // Fetch clinic settings for doctor info
  const { data: clinicSettings } = useQuery({
    queryKey: ['clinic-settings-public'],
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

  // Fetch signatures for appointments
  const { data: signaturesMap } = useQuery({
    queryKey: ['patient-signatures', appointments?.map(a => a.id)],
    queryFn: async () => {
      if (!appointments?.length) return {};
      
      const { data, error } = await supabase
        .from('electronic_signatures')
        .select('*')
        .eq('record_type', 'appointment')
        .in('record_id', appointments.map(a => a.id));
      
      if (error) throw error;
      
      const map: Record<string, any[]> = {};
      data?.forEach(sig => {
        if (!map[sig.record_id]) map[sig.record_id] = [];
        map[sig.record_id].push(sig);
      });
      return map;
    },
    enabled: !!appointments?.length
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const completedWithSummary = appointments?.filter(
    (apt) => apt.status === 'completed' && (apt.visit_summary || apt.medications || apt.treatment_plan)
  ) || [];

  if (!completedWithSummary.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">אין סיכומי ביקור</h3>
          <p className="text-muted-foreground">
            סיכומי הביקורים שלך יופיעו כאן לאחר ביקור במרפאה.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePrint = (apt: any) => {
    const signatures = signaturesMap?.[apt.id];
    
    if (!signatures?.length) {
      toast.error('הסיכום טרם נחתם על ידי הרופא');
      return;
    }

    const latestSignature = signatures[0];
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = generateMedicalVisitSummaryPdf(
        {
          first_name: apt.patients?.first_name || '',
          last_name: apt.patients?.last_name || '',
          id_number: apt.patients?.id_number || '',
          date_of_birth: apt.patients?.date_of_birth || '',
          phone: apt.patients?.phone || '',
        },
        {
          doctor_name: clinicSettings?.doctor_name || 'ד״ר אנה ברמלי',
          doctor_license: clinicSettings?.doctor_license || '',
          doctor_specialty: clinicSettings?.doctor_specialty || 'רפואה משלימה',
          clinic_name: clinicSettings?.clinic_name || '',
          clinic_address: clinicSettings?.clinic_address || '',
          clinic_phone: clinicSettings?.clinic_phone || '',
        },
        {
          visit_date: apt.scheduled_at,
          visit_summary: apt.visit_summary || undefined,
          treatment_plan: apt.treatment_plan || undefined,
          medications: apt.medications || undefined,
        },
        {
          signature_data: latestSignature.signature_data,
          signer_name: latestSignature.signer_name,
          signed_at: latestSignature.signed_at,
        }
      );
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-3">
        {completedWithSummary.map((apt) => {
          const isSigned = signaturesMap?.[apt.id]?.length > 0;
          
          return (
            <AccordionItem key={apt.id} value={apt.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 text-right flex-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: apt.appointment_type?.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {apt.appointment_type?.name_he || 'ביקור'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(apt.scheduled_at), 'd בMMMM yyyy', { locale: he })}
                    </p>
                  </div>
                  {isSigned ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      נחתם
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <Lock className="h-3 w-3" />
                      ממתין לחתימה
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {apt.visit_summary && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-medical-600" />
                        סיכום ביקור
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md text-right" dir="rtl">
                        {apt.visit_summary}
                      </p>
                    </div>
                  )}

                  {apt.medications && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                        <Pill className="h-4 w-4 text-medical-600" />
                        תרופות
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                        {apt.medications}
                      </p>
                    </div>
                  )}

                  {apt.treatment_plan && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                        <ClipboardList className="h-4 w-4 text-medical-600" />
                        תכנית טיפול
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md text-right" dir="rtl">
                        {apt.treatment_plan}
                      </p>
                    </div>
                  )}

                  {/* Print button - only enabled if signed */}
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(apt)}
                      disabled={!isSigned}
                      className={isSigned ? '' : 'opacity-50 cursor-not-allowed'}
                    >
                      <Printer className="h-4 w-4 ml-2" />
                      {isSigned ? 'הדפס סיכום' : 'ממתין לחתימת הרופא'}
                    </Button>
                    {!isSigned && (
                      <p className="text-xs text-muted-foreground mt-2">
                        הסיכום יהיה זמין להדפסה לאחר חתימת הרופא
                      </p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
