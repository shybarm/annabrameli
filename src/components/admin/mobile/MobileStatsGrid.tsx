import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileStatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Mobile-optimized stats grid matching Dashboard design.
 * - 2 columns on mobile by default
 * - Expands to more columns on larger screens
 */
export function MobileStatsGrid({ 
  children, 
  columns = 2,
  className 
}: MobileStatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <div className={cn(
      "grid gap-3 sm:gap-4",
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  );
}
