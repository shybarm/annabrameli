import { useState, useEffect } from 'react';
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
  const { todaySession, clockIn } = useWorkSessions();
  const { selectedClinicId } = useClinicContext();

  useEffect(() => {
    if (!isStaff) return;

    // Check if already dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION_MS) {
        return; // Still within dismiss period
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    // Wait for session data to load
    if (todaySession.isLoading) return;

    // Check if no active session exists
    const session = todaySession.data;
    const hasNoActiveSession = !session || session.end_time !== null;

    if (hasNoActiveSession) {
      // Small delay to avoid flash on page load
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isStaff, todaySession.data, todaySession.isLoading]);

  const handleStartWork = async () => {
    try {
      await clockIn.mutateAsync(selectedClinicId || undefined);
      toast.success('שעות העבודה התחילו');
      setOpen(false);
    } catch (error) {
      toast.error('שגיאה בהתחלת שעות עבודה');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setOpen(false);
  };

  if (!isStaff) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
