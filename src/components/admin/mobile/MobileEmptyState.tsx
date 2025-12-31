import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Mobile-optimized empty state matching Dashboard design.
 * - Compact padding on mobile
 * - Centered content
 * - Optional action button
 */
export function MobileEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: MobileEmptyStateProps) {
  return (
    <Card className={cn("py-6 sm:py-8", className)}>
      <CardContent className="text-center">
        <div className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-base sm:text-lg font-medium text-foreground mb-1 sm:mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
