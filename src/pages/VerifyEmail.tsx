import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'used';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

  // Redirect to homepage after success
  useEffect(() => {
    if (status === 'success' || status === 'used') {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

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
      
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-cyan-50 flex flex-col" dir="rtl">
        {/* Header */}
        <header className="py-6 px-4 border-b border-teal-100 bg-white/80 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">א</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">ד״ר אנה ברמלי</h1>
              <p className="text-xs text-muted-foreground">מרפאה לאלרגיה ואימונולוגיה</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-teal-100 overflow-hidden">
              
              {status === 'loading' && (
                <div className="p-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">מאמת את האימייל...</h2>
                  <p className="text-muted-foreground">אנא המתן רגע</p>
                </div>
              )}

              {status === 'success' && (
                <div className="text-center">
                  {/* Success Header */}
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">האימייל אומת בהצלחה!</h2>
                  </div>
                  
                  {/* Success Content */}
                  <div className="p-8">
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      תודה שאימתת את כתובת האימייל שלך.
                      <br />
                      מעכשיו נוכל לזהות אותך אוטומטית בביקורים הבאים.
                    </p>
                    
                    <div className="bg-teal-50 rounded-xl p-4 mb-6 text-sm text-teal-700">
                      תועבר/י לדף הבית בעוד מספר שניות...
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/')} 
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    >
                      המשך לאתר
                    </Button>
                  </div>
                </div>
              )}

              {status === 'used' && (
                <div className="text-center">
                  {/* Already Used Header */}
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">האימייל כבר אומת</h2>
                  </div>
                  
                  {/* Already Used Content */}
                  <div className="p-8">
                    <p className="text-muted-foreground mb-6">
                      האימייל שלך כבר אומת בעבר — אין צורך לבצע פעולה נוספת.
                    </p>
                    
                    <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-700">
                      תועבר/י לדף הבית בעוד מספר שניות...
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/')} 
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    >
                      המשך לאתר
                    </Button>
                  </div>
                </div>
              )}

              {status === 'expired' && (
                <div className="text-center">
                  {/* Expired Header */}
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">הקישור פג תוקף</h2>
                  </div>
                  
                  {/* Expired Content */}
                  <div className="p-8">
                    <p className="text-muted-foreground mb-6">
                      קישור האימות כבר אינו בתוקף.
                      <br />
                      ניתן לבקש קישור חדש במהלך ביקור נוסף במרפאה.
                    </p>
                    
                    <Button 
                      onClick={() => navigate('/')} 
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    >
                      חזרה לאתר
                    </Button>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center">
                  {/* Error Header */}
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 p-8">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">שגיאה באימות</h2>
                  </div>
                  
                  {/* Error Content */}
                  <div className="p-8">
                    <p className="text-muted-foreground mb-6">{errorMessage}</p>
                    
                    <Button 
                      onClick={() => navigate('/')} 
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                    >
                      חזרה לאתר
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 text-center border-t border-teal-100 bg-white/60">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} מרפאת ד״ר אנה ברמלי. כל הזכויות שמורות.
          </p>
        </footer>
      </div>
    </>
  );
}
