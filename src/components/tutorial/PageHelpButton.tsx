import { useState, createElement } from 'react';
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

  const handleOpen = () => {
    setCurrentStep(0);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-300">
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
      )}
    </>
  );
}
