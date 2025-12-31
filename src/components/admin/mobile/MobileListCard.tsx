import { ReactNode, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MobileListCardAction {
  label: string;
  icon?: ReactNode;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'destructive';
}

interface MobileListCardProps {
  /** Left side avatar/icon */
  avatar?: ReactNode;
  /** Main title text */
  title: string;
  /** Secondary info displayed inline with title */
  titleBadge?: ReactNode;
  /** Subtitle row */
  subtitle?: ReactNode;
  /** Key metric displayed prominently */
  metric?: string | ReactNode;
  /** Additional details shown in collapsible section */
  expandedContent?: ReactNode;
  /** Status badge */
  status?: ReactNode;
  /** Actions shown in dropdown on mobile */
  actions?: MobileListCardAction[];
  /** Primary action button (always visible) */
  primaryAction?: ReactNode;
  /** Card click handler */
  onClick?: () => void;
  /** Additional classes */
  className?: string;
  /** Border accent color */
  borderColor?: string;
  /** Card background variant */
  variant?: 'default' | 'warning' | 'success' | 'error' | 'muted';
}

const variantStyles = {
  default: '',
  warning: 'bg-amber-50/50 border-amber-200',
  success: 'bg-green-50/50 border-green-200',
  error: 'bg-red-50/50 border-red-200',
  muted: 'bg-muted/50',
};

/**
 * Mobile-optimized list card matching Dashboard design.
 * - Compact layout with avatar, title, badge, metric
 * - Collapsible details section
 * - Actions in dropdown menu
 * - Click to navigate
 */
export function MobileListCard({
  avatar,
  title,
  titleBadge,
  subtitle,
  metric,
  expandedContent,
  status,
  actions,
  primaryAction,
  onClick,
  className,
  borderColor,
  variant = 'default',
}: MobileListCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all overflow-hidden",
        variantStyles[variant],
        borderColor && `border-r-4 ${borderColor}`,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Main Row */}
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Avatar */}
          {avatar && (
            <div className="flex-shrink-0">
              {avatar}
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                {title}
              </h3>
              {titleBadge}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {subtitle}
              </div>
            )}
            
            {/* Status */}
            {status && (
              <div className="mt-1.5">
                {status}
              </div>
            )}
          </div>
          
          {/* Right Side: Metric + Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Metric */}
            {metric && (
              <div className="text-left">
                {typeof metric === 'string' ? (
                  <p className="text-base sm:text-lg font-bold">{metric}</p>
                ) : (
                  metric
                )}
              </div>
            )}
            
            {/* Primary Action */}
            {primaryAction}
            
            {/* Dropdown Actions */}
            {actions && actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-popover">
                  {actions.map((action, idx) => (
                    <DropdownMenuItem 
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(e);
                      }}
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                      {action.icon && <span className="ml-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Expanded Content */}
        {expandedContent && (
          <>
            <div className={cn(
              "overflow-hidden transition-all duration-200",
              expanded ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
            )}>
              <div className="pt-2 border-t border-border/50">
                {expandedContent}
              </div>
            </div>
            
            {/* Expand Toggle - Mobile Only */}
            <button
              onClick={handleExpandClick}
              className="w-full flex items-center justify-center gap-1 pt-2 mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/30 sm:hidden"
            >
              <span>{expanded ? 'הצג פחות' : 'הצג עוד'}</span>
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform duration-200",
                expanded && "rotate-180"
              )} />
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
