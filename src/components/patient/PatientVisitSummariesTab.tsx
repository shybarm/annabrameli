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

// HTML escape function to prevent XSS attacks
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

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
    
    // Get doctor info from clinic settings
    const doctorName = clinicSettings?.doctor_name || 'ד״ר אנה ברמלי';
    const doctorLicense = clinicSettings?.doctor_license || '';
    const doctorSpecialty = clinicSettings?.doctor_specialty || 'רפואה משלימה';
    const clinicAddress = clinicSettings?.clinic_address || '';
    const clinicPhone = clinicSettings?.clinic_phone || '';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const safeVisitSummary = escapeHtml(apt.visit_summary || '').replace(/\n/g, '<br>');
      const safeTreatmentPlan = escapeHtml(apt.treatment_plan || '').replace(/\n/g, '<br>');
      const safeMedications = escapeHtml(apt.medications || '').replace(/\n/g, '<br>');

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
              <p><strong>סוג הביקור:</strong> ${escapeHtml(apt.appointment_type?.name_he || 'ביקור')}</p>
              <p><strong>תאריך:</strong> ${format(new Date(apt.scheduled_at), 'dd/MM/yyyy', { locale: he })}</p>
            </div>
            
            ${apt.visit_summary ? `
              <div class="section">
                <div class="section-title">סיכום הביקור:</div>
                <div class="content">${safeVisitSummary}</div>
              </div>
            ` : ''}
            
            ${apt.treatment_plan ? `
              <div class="section">
                <div class="section-title">תוכנית טיפול:</div>
                <div class="content">${safeTreatmentPlan}</div>
              </div>
            ` : ''}
            
            ${apt.medications ? `
              <div class="section">
                <div class="section-title">תרופות:</div>
                <div class="content">${safeMedications}</div>
              </div>
            ` : ''}
            
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
            
            <div class="footer">
              <p>${escapeHtml(doctorName)} | ${escapeHtml(doctorSpecialty)}</p>
              ${clinicAddress ? `<p>${escapeHtml(clinicAddress)}</p>` : ''}
              ${clinicPhone ? `<p>${escapeHtml(clinicPhone)}</p>` : ''}
            </div>
          </body>
        </html>
      `);
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
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
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
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
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
