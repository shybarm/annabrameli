import { useState, useEffect } from 'react';
import { TutorialStep } from './TutorialStep';
import { Calendar, FileText, MessageCircle, ClipboardList, Settings } from 'lucide-react';
import { createElement } from 'react';

const PATIENT_ONBOARDING_KEY = 'patient_portal_onboarding_completed';

const patientOnboardingSteps = [
  {
    title: 'ברוכים הבאים לפורטל המטופלים!',
    description: 'זהו המרחב האישי שלך לניהול התורים, צפייה במסמכים ותקשורת עם הצוות הרפואי.',
    icon: Calendar,
  },
  {
    title: 'ניהול תורים',
    description: 'בלשונית "תורים" תוכל/י לראות את כל התורים שלך, לבקש תורים חדשים ולבטל תורים קיימים.',
    icon: Calendar,
    highlightSelector: '[value="appointments"]',
  },
  {
    title: 'סיכומי ביקורים',
    description: 'בלשונית "סיכומים" תוכל/י לצפות בסיכומי הביקורים הקודמים שלך, כולל תוכנית טיפול ותרופות.',
    icon: ClipboardList,
    highlightSelector: '[value="summaries"]',
  },
  {
    title: 'הודעות',
    description: 'שלח/י הודעות לצוות הרפואי ישירות מהפורטל. התשובות יופיעו כאן.',
    icon: MessageCircle,
    highlightSelector: '[value="messages"]',
  },
  {
    title: 'מסמכים',
    description: 'צפה/י במסמכים שלך והעלה מסמכים חדשים כמו תוצאות בדיקות או הפניות.',
    icon: FileText,
    highlightSelector: '[value="documents"]',
  },
  {
    title: 'פרופיל אישי',
    description: 'עדכן/י את פרטי הקשר שלך ואת ההעדפות האישיות בלשונית "פרופיל".',
    icon: Settings,
    highlightSelector: '[value="profile"]',
  },
];

interface PatientOnboardingTutorialProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function PatientOnboardingTutorial({ forceShow, onComplete }: PatientOnboardingTutorialProps) {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dialogPosition, setDialogPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');

  useEffect(() => {
    if (forceShow) {
      setShow(true);
      setCurrentStep(0);
      return;
    }
    // Auto-show disabled - only show when forceShow is true
  }, [forceShow]);

  // Handle element highlighting and dialog positioning
  useEffect(() => {
    if (!show) return;
    
    const step = patientOnboardingSteps[currentStep];
    if (!step?.highlightSelector) {
      setDialogPosition('bottom-right');
      return;
    }
    
    const element = document.querySelector(step.highlightSelector);
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
    
    return () => {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [show, currentStep]);

  const handleComplete = () => {
    localStorage.setItem(PATIENT_ONBOARDING_KEY, 'true');
    setShow(false);
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < patientOnboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!show) return null;

  const step = patientOnboardingSteps[currentStep];

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const arrowDirectionMap: Record<typeof dialogPosition, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = {
    'top-left': 'bottom-right',
    'top-right': 'bottom-left',
    'bottom-left': 'top-right',
    'bottom-right': 'top-left',
  };

  return (
    <>
      {/* Dark overlay behind highlighted element */}
      <div className="tutorial-overlay" />
      
      {/* Tutorial dialog */}
      <div className={`fixed ${positionClasses[dialogPosition]} z-[100] pointer-events-none animate-in fade-in duration-300 max-w-sm`}>
        <div className="pointer-events-auto">
          <TutorialStep
            title={step.title}
            description={step.description}
            icon={createElement(step.icon, { className: "h-5 w-5" })}
            stepNumber={currentStep + 1}
            totalSteps={patientOnboardingSteps.length}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleComplete}
            isFirst={currentStep === 0}
            isLast={currentStep === patientOnboardingSteps.length - 1}
            arrowDirection={step.highlightSelector ? arrowDirectionMap[dialogPosition] : undefined}
          />
        </div>
      </div>
    </>
  );
}

export function usePatientOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem(PATIENT_ONBOARDING_KEY);
  };

  const isOnboardingComplete = () => {
    return localStorage.getItem(PATIENT_ONBOARDING_KEY) === 'true';
  };

  return { resetOnboarding, isOnboardingComplete };
}
