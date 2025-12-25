import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { usePatientPortalAppointments } from '@/hooks/usePatientPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClipboardList, Pill, FileText, Calendar } from 'lucide-react';

export default function PatientVisitSummariesTab() {
  const { data: appointments, isLoading } = usePatientPortalAppointments();

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

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-3">
        {completedWithSummary.map((apt) => (
          <AccordionItem key={apt.id} value={apt.id} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3 text-right">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: apt.appointment_type?.color || '#3B82F6' }}
                />
                <div>
                  <p className="font-medium text-foreground">
                    {apt.appointment_type?.name_he || 'ביקור'}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(apt.scheduled_at), 'd בMMMM yyyy', { locale: he })}
                  </p>
                </div>
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
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
