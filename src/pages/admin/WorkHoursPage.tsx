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
import { Clock, Check, Edit2 } from "lucide-react";
import { format } from "date-fns";

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
      toast.success("Clocked in");
    } catch {
      toast.error("Failed to clock in");
    }
  };

  const handleClockOut = async () => {
    if (!session) return;
    try {
      await clockOut.mutateAsync(session.id);
      toast.success("Clocked out");
    } catch {
      toast.error("Failed to clock out");
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
      toast.success("Hours updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleApprove = async (sessionId: string) => {
    try {
      await approveSession.mutateAsync(sessionId);
      toast.success("Approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "edited":
        return <Badge variant="secondary">Edited</Badge>;
      default:
        return <Badge variant="outline">Auto</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Work Hours</h1>

        {/* Employee: My Hours Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              My Hours Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySession.isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : !session ? (
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">Not clocked in</p>
                <Button onClick={handleClockIn} disabled={clockIn.isPending}>
                  Clock In
                </Button>
              </div>
            ) : editing ? (
              <div className="flex flex-wrap items-center gap-4">
                <Input
                  type="time"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="w-32"
                />
                <span>to</span>
                <Input
                  type="time"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleSaveEdit} disabled={updateSession.isPending}>
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <p>
                  <strong>Start:</strong> {session.start_time || "—"}
                </p>
                <p>
                  <strong>End:</strong> {session.end_time || "—"}
                </p>
                <p>
                  <strong>Total:</strong>{" "}
                  {calculateHours(session.start_time, session.end_time)}
                </p>
                {statusBadge(session.status)}
                {!session.end_time && (
                  <Button onClick={handleClockOut} disabled={clockOut.isPending}>
                    Clock Out
                  </Button>
                )}
                {session.status !== "approved" && (
                  <Button variant="outline" size="icon" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager: All Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>All Employee Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {allSessions.isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : !allSessions.data?.length ? (
              <p className="text-muted-foreground">No sessions found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSessions.data.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          {s.profiles?.first_name} {s.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(s.date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{s.start_time || "—"}</TableCell>
                        <TableCell>{s.end_time || "—"}</TableCell>
                        <TableCell>
                          {calculateHours(s.start_time, s.end_time)}
                        </TableCell>
                        <TableCell>{statusBadge(s.status)}</TableCell>
                        <TableCell>
                          {s.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(s.id)}
                              disabled={approveSession.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
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
