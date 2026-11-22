import { useMutation } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
export function GreenConnectionCheck() {
  const check = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('clinic-green-status', { body: {} });
      if (error || !data?.state) throw new Error();
      return {
        online: data.state === 'authorized',
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };
    },
  });
  return (
    <section className="clinic-week space-y-3">
      <h2 className="!text-lg">חיבור המרפאה לוואטסאפ</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={check.isPending} onClick={() => check.mutate()}>
          <RefreshCw />
          בדיקת חיבור GREEN API
        </Button>
        <span role="status">
          {check.isPending
            ? 'בודק חיבור…'
            : check.isError
              ? 'הבדיקה נכשלה. אפשר לרענן ולנסות שוב.'
              : check.data
                ? (check.data.online ? 'מחובר' : 'החיבור אינו פעיל') + ' · ' + check.data.time
                : ''}
        </span>
      </div>
    </section>
  );
}
