import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LogOut, Clock, Square } from 'lucide-react';
import { useWorkSessions } from '@/hooks/useWorkSessions';
import { toast } from 'sonner';

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => Promise<void>;
  hasActiveSession: boolean;
  activeSessionId?: string;
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onLogout,
  hasActiveSession,
  activeSessionId,
}: LogoutConfirmDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { clockOut } = useWorkSessions();

  const handleClockOutAndLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (activeSessionId) {
        await clockOut.mutateAsync(activeSessionId);
        toast.success('שעות העבודה נעצרו');
      }
      await onLogout();
    } catch (error) {
      toast.error('שגיאה ביציאה מהמערכת');
      setIsLoggingOut(false);
    }
  };

  const handleLogoutWithoutClockOut = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      toast.error('שגיאה ביציאה מהמערכת');
      setIsLoggingOut(false);
    }
  };

  // If no active session, just confirm logout
  if (!hasActiveSession) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle>יציאה מהמערכת</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לצאת מהמערכת?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleLogoutWithoutClockOut}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <LogOut className="h-4 w-4 ml-2" />
              {isLoggingOut ? 'יוצא...' : 'צא'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={isLoggingOut}>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Active session exists - show options
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader className="text-right">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-center">סיום שעות עבודה</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            לפני היציאה, האם לעצור את מדידת שעות העבודה?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleClockOutAndLogout}
            disabled={isLoggingOut}
            className="w-full"
          >
            <Square className="h-4 w-4 ml-2" />
            {isLoggingOut ? 'יוצא...' : 'עצור וצא'}
          </Button>
          <Button
            variant="outline"
            onClick={handleLogoutWithoutClockOut}
            disabled={isLoggingOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 ml-2" />
            צא בלי לעצור
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoggingOut}
            className="w-full"
          >
            ביטול
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
