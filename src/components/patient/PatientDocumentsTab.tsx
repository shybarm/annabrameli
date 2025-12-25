import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { usePatientPortalDocuments } from '@/hooks/usePatientPortal';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, File, Image, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const documentTypeLabels: Record<string, string> = {
  lab_result: 'תוצאות בדיקה',
  referral: 'הפניה',
  prescription: 'מרשם',
  imaging: 'הדמיה',
  report: 'דוח',
  consent: 'טופס הסכמה',
  other: 'אחר',
};

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return FileText;
}

export default function PatientDocumentsTab() {
  const { data: documents, isLoading } = usePatientPortalDocuments();

  const handleDownload = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'שגיאה בהורדה',
        description: 'לא ניתן להוריד את הקובץ',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!documents?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">אין מסמכים</h3>
          <p className="text-muted-foreground">
            המסמכים שלך יופיעו כאן לאחר העלאה על ידי הצוות הרפואי.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const FileIcon = getFileIcon(doc.mime_type);
        return (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-medical-100 rounded-lg">
                    <FileIcon className="h-5 w-5 text-medical-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{doc.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{documentTypeLabels[doc.document_type] || doc.document_type}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.created_at), 'd בMMMM yyyy', { locale: he })}</span>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.file_path, doc.title)}
                >
                  <Download className="h-4 w-4 ml-1" />
                  הורדה
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
