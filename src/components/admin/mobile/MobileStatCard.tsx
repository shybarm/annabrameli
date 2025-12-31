import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileStatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
  variant?: 'default' | 'blue' | 'orange' | 'green' | 'purple' | 'red';
}

const variantStyles = {
  default: 'bg-card',
  blue: 'bg-blue-50 border-blue-200',
  orange: 'bg-orange-50 border-orange-200',
  green: 'bg-green-50 border-green-200',
  purple: 'bg-purple-50 border-purple-200',
  red: 'bg-red-50 border-red-200',
};

const valueColors = {
  default: 'text-foreground',
  blue: 'text-blue-700',
  orange: 'text-orange-700',
  green: 'text-green-700',
  purple: 'text-purple-700',
  red: 'text-red-700',
};

const labelColors = {
  default: 'text-muted-foreground',
  blue: 'text-blue-600',
  orange: 'text-orange-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
};

/**
 * Mobile-optimized stat card matching Dashboard design.
 * - Compact height on mobile
 * - Color variants for semantic meaning
 * - Centered content
 */
export function MobileStatCard({ 
  value, 
  label, 
  icon,
  className,
  valueClassName,
  variant = 'default'
}: MobileStatCardProps) {
  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardContent className="py-3 sm:py-4 text-center">
        {icon && (
          <div className="flex justify-center mb-1">
            {icon}
          </div>
        )}
        <div className={cn(
          "text-2xl sm:text-3xl font-bold",
          valueColors[variant],
          valueClassName
        )}>
          {value}
        </div>
        <p className={cn("text-xs sm:text-sm", labelColors[variant])}>
          {label}
        </p>
      </CardContent>
    </Card>
  );
}
