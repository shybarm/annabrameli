import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'used';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('חסר טוקן אימות');
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await supabase.functions.invoke('verify-email-token', {
        body: { token }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success) {
        setStatus('success');
      } else {
        if (data.code === 'EXPIRED_TOKEN') {
          setStatus('expired');
        } else if (data.code === 'ALREADY_USED') {
          setStatus('used');
        } else {
          setStatus('error');
        }
        setErrorMessage(data.error || 'שגיאה באימות');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'שגיאה באימות האימייל');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md border-blue-200 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Mail className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-medium text-blue-800">אימות אימייל</span>
          </div>

          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">מאמת את האימייל...</h2>
              <p className="text-muted-foreground">אנא המתן</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">האימייל אומת בהצלחה!</h2>
              <p className="text-muted-foreground mb-6">
                תודה שאימתת את כתובת האימייל שלך. 
                <br />
                מעכשיו נוכל לזהות אותך אוטומטית בביקורים הבאים.
              </p>
              
              <Button onClick={() => window.location.href = '/'} className="w-full">
                סגור
              </Button>
            </>
          )}

          {status === 'used' && (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">הקישור כבר נוצל</h2>
              <p className="text-muted-foreground mb-6">
                האימייל שלך כבר אומת בעבר.
              </p>
              
              <Button onClick={() => window.location.href = '/'} className="w-full">
                סגור
              </Button>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">הקישור פג תוקף</h2>
              <p className="text-muted-foreground mb-6">
                קישור האימות כבר אינו בתוקף.
                <br />
                ניתן לבקש קישור חדש דרך המרפאה.
              </p>
              
              <Button onClick={() => window.location.href = '/'} className="w-full">
                חזרה לאתר
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">שגיאה באימות</h2>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              
              <Button onClick={() => window.location.href = '/'} className="w-full">
                חזרה לאתר
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
