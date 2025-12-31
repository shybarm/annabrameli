import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLog, useAuditLogTables } from '@/hooks/useAuditLog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { History, Filter, Eye, RefreshCw } from 'lucide-react';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';

const tableLabels: Record<string, string> = {
  patients: 'מטופלים',
  appointments: 'תורים',
  invoices: 'חשבוניות',
  invoice_items: 'פריטי חשבונית',
  payments: 'תשלומים',
  patient_documents: 'מסמכים',
  messages: 'הודעות',
  user_roles: 'תפקידי משתמשים',
  clinic_settings: 'הגדרות',
  appointment_types: 'סוגי תורים',
  electronic_signatures: 'חתימות דיגיטליות'
};

const actionLabels: Record<string, string> = {
  INSERT: 'יצירה',
  UPDATE: 'עדכון',
  DELETE: 'מחיקה'
};

const actionColors: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700'
};

export default function AuditLogPage() {
  const [filters, setFilters] = useState({
    tableName: '',
    action: '',
    startDate: '',
    endDate: ''
  });

  const { data: auditLogs, isLoading, refetch } = useAuditLog({
    tableName: filters.tableName || undefined,
    action: filters.action || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined
  });

  const { data: tables } = useAuditLogTables();

  const clearFilters = () => {
    setFilters({
      tableName: '',
      action: '',
      startDate: '',
      endDate: ''
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: he });
  };

  const renderDataDiff = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
    if (!oldData && !newData) return null;

    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {})
    ]);

    const changes: { key: string; oldVal: unknown; newVal: unknown; changed: boolean }[] = [];

    allKeys.forEach(key => {
      const oldVal = oldData?.[key];
      const newVal = newData?.[key];
      const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
      changes.push({ key, oldVal, newVal, changed });
    });

    return (
      <div className="space-y-2 text-sm" dir="ltr">
        {changes.map(({ key, oldVal, newVal, changed }) => (
          <div 
            key={key} 
            className={`p-2 rounded ${changed ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/30'}`}
          >
            <span className="font-medium text-muted-foreground">{key}:</span>
            {changed ? (
              <div className="mt-1 space-y-1">
                {oldVal !== undefined && (
                  <div className="text-red-600 line-through">
                    {JSON.stringify(oldVal, null, 2)}
                  </div>
                )}
                {newVal !== undefined && (
                  <div className="text-green-600">
                    {JSON.stringify(newVal, null, 2)}
                  </div>
                )}
              </div>
            ) : (
              <span className="mr-2">{JSON.stringify(newVal ?? oldVal)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <PermissionGuard permission="canViewAuditLog">
        <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">לוג אבטחה</h1>
              <p className="text-muted-foreground">תיעוד אוטומטי של כל השינויים במערכת</p>
            </div>
          </div>
          <div className="flex gap-2">
            <PageHelpButton tutorial={pageTutorials['/admin/audit-log']} />
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 ml-1" />
              רענן
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              סינון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>טבלה</Label>
                <Select 
                  value={filters.tableName} 
                  onValueChange={(v) => setFilters(f => ({ ...f, tableName: v === 'all' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל הטבלאות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הטבלאות</SelectItem>
                    {tables?.map(table => (
                      <SelectItem key={table} value={table}>
                        {tableLabels[table] || table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>פעולה</Label>
                <Select 
                  value={filters.action} 
                  onValueChange={(v) => setFilters(f => ({ ...f, action: v === 'all' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל הפעולות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הפעולות</SelectItem>
                    <SelectItem value="INSERT">יצירה</SelectItem>
                    <SelectItem value="UPDATE">עדכון</SelectItem>
                    <SelectItem value="DELETE">מחיקה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>מתאריך</Label>
                <Input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>עד תאריך</Label>
                <Input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={clearFilters} size="sm">
                נקה סינון
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              רשומות ({auditLogs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !auditLogs?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>לא נמצאו רשומות</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">תאריך ושעה</TableHead>
                      <TableHead className="text-right">טבלה</TableHead>
                      <TableHead className="text-right">פעולה</TableHead>
                      <TableHead className="text-right">מזהה רשומה</TableHead>
                      <TableHead className="text-right">פרטים</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tableLabels[log.table_name || ''] || log.table_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] || ''}>
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.record_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 ml-1" />
                                צפה
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  פרטי שינוי
                                  <Badge className={actionColors[log.action] || ''}>
                                    {actionLabels[log.action] || log.action}
                                  </Badge>
                                </DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4 p-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">תאריך:</span>{' '}
                                      {formatDate(log.created_at)}
                                    </div>
                                    <div>
                                      <span className="font-medium">טבלה:</span>{' '}
                                      {tableLabels[log.table_name || ''] || log.table_name}
                                    </div>
                                    <div>
                                      <span className="font-medium">מזהה רשומה:</span>{' '}
                                      <code className="text-xs">{log.record_id}</code>
                                    </div>
                                    <div>
                                      <span className="font-medium">מזהה משתמש:</span>{' '}
                                      <code className="text-xs">{log.user_id || 'לא ידוע'}</code>
                                    </div>
                                  </div>
                                  
                                  <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">שינויים:</h4>
                                    {renderDataDiff(log.old_data, log.new_data)}
                                  </div>
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </PermissionGuard>
    </AdminLayout>
  );
}
