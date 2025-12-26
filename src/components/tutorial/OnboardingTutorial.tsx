import { useState, useEffect } from 'react';
import { TutorialStep } from './TutorialStep';
import { onboardingSteps } from './tutorialData';
import { createElement } from 'react';

const ONBOARDING_KEY = 'clinic_onboarding_completed';

interface OnboardingTutorialProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function OnboardingTutorial({ forceShow, onComplete }: OnboardingTutorialProps) {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setShow(true);
      setCurrentStep(0);
      return;
    }

    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const [dialogPosition, setDialogPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');

  // Handle element highlighting and dialog positioning
  useEffect(() => {
    if (!show) return;
    
    const step = onboardingSteps[currentStep];
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
        // Element is in top half, put dialog at bottom
        setDialogPosition(elementCenterX < viewportWidth / 2 ? 'bottom-right' : 'bottom-left');
      } else {
        // Element is in bottom half, put dialog at top
        setDialogPosition(elementCenterX < viewportWidth / 2 ? 'top-right' : 'top-left');
      }
    } else {
      setDialogPosition('bottom-right');
    }
    
    return () => {
      // Clean up previous highlight
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
    };
  }, [show, currentStep]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
    // Clean up highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!show) return null;

  const step = onboardingSteps[currentStep];

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Arrow points toward the highlighted element (opposite of dialog position)
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
      
      {/* Tutorial dialog - positioned dynamically to avoid covering highlighted element */}
      <div className={`fixed ${positionClasses[dialogPosition]} z-[100] pointer-events-none animate-in fade-in duration-300 max-w-sm`}>
        <div className="pointer-events-auto">
          <TutorialStep
            title={step.title}
            description={step.description}
            icon={createElement(step.icon, { className: "h-5 w-5" })}
            stepNumber={currentStep + 1}
            totalSteps={onboardingSteps.length}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleComplete}
            isFirst={currentStep === 0}
            isLast={currentStep === onboardingSteps.length - 1}
            arrowDirection={step.highlightSelector ? arrowDirectionMap[dialogPosition] : undefined}
          />
        </div>
      </div>
    </>
  );
}

export function useOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
  };

  const isOnboardingComplete = () => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  };

  return { resetOnboarding, isOnboardingComplete };
}
