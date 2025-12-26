import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  LayoutDashboard, Users, Calendar, Receipt, MessageSquare, 
  Settings, X, ChevronLeft, ChevronRight, Wallet, History,
  Stethoscope, FileText, ClipboardList, Calculator, Share2
} from 'lucide-react';

interface TourStep {
  path: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightSelector?: string;
}

const tourSteps: TourStep[] = [
  {
    path: '/admin',
    title: 'לוח הבקרה',
    description: 'נקודת ההתחלה שלך! כאן תראה את כל המידע החשוב במבט אחד - תורים להיום, סטטיסטיקות, ופעילות אחרונה.',
    icon: <LayoutDashboard className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="stats-cards"]'
  },
  {
    path: '/admin/patients',
    title: 'ניהול מטופלים',
    description: 'כאן תנהל את כל המטופלים. תוכל להוסיף מטופל חדש, לחפש מטופלים קיימים, ולשלוח טפסי קליטה דיגיטליים.',
    icon: <Users className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="patients-list"]'
  },
  {
    path: '/admin/appointments',
    title: 'ניהול תורים',
    description: 'כאן תקבע ותנהל תורים. תוכל לראות את לוח הזמנים, לשנות סטטוסים (מתוכנן → בחדר המתנה → בטיפול → הושלם), ולכתוב סיכומי ביקור.',
    icon: <Calendar className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="calendar-view"]'
  },
  {
    path: '/admin/billing',
    title: 'חיוב וחשבוניות',
    description: 'כאן תנהל את החיוב. צור חשבוניות, עקוב אחרי תשלומים, ושלח חשבוניות למטופלים במייל או WhatsApp.',
    icon: <Receipt className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="invoices-list"]'
  },
  {
    path: '/admin/expenses',
    title: 'ניהול הוצאות',
    description: 'תעד את הוצאות המרפאה - שכירות, ציוד, חומרים ועוד. תוכל לראות דוחות ולנתח את ההוצאות לפי קטגוריות.',
    icon: <Wallet className="h-6 w-6" />,
    highlightSelector: '[data-tutorial="expenses-list"]'
  },
  {
    path: '/admin/messages',
    title: 'הודעות',
    description: 'כאן תקבל הודעות מהמטופלים ותוכל להשיב להם. התקשורת נשמרת ומתועדת.',
    icon: <MessageSquare className="h-6 w-6" />
  },
  {
    path: '/admin/team',
    title: 'צוות המרפאה',
    description: 'נהל את צוות המרפאה - הזמן רופאים, מזכירות ואנשי צוות נוספים. קבע הרשאות גישה לכל אחד.',
    icon: <Users className="h-6 w-6" />
  },
  {
    path: '/admin/audit-log',
    title: 'יומן ביקורת',
    description: 'עקוב אחרי כל השינויים במערכת - מי שינה מה ומתי. חשוב לאבטחה ולתיעוד רפואי.',
    icon: <History className="h-6 w-6" />
  },
  {
    path: '/admin/settings',
    title: 'הגדרות',
    description: 'הגדר את פרטי המרפאה, שעות פעילות, תזכורות אוטומטיות ועוד. זהו הדף האחרון בסיור! 🎉',
    icon: <Settings className="h-6 w-6" />
  }
];

interface FullAppTourProps {
  onComplete: () => void;
}

export function FullAppTour({ onComplete }: FullAppTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Navigate to the correct page when step changes
  useEffect(() => {
    if (location.pathname !== step.path) {
      setIsTransitioning(true);
      navigate(step.path);
      // Wait for navigation to complete
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, step.path, navigate, location.pathname]);

  // Highlight current element
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
        }
      }, 300);
      return () => clearTimeout(timer);
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

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 z-[90]" />
      
      {/* Tour dialog */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[420px] z-[100] animate-in slide-in-from-bottom duration-300">
        <Card className="border-2 border-primary shadow-2xl">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    שלב {currentStep + 1} מתוך {tourSteps.length}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
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
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                הקודם
              </Button>

              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep 
                        ? 'bg-primary' 
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