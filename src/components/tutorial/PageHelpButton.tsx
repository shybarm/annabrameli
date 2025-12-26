import { useState, useEffect, createElement } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { TutorialStep } from './TutorialStep';
import { PageTutorial } from './tutorialData';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PageHelpButtonProps {
  tutorial: PageTutorial;
}

export function PageHelpButton({ tutorial }: PageHelpButtonProps) {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Handle element highlighting
  useEffect(() => {
    if (!show) return;
    
    const step = tutorial.steps[currentStep];
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
  }, [show, currentStep, tutorial.steps]);

  const handleOpen = () => {
    setCurrentStep(0);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    // Clean up highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  };

  const handleNext = () => {
    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorial.steps[currentStep];

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpen}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">עזרה</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>הצג הדרכה לדף זה</p>
        </TooltipContent>
      </Tooltip>

      {show && (
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
                totalSteps={tutorial.steps.length}
                onNext={handleNext}
                onPrev={handlePrev}
                onClose={handleClose}
                isFirst={currentStep === 0}
                isLast={currentStep === tutorial.steps.length - 1}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
