import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, Calendar, Receipt, MessageSquare, 
  Settings, X, ChevronLeft, ChevronRight, Wallet, History,
  Stethoscope, UserPlus, ClipboardList, Bell, Clock, CreditCard,
  FileText, PenTool, Lightbulb
} from 'lucide-react';

interface TourStep {
  path: string;
  pageName: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightSelector?: string;
  tip?: string;
}

const tourSteps: TourStep[] = [
  // Dashboard - 3 steps
  {
    path: '/admin',
    pageName: 'לוח בקרה',
    title: 'ברוכים הבאים! 🎉',
    description: 'זהו הסיור המלא במערכת. נעבור יחד על כל הדפים והפיצ\'רים החשובים. בואו נתחיל!',
    icon: <Stethoscope className="h-6 w-6" />,
  },
  {
    path: '/admin',
    pageName: 'לוח בקרה',
    title: 'סטטיסטיקות מהירות',
    description: 'כאן תראה במבט אחד: כמה תורים יש היום, כמה מטופלים חדשים החודש, והכנסות. המספרים מתעדכנים בזמן אמת.',
    icon: <LayoutDashboard className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="stats-cards"]',
    tip: 'לחץ על כרטיס כדי לראות פירוט נוסף'
  },
  {
    path: '/admin',
    pageName: 'לוח בקרה',
    title: 'תורים להיום',
    description: 'רשימת כל התורים המתוכננים להיום. תוכל לראות את הסטטוס של כל תור (מתוכנן, בחדר המתנה, בטיפול, הושלם) ולעדכן אותו.',
    icon: <Calendar className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="today-appointments"]',
    tip: 'לחץ על תור כדי לפתוח את פרטי הביקור'
  },

  // Patients - 4 steps
  {
    path: '/admin/patients',
    pageName: 'מטופלים',
    title: 'רשימת המטופלים',
    description: 'כאן תמצא את כל המטופלים במרפאה. תוכל לחפש לפי שם, טלפון, או מספר ת.ז. הרשימה מציגה את הפרטים החשובים של כל מטופל.',
    icon: <Users className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="patients-list"]',
  },
  {
    path: '/admin/patients',
    pageName: 'מטופלים',
    title: 'הוספת מטופל חדש',
    description: 'לחץ על "מטופל חדש" כדי להוסיף מטופל למערכת. מלא את הפרטים הבסיסיים - שם, טלפון, ת.ז. שאר הפרטים יתמלאו בטופס הקליטה.',
    icon: <UserPlus className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="new-patient-btn"]',
  },
  {
    path: '/admin/patients',
    pageName: 'מטופלים',
    title: 'טופס קליטה דיגיטלי',
    description: 'במקום למלא טפסים ידנית - שלח למטופל לינק לטופס קליטה דיגיטלי! המטופל ימלא היסטוריה רפואית, אלרגיות, תרופות - והכל יופיע אוטומטית בכרטיס שלו.',
    icon: <ClipboardList className="h-6 w-6" />,
    tip: 'הטופס נשלח בWhatsApp או SMS - קל ונוח!'
  },
  {
    path: '/admin/patients',
    pageName: 'מטופלים',
    title: 'כרטיס מטופל',
    description: 'לחץ על מטופל כדי לראות את הכרטיס המלא שלו: פרטים אישיים, היסטוריה רפואית, תורים, מסמכים, וחשבוניות - הכל במקום אחד.',
    icon: <FileText className="h-6 w-6" />,
    tip: 'תוכל להעלות מסמכים, תמונות, והפניות לכרטיס'
  },

  // Appointments - 5 steps
  {
    path: '/admin/appointments',
    pageName: 'תורים',
    title: 'לוח התורים',
    description: 'כאן תנהל את כל התורים. תוכל לראות את לוח השבועי או החודשי, לסנן לפי סטטוס, ולחפש תורים ספציפיים.',
    icon: <Calendar className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="calendar-view"]',
  },
  {
    path: '/admin/appointments',
    pageName: 'תורים',
    title: 'קביעת תור חדש',
    description: 'לחץ על "תור חדש" כדי לקבוע תור. בחר מטופל, סוג תור (בדיקה, טיפול, מעקב), תאריך ושעה. המערכת תמנע התנגשויות אוטומטית.',
    icon: <Calendar className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="new-appointment-btn"]',
  },
  {
    path: '/admin/appointments',
    pageName: 'תורים',
    title: 'סטטוס התור',
    description: 'כל תור עובר שלבים: מתוכנן (כחול) → בחדר המתנה (צהוב) → חדר רופא (סגול) → הושלם (ירוק). שנה סטטוס בלחיצה - והצוות רואה בזמן אמת!',
    icon: <Stethoscope className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="appointment-status"]',
    tip: 'הסטטוס נראה לכל הצוות בזמן אמת'
  },
  {
    path: '/admin/appointments',
    pageName: 'תורים',
    title: 'סיכום ביקור',
    description: 'לחץ על תור כדי לכתוב סיכום ביקור. תוכל להקליד או להקליט קולית (והמערכת תתמלל!). יש גם כלי מדידה כמו ACT, SCORAD.',
    icon: <PenTool className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="appointments-list"]',
    tip: 'אחרי הסיכום - חתום דיגיטלית ושלח למטופל'
  },
  {
    path: '/admin/appointments',
    pageName: 'תורים',
    title: 'תזכורות אוטומטיות',
    description: 'המערכת שולחת תזכורות אוטומטיות למטופלים לפני התור - ב-WhatsApp ובמייל. תוכל להגדיר כמה שעות לפני.',
    icon: <Bell className="h-6 w-6" />,
    tip: 'מפחית No-Shows משמעותית!'
  },

  // Billing - 3 steps
  {
    path: '/admin/billing',
    pageName: 'חיוב',
    title: 'רשימת חשבוניות',
    description: 'כאן תראה את כל החשבוניות. סנן לפי סטטוס: טיוטה, נשלחה, שולמה, או באיחור. צפה בסיכום ההכנסות.',
    icon: <Receipt className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="invoices-list"]',
  },
  {
    path: '/admin/billing',
    pageName: 'חיוב',
    title: 'יצירת חשבונית',
    description: 'לחץ "חשבונית חדשה", בחר מטופל, הוסף פריטים (ביקור, טיפול, בדיקה), והמערכת תחשב סכום כולל עם מע"מ.',
    icon: <CreditCard className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="new-invoice-btn"]',
  },
  {
    path: '/admin/billing',
    pageName: 'חיוב',
    title: 'שליחה ותשלום',
    description: 'שלח חשבונית במייל או WhatsApp. המטופל יקבל לינק לתשלום. כשהוא משלם - הסטטוס מתעדכן אוטומטית.',
    icon: <Receipt className="h-6 w-6" />,
    tip: 'תוכל גם להדפיס או לייצא ל-PDF'
  },

  // Expenses - 2 steps
  {
    path: '/admin/expenses',
    pageName: 'הוצאות',
    title: 'מעקב הוצאות',
    description: 'תעד את כל הוצאות המרפאה: שכירות, חשמל, ציוד, חומרים מתכלים, ועוד. חשוב לניהול פיננסי נכון.',
    icon: <Wallet className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="expenses-list"]',
  },
  {
    path: '/admin/expenses',
    pageName: 'הוצאות',
    title: 'הוספת הוצאה',
    description: 'לחץ "הוצאה חדשה", בחר קטגוריה (שכירות, ציוד, משכורות...), הזן סכום ותאריך. תוכל גם להגדיר הוצאות חוזרות.',
    icon: <Wallet className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="new-expense-btn"]',
    tip: 'השווה הכנסות מול הוצאות בדוחות'
  },

  // Messages - 1 step
  {
    path: '/admin/messages',
    pageName: 'הודעות',
    title: 'תיבת הודעות',
    description: 'כאן תקבל הודעות מהמטופלים. תוכל לקרוא ולהשיב. כל התכתובת נשמרת ומתועדת בכרטיס המטופל.',
    icon: <MessageSquare className="h-6 w-6" />,
    tip: 'הודעות חדשות מסומנות כלא נקראו'
  },

  // Team - 1 step
  {
    path: '/admin/team',
    pageName: 'צוות',
    title: 'ניהול צוות',
    description: 'הזמן רופאים, מזכירות, ואנשי צוות נוספים. קבע הרשאות לכל אחד - מי יכול לראות מה ולעשות מה.',
    icon: <Users className="h-6 w-6" />,
    tip: 'כל אחד יכול להתחבר עם המייל שלו'
  },

  // Audit Log - 1 step
  {
    path: '/admin/audit-log',
    pageName: 'יומן ביקורת',
    title: 'מעקב שינויים',
    description: 'כל פעולה במערכת נרשמת כאן: מי שינה, מה שינה, ומתי. חשוב לאבטחה, לתיעוד רפואי, ולעמידה ברגולציה.',
    icon: <History className="h-6 w-6" />,
    tip: 'סנן לפי משתמש, טבלה, או תאריך'
  },

  // Settings - 2 steps
  {
    path: '/admin/settings',
    pageName: 'הגדרות',
    title: 'הגדרות המרפאה',
    description: 'הגדר את פרטי המרפאה, שעות פעילות לכל יום, והגדרות תורים (זמן בין תורים, מקסימום תורים ביום).',
    icon: <Settings className="h-6 w-6" />,
  },
  {
    path: '/admin/settings',
    pageName: 'הגדרות',
    title: 'תזכורות אוטומטיות',
    description: 'הגדר מתי לשלוח תזכורות למטופלים: 24 שעות לפני, שעתיים לפני, או כל זמן שתבחר. בחר WhatsApp, מייל, או שניהם.',
    icon: <Bell className="h-6 w-6" />,
  },
  {
    path: '/admin/settings',
    pageName: 'הגדרות',
    title: 'סיימנו! 🎉',
    description: 'זהו! עברנו על כל הפיצ\'רים החשובים. בכל דף יש כפתור 💡 עזרה שמציג הדרכה ספציפית לאותו דף. בהצלחה!',
    icon: <Lightbulb className="h-6 w-6" />,
    tip: 'תמיד אפשר להפעיל את ההדרכה מחדש מההגדרות'
  },
];

interface FullAppTourProps {
  onComplete: () => void;
}

export function FullAppTour({ onComplete }: FullAppTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Navigate to the correct page when step changes
  useEffect(() => {
    if (location.pathname !== step.path) {
      setIsTransitioning(true);
      navigate(step.path);
      // Wait for navigation to complete
      const timer = setTimeout(() => setIsTransitioning(false), 600);
      return () => clearTimeout(timer);
    }
  }, [currentStep, step.path, navigate, location.pathname]);

  // Highlight current element and position dialog
  useEffect(() => {
    if (isTransitioning) return;
    
    // Clean up previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    if (step.highlightSelector) {
      const timer = setTimeout(() => {
        const element = document.querySelector(step.highlightSelector!);
        if (element) {
          element.classList.add('tutorial-highlight');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Calculate best position for dialog based on element location
          const rect = element.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          const elementCenterX = rect.left + rect.width / 2;
          const elementCenterY = rect.top + rect.height / 2;
          
          // Position dialog on opposite side of the element
          if (elementCenterY < viewportHeight / 2) {
            setDialogPosition(elementCenterX < viewportWidth / 2 ? 'bottom-right' : 'bottom-left');
          } else {
            setDialogPosition(elementCenterX < viewportWidth / 2 ? 'top-right' : 'top-left');
          }
        } else {
          setDialogPosition('bottom-right');
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setDialogPosition('bottom-right');
    }
  }, [currentStep, step.highlightSelector, isTransitioning]);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Clean up highlights and complete
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    onComplete();
  }, [onComplete]);

  const positionClasses = {
    'top-left': 'top-4 left-4 md:top-4 md:left-4',
    'top-right': 'top-4 right-4 md:top-4 md:right-4',
    'bottom-left': 'bottom-4 left-4 md:bottom-4 md:left-4',
    'bottom-right': 'bottom-4 right-4 md:bottom-4 md:right-4',
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="tutorial-overlay" />
      
      {/* Tour dialog */}
      <div className={`fixed ${positionClasses[dialogPosition]} left-4 right-4 md:left-auto md:w-[420px] z-[100] animate-in slide-in-from-bottom duration-300`}>
        <Card className="border-2 border-primary shadow-2xl bg-background">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{step.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {step.pageName}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentStep + 1} / {tourSteps.length}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-foreground leading-relaxed">
                {step.description}
              </p>
              
              {step.tip && (
                <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{step.tip}</p>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="px-4 pb-2">
              <Progress value={progress} className="h-2" />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-4 pt-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0 || isTransitioning}
                size="sm"
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                הקודם
              </Button>

              <div className="flex gap-1 max-w-[120px] overflow-hidden">
                {tourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => !isTransitioning && setCurrentStep(index)}
                    disabled={isTransitioning}
                    className={`w-1.5 h-1.5 rounded-full transition-colors shrink-0 ${
                      index === currentStep 
                        ? 'bg-primary w-3' 
                        : index < currentStep 
                          ? 'bg-primary/50' 
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={isTransitioning}
                size="sm"
              >
                {currentStep === tourSteps.length - 1 ? 'סיום' : 'הבא'}
                {currentStep < tourSteps.length - 1 && <ChevronLeft className="h-4 w-4 mr-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}