import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Play } from 'lucide-react';
import { useWorkSessions } from '@/hooks/useWorkSessions';
import { useClinicContext } from '@/contexts/ClinicContext';
import { toast } from 'sonner';

const DISMISS_KEY = 'work_session_check_in_dismissed';
const DISMISS_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

interface WorkSessionCheckInModalProps {
  isStaff: boolean;
}

export function WorkSessionCheckInModal({ isStaff }: WorkSessionCheckInModalProps) {
  const [open, setOpen] = useState(false);
  const hasPromptedRef = useRef(false);
  const { todaySession, clockIn } = useWorkSessions();
  const { selectedClinicId } = useClinicContext();

  useEffect(() => {
    // Reset ref when isStaff changes (e.g., logout/login)
    if (!isStaff) {
      hasPromptedRef.current = false;
      return;
    }

    // Don't prompt if already prompted this render cycle
    if (hasPromptedRef.current) return;

    // Wait for session data to fully load
    if (todaySession.isLoading || todaySession.isFetching) return;

    // Check if already dismissed recently (localStorage with 2-hour TTL)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (!isNaN(dismissedTime) && Date.now() - dismissedTime < DISMISS_DURATION_MS) {
        hasPromptedRef.current = true; // Mark as handled
        return; // Still within dismiss period
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    // Check if no active session exists (session is null OR end_time is set)
    const session = todaySession.data;
    const hasNoActiveSession = !session || session.end_time !== null;

    if (hasNoActiveSession) {
      hasPromptedRef.current = true; // Mark that we've prompted
      // Small delay to avoid flash on page load
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    } else {
      // User already has an active session - don't prompt
      hasPromptedRef.current = true;
    }
  }, [isStaff, todaySession.data, todaySession.isLoading, todaySession.isFetching]);

  const handleStartWork = async () => {
    try {
      await clockIn.mutateAsync(selectedClinicId || undefined);
      toast.success('שעות העבודה התחילו');
      setOpen(false);
      // Mark as handled so it doesn't show again
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (error: any) {
      if (error?.message === 'ALREADY_WORKING') {
        toast.info('את/ה כבר בעבודה');
        setOpen(false);
      } else {
        toast.error('שגיאה בהתחלת שעות עבודה');
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setOpen(false);
  };

  if (!isStaff) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleDismiss();
      else setOpen(val);
    }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">התחלת שעות עבודה</DialogTitle>
          <DialogDescription className="text-center">
            האם להתחיל מדידת שעות עבודה עכשיו?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row-reverse gap-2 sm:gap-2">
          <Button
            onClick={handleStartWork}
            disabled={clockIn.isPending}
            className="flex-1"
          >
            <Play className="h-4 w-4 ml-2" />
            {clockIn.isPending ? 'מתחיל...' : 'התחל'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={clockIn.isPending}
            className="flex-1"
          >
            לא עכשיו
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
