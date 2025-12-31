import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useWorkSessions, calculateHours } from "@/hooks/useWorkSessions";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Clock, Check, Edit2, Play, Square } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const WorkHoursPage = () => {
  const { selectedClinicId } = useClinicContext();
  const { user } = useAuth();
  const {
    todaySession,
    allSessions,
    clockIn,
    clockOut,
    updateSession,
    approveSession,
  } = useWorkSessions();

  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const session = todaySession.data;

  const handleClockIn = async () => {
    try {
      await clockIn.mutateAsync(selectedClinicId || undefined);
      toast.success("התחלת יום עבודה נרשמה");
    } catch {
      toast.error("שגיאה ברישום כניסה");
    }
  };

  const handleClockOut = async () => {
    if (!session) return;
    try {
      await clockOut.mutateAsync(session.id);
      toast.success("יציאה נרשמה");
    } catch {
      toast.error("שגיאה ברישום יציאה");
    }
  };

  const handleEdit = () => {
    if (session) {
      setEditStart(session.start_time || "");
      setEditEnd(session.end_time || "");
      setEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!session) return;
    try {
      await updateSession.mutateAsync({
        sessionId: session.id,
        start_time: editStart,
        end_time: editEnd,
      });
      setEditing(false);
      toast.success("השעות עודכנו");
    } catch {
      toast.error("שגיאה בעדכון");
    }
  };

  const handleApprove = async (sessionId: string) => {
    try {
      await approveSession.mutateAsync(sessionId);
      toast.success("אושר");
    } catch {
      toast.error("שגיאה באישור");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white">מאושר</Badge>;
      case "edited":
        return <Badge variant="secondary">נערך</Badge>;
      default:
        return <Badge variant="outline">אוטומטי</Badge>;
    }
  };

  // Format hours in Hebrew
  const formatHoursHe = (start: string | null, end: string | null): string => {
    if (!start || !end) return "—";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes < 0) return "—";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} שעות ${minutes > 0 ? `ו-${minutes} דקות` : ''}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">שעות עבודה</h1>
          <p className="text-muted-foreground">מעקב שעות כניסה ויציאה</p>
        </div>

        {/* Employee: My Hours Today */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              השעות שלי היום
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySession.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                <span className="text-muted-foreground">טוען...</span>
              </div>
            ) : !session ? (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground flex-1">לא נרשמה כניסה היום</p>
                <Button onClick={handleClockIn} disabled={clockIn.isPending} className="gap-2">
                  <Play className="h-4 w-4" />
                  כניסה לעבודה
                </Button>
              </div>
            ) : editing ? (
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">כניסה:</span>
                  <Input
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-32"
                    dir="ltr"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">יציאה:</span>
                  <Input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-32"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} disabled={updateSession.isPending} size="sm">
                    שמור
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-wrap items-center gap-6 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">כניסה</p>
                    <p className="text-xl font-bold" dir="ltr">{session.start_time?.substring(0, 5) || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">יציאה</p>
                    <p className="text-xl font-bold" dir="ltr">{session.end_time?.substring(0, 5) || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">סה״כ</p>
                    <p className="text-xl font-bold text-primary">
                      {formatHoursHe(session.start_time, session.end_time)}
                    </p>
                  </div>
                  <div className="mr-auto">
                    {statusBadge(session.status)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!session.end_time && (
                    <Button onClick={handleClockOut} disabled={clockOut.isPending} variant="destructive" className="gap-2">
                      <Square className="h-4 w-4" />
                      יציאה מהעבודה
                    </Button>
                  )}
                  {session.status !== "approved" && (
                    <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1">
                      <Edit2 className="h-4 w-4" />
                      ערוך
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager: All Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              שעות כל העובדים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allSessions.isLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-muted-foreground">טוען...</span>
              </div>
            ) : !allSessions.data?.length ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">אין רישומי שעות</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>עובד</TableHead>
                      <TableHead>תאריך</TableHead>
                      <TableHead>כניסה</TableHead>
                      <TableHead>יציאה</TableHead>
                      <TableHead>סה״כ</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSessions.data.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.profiles?.first_name} {s.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(s.date), "EEEE, d בMMMM", { locale: he })}
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">{s.start_time?.substring(0, 5) || "—"}</TableCell>
                        <TableCell dir="ltr" className="text-right">{s.end_time?.substring(0, 5) || "—"}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatHoursHe(s.start_time, s.end_time)}
                        </TableCell>
                        <TableCell>{statusBadge(s.status)}</TableCell>
                        <TableCell>
                          {s.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(s.id)}
                              disabled={approveSession.isPending}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                              אשר
                            </Button>
                          )}
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
    </AdminLayout>
  );
};

export default WorkHoursPage;
