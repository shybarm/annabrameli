import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useWorkSessions, calculateHours } from "@/hooks/useWorkSessions";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Check, Edit2, Play, Square, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { MobilePageHeader, MobileListCard, MobileEmptyState } from "@/components/admin/mobile";

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
        return <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs">מאושר</Badge>;
      case "edited":
        return <Badge variant="secondary" className="text-[10px] sm:text-xs">נערך</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] sm:text-xs">אוטומטי</Badge>;
    }
  };

  // Format hours in Hebrew
  const formatHoursHe = (start: string | null, end: string | null): string => {
    if (!start || !end) return "-";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes < 0) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} שעות ${minutes > 0 ? `ו-${minutes} דק׳` : ''}`;
  };

  const formatHoursShort = (start: string | null, end: string | null): string => {
    if (!start || !end) return "-";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes < 0) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <AdminLayout>
      <PermissionGuard permission="canViewWorkHours">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <MobilePageHeader
            title="שעות עבודה"
            subtitle="מעקב שעות כניסה ויציאה"
          />

          {/* Employee: My Hours Today */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                השעות שלי היום
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {todaySession.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  <span className="text-sm text-muted-foreground">טוען...</span>
                </div>
              ) : !session ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground flex-1">לא נרשמה כניסה היום</p>
                  <Button onClick={handleClockIn} disabled={clockIn.isPending} size="sm" className="gap-2 w-full sm:w-auto">
                    <Play className="h-4 w-4" />
                    כניסה לעבודה
                  </Button>
                </div>
              ) : editing ? (
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">כניסה:</span>
                    <Input
                      type="time"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="w-28 h-9"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">יציאה:</span>
                    <Input
                      type="time"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="w-28 h-9"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={handleSaveEdit} disabled={updateSession.isPending} size="sm" className="flex-1 sm:flex-none">
                      שמור
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="flex-1 sm:flex-none">
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-3 sm:mb-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">כניסה</p>
                      <p className="text-lg sm:text-xl font-bold" dir="ltr">{session.start_time?.substring(0, 5) || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">יציאה</p>
                      <p className="text-lg sm:text-xl font-bold" dir="ltr">{session.end_time?.substring(0, 5) || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">סה״כ</p>
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        {formatHoursShort(session.start_time, session.end_time)}
                      </p>
                    </div>
                    <div className="mr-auto">
                      {statusBadge(session.status)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!session.end_time && (
                      <Button onClick={handleClockOut} disabled={clockOut.isPending} variant="destructive" size="sm" className="gap-2">
                        <Square className="h-4 w-4" />
                        יציאה
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
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                שעות כל העובדים
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {allSessions.isLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  <span className="text-muted-foreground">טוען...</span>
                </div>
              ) : !allSessions.data?.length ? (
                <MobileEmptyState
                  icon={<Clock className="h-12 w-12" />}
                  title="אין רישומי שעות"
                />
              ) : (
                <>
                  {/* Mobile: Card View */}
                  <div className="space-y-2 sm:hidden">
                    {allSessions.data.map((s: any) => (
                      <MobileListCard
                        key={s.id}
                        avatar={
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {s.profiles?.first_name?.charAt(0) || '?'}{s.profiles?.last_name?.charAt(0) || ''}
                          </div>
                        }
                        title={`${s.profiles?.first_name || ''} ${s.profiles?.last_name || ''}`}
                        subtitle={format(new Date(s.date), "EEEE, d/M", { locale: he })}
                        metric={
                          <div className="text-left">
                            <p className="text-sm font-bold text-primary">
                              {formatHoursShort(s.start_time, s.end_time)}
                            </p>
                            <p className="text-[10px] text-muted-foreground" dir="ltr">
                              {s.start_time?.substring(0, 5) || '-'} - {s.end_time?.substring(0, 5) || '-'}
                            </p>
                          </div>
                        }
                        status={statusBadge(s.status)}
                        primaryAction={
                          s.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(s.id);
                              }}
                              disabled={approveSession.isPending}
                              className="h-7 px-2 text-xs gap-1"
                            >
                              <Check className="h-3 w-3" />
                              אשר
                            </Button>
                          )
                        }
                      />
                    ))}
                  </div>

                  {/* Desktop: Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-right border-b">
                          <th className="pb-3 font-medium">עובד</th>
                          <th className="pb-3 font-medium">תאריך</th>
                          <th className="pb-3 font-medium">כניסה</th>
                          <th className="pb-3 font-medium">יציאה</th>
                          <th className="pb-3 font-medium">סה״כ</th>
                          <th className="pb-3 font-medium">סטטוס</th>
                          <th className="pb-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allSessions.data.map((s: any) => (
                          <tr key={s.id} className="hover:bg-muted/50">
                            <td className="py-3 font-medium">
                              {s.profiles?.first_name} {s.profiles?.last_name}
                            </td>
                            <td className="py-3">
                              {format(new Date(s.date), "EEEE, d בMMMM", { locale: he })}
                            </td>
                            <td className="py-3" dir="ltr">{s.start_time?.substring(0, 5) || "-"}</td>
                            <td className="py-3" dir="ltr">{s.end_time?.substring(0, 5) || "-"}</td>
                            <td className="py-3 font-medium text-primary">
                              {formatHoursHe(s.start_time, s.end_time)}
                            </td>
                            <td className="py-3">{statusBadge(s.status)}</td>
                            <td className="py-3">
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </AdminLayout>
  );
};

export default WorkHoursPage;