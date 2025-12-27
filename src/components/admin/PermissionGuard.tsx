import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserPermissions } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: keyof UserPermissions;
  adminOnly?: boolean;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  children, 
  permission, 
  adminOnly = false,
  fallback 
}: PermissionGuardProps) {
  const { hasPermission, isAdmin, loading, rolesLoading } = useAuth();
  const navigate = useNavigate();

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check admin-only access
  if (adminOnly && !isAdmin) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" dir="rtl">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">אין הרשאה</h2>
        <p className="text-muted-foreground mb-4">
          רק מנהלים יכולים לגשת לעמוד זה
        </p>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          חזרה ללוח הבקרה
        </Button>
      </div>
    );
  }

  // Check specific permission
  if (permission && !hasPermission(permission)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" dir="rtl">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">אין הרשאה</h2>
        <p className="text-muted-foreground mb-4">
          אין לך הרשאות גישה לעמוד זה
        </p>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          חזרה ללוח הבקרה
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
