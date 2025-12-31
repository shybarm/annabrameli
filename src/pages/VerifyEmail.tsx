import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

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
    <>
      <Helmet>
        <title>אימות אימייל | ד״ר אנה ברמלי</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen gradient-hero flex flex-col" dir="rtl">
        {/* Header */}
        <header className="py-6 px-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">א</span>
            </div>
            <div className="text-right">
              <h1 className="font-bold text-lg text-foreground">ד״ר אנה ברמלי</h1>
              <p className="text-xs text-muted-foreground">מרפאה לאלרגיה ואימונולוגיה</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Card className="shadow-medical border-border overflow-hidden">
              
              {/* Loading State */}
              {status === 'loading' && (
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">מאמת את האימייל...</h2>
                  <p className="text-muted-foreground">אנא המתן רגע</p>
                </CardContent>
              )}

              {/* Success State */}
              {status === 'success' && (
                <div className="text-center">
                  <CardHeader className="gradient-teal p-8">
                    <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary-foreground">האימייל אומת בהצלחה</h2>
                  </CardHeader>
                  
                  <CardContent className="p-8 text-right">
                    <p className="text-foreground mb-2">
                      תודה על אימות כתובת האימייל שלך.
                    </p>
                    <p className="text-muted-foreground mb-2">
                      בפעם הבאה שתקבע/י תור, אנא הקפד/י להשתמש באותה כתובת אימייל,
                    </p>
                    <p className="text-muted-foreground mb-8">
                      כך שנוכל לזהות אותך באופן אוטומטי ולמנוע יצירת כפילויות במערכת.
                    </p>
                    
                    <Button asChild className="w-full">
                      <Link to="/">חזרה לדף הבית</Link>
                    </Button>
                  </CardContent>
                </div>
              )}

              {/* Already Used State */}
              {status === 'used' && (
                <div className="text-center">
                  <CardHeader className="gradient-teal p-8">
                    <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary-foreground">האימייל כבר אומת</h2>
                  </CardHeader>
                  
                  <CardContent className="p-8 text-right">
                    <p className="text-muted-foreground mb-8">
                      האימייל שלך כבר אומת בעבר — אין צורך לבצע פעולה נוספת.
                    </p>
                    
                    <Button asChild className="w-full">
                      <Link to="/">חזרה לדף הבית</Link>
                    </Button>
                  </CardContent>
                </div>
              )}

              {/* Expired State */}
              {status === 'expired' && (
                <div className="text-center">
                  <CardHeader className="bg-destructive p-8">
                    <div className="w-20 h-20 bg-destructive-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-12 w-12 text-destructive-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-destructive-foreground">הקישור פג תוקף</h2>
                  </CardHeader>
                  
                  <CardContent className="p-8 text-right">
                    <p className="text-muted-foreground mb-8">
                      קישור האימות כבר אינו בתוקף. ניתן לבקש קישור חדש במהלך ביקור נוסף במרפאה.
                    </p>
                    
                    <Button asChild className="w-full">
                      <Link to="/">חזרה לדף הבית</Link>
                    </Button>
                  </CardContent>
                </div>
              )}

              {/* Error State */}
              {status === 'error' && (
                <div className="text-center">
                  <CardHeader className="bg-destructive p-8">
                    <div className="w-20 h-20 bg-destructive-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-12 w-12 text-destructive-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-destructive-foreground">שגיאה באימות</h2>
                  </CardHeader>
                  
                  <CardContent className="p-8 text-right">
                    <p className="text-muted-foreground mb-8">{errorMessage}</p>
                    
                    <Button asChild className="w-full">
                      <Link to="/">חזרה לדף הבית</Link>
                    </Button>
                  </CardContent>
                </div>
              )}
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 text-center border-t border-border bg-card/60">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} מרפאת ד״ר אנה ברמלי. כל הזכויות שמורות.
          </p>
        </footer>
      </div>
    </>
  );
}
