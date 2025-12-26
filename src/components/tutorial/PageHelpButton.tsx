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
  const [dialogPosition, setDialogPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');

  // Handle element highlighting and dialog positioning
  useEffect(() => {
    if (!show) return;
    
    const step = tutorial.steps[currentStep];
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
          
          {/* Tutorial dialog - positioned dynamically to avoid covering highlighted element */}
          <div className={`fixed ${positionClasses[dialogPosition]} z-[100] pointer-events-none animate-in fade-in duration-300 max-w-sm`}>
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
                arrowDirection={step.highlightSelector ? arrowDirectionMap[dialogPosition] : undefined}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
