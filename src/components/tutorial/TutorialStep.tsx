import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, X, Sparkles, ArrowUpRight, ArrowUpLeft, ArrowDownRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStepProps {
  title: string;
  description: string;
  icon?: ReactNode;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
  arrowDirection?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function TutorialStep({
  title,
  description,
  icon,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  isFirst,
  isLast,
  arrowDirection
}: TutorialStepProps) {
  // Arrow pointing to the highlighted element
  const ArrowIndicator = () => {
    if (!arrowDirection) return null;
    
    const arrowConfig = {
      'top-left': { Icon: ArrowUpLeft, position: 'absolute -top-8 -left-2' },
      'top-right': { Icon: ArrowUpRight, position: 'absolute -top-8 -right-2' },
      'bottom-left': { Icon: ArrowDownLeft, position: 'absolute -bottom-8 -left-2' },
      'bottom-right': { Icon: ArrowDownRight, position: 'absolute -bottom-8 -right-2' },
    };
    
    const config = arrowConfig[arrowDirection];
    const IconComponent = config.Icon;
    
    return (
      <div className={cn(config.position, "text-primary animate-bounce")}>
        <IconComponent className="h-8 w-8" strokeWidth={2.5} />
      </div>
    );
  };

  return (
    <div className="relative">
      <ArrowIndicator />
      <Card className="w-full max-w-md shadow-xl border-2 border-primary/20 bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                {icon || <Sparkles className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  שלב {stepNumber} מתוך {totalSteps}
                </p>
                <h3 className="font-bold text-lg">{title}</h3>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i + 1 === stepNumber 
                    ? "w-6 bg-primary" 
                    : i + 1 < stepNumber 
                      ? "w-2 bg-primary/50" 
                      : "w-2 bg-muted"
                )}
              />
            ))}
          </div>

          <div className="flex gap-2 justify-between">
            <Button 
              variant="outline" 
              onClick={onPrev}
              disabled={isFirst}
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 ml-1" />
              הקודם
            </Button>
            <Button 
              onClick={isLast ? onClose : onNext}
              className="flex-1"
            >
              {isLast ? (
                <>
                  <Sparkles className="h-4 w-4 ml-1" />
                  סיימתי!
                </>
              ) : (
                <>
                  הבא
                  <ArrowLeft className="h-4 w-4 mr-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
