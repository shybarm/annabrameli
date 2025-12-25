import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Inbox } from 'lucide-react';

export default function MessagesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הודעות</h1>
          <p className="text-muted-foreground">תקשורת עם מטופלים</p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין הודעות חדשות</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                הודעות מהמטופלים דרך הפורטל יופיעו כאן. 
                המטופלים יוכלו לשלוח הודעות לאחר שהפורטל יופעל.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
