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

  // Handle element highlighting
  useEffect(() => {
    if (!show) return;
    
    const step = onboardingSteps[currentStep];
    if (!step?.highlightSelector) return;
    
    const element = document.querySelector(step.highlightSelector);
    if (element) {
      element.classList.add('tutorial-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <>
      {/* Dark overlay behind highlighted element */}
      <div className="tutorial-overlay" />
      
      {/* Tutorial dialog - positioned at top-left to avoid covering highlighted element */}
      <div className="fixed top-4 left-4 z-[100] pointer-events-none animate-in fade-in slide-in-from-left-4 duration-300">
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
