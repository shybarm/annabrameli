import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw, Stethoscope } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AppointmentDetails {
  date: string;
  time: string;
  type: string;
  clinic: string;
}

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

export default function VerifyBooking() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('חסר טוקן אימות');
      return;
    }

    verifyToken();
  }, [token]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyToken = async () => {
    try {
      const response = await supabase.functions.invoke('verify-booking', {
        body: { token }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success) {
        setStatus('success');
        setAppointment(data.appointment);
      } else {
        if (data.code === 'EXPIRED_TOKEN' || data.code === 'INVALID_TOKEN') {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setErrorMessage(data.error || 'שגיאה באימות');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'שגיאה באימות התור');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !token) return;
    
    setIsResending(true);
    try {
      const response = await supabase.functions.invoke('verify-booking', {
        body: { token, action: 'resend' }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success) {
        toast({
          title: 'נשלח בהצלחה',
          description: 'קישור אימות חדש נשלח למייל שלך',
        });
        setResendCooldown(60);
      } else {
        if (data.waitSeconds) {
          setResendCooldown(data.waitSeconds);
        }
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן לשלוח קישור חדש',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md border-medical-200">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Stethoscope className="h-6 w-6 text-medical-600" />
            <span className="text-lg font-medium text-medical-800">ד״ר אנה ברמלי</span>
          </div>

          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-medical-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">מאמת את התור...</h2>
              <p className="text-muted-foreground">אנא המתן</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">התור אומת ונקבע בהצלחה!</h2>
              <p className="text-muted-foreground mb-6">התור שלך אושר ונרשם במערכת.</p>
              
              {appointment && (
                <div className="bg-muted p-4 rounded-lg mb-6 text-right">
                  <p className="text-sm text-muted-foreground mb-1">פרטי התור:</p>
                  {appointment.clinic && (
                    <p className="font-medium">{appointment.clinic}</p>
                  )}
                  <p className="font-medium">{appointment.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.date} בשעה {appointment.time}
                  </p>
                </div>
              )}
              
              <Button onClick={() => window.location.href = '/'} className="w-full">
                חזרה לאתר
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">הקישור לא תקין או שפג תוקפו</h2>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              <Link to="/book">
                <Button className="w-full">קביעת תור חדש</Button>
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">הקישור לא תקין או שפג תוקפו</h2>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleResend} 
                  disabled={isResending || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 ml-2" />
                  )}
                  {resendCooldown > 0 
                    ? `שליחה חוזרת בעוד ${resendCooldown} שניות` 
                    : 'שלח קישור חדש למייל'}
                </Button>
                
                <Link to="/book">
                  <Button className="w-full">קביעת תור חדש</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
