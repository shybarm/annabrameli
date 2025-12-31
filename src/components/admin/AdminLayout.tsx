import { ReactNode, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, UserPermissions } from '@/hooks/useAuth';
import { useUnreadMessageCount } from '@/hooks/useAdminMessages';
import { useUnreviewedPatientsCount } from '@/hooks/useUnreviewedPatients';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  UserCircle,
  ChevronLeft,
  Wallet,
  UsersRound,
  History,
  BookOpen,
  Clock,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ClinicSelector } from './ClinicSelector';
import { useClinicContext } from '@/contexts/ClinicContext';
import { useClinics } from '@/hooks/useClinics';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  icon: any;
  label: string;
  exact?: boolean;
  requiredPermission?: keyof UserPermissions;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'לוח בקרה', exact: true },
  { href: '/admin/patients', icon: Users, label: 'מטופלים', requiredPermission: 'canViewPatients' },
  { href: '/admin/appointments', icon: Calendar, label: 'תורים', requiredPermission: 'canViewAppointments' },
  { href: '/admin/doctor-diary', icon: BookOpen, label: 'יומן רופא', requiredPermission: 'canViewAppointments' },
  { href: '/admin/cancellations', icon: XCircle, label: 'ביטולי תורים', requiredPermission: 'canViewAppointments' },
  { href: '/admin/billing', icon: Receipt, label: 'חיוב וחשבוניות', requiredPermission: 'canViewBilling' },
  { href: '/admin/expenses', icon: Wallet, label: 'הוצאות', requiredPermission: 'canViewBilling' },
  { href: '/admin/messages', icon: MessageSquare, label: 'הודעות' },
  { href: '/admin/team', icon: UsersRound, label: 'צוות', adminOnly: true },
  { href: '/admin/work-hours', icon: Clock, label: 'שעות עבודה' },
  { href: '/admin/audit-log', icon: History, label: 'לוג אבטחה', adminOnly: true },
  { href: '/admin/settings', icon: Settings, label: 'הגדרות', adminOnly: true },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, isStaff, isAdmin, signOut, roles, hasPermission } = useAuth();
  const { data: unreadCount } = useUnreadMessageCount();
  const { clinicTheme, selectedClinicId } = useClinicContext();
  const { data: unreviewedPatientsCount } = useUnreviewedPatientsCount(selectedClinicId);
  const { data: clinics } = useClinics();
  const hasMultipleClinics = clinics && clinics.length > 1;
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle smooth sidebar close animation
  const handleCloseSidebar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSidebarOpen(false);
      setIsClosing(false);
    }, 280);
  };

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
    setIsClosing(false);
  };

  const toggleSidebar = () => {
    if (sidebarOpen) {
      handleCloseSidebar();
    } else {
      handleOpenSidebar();
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (sidebarOpen) {
      handleCloseSidebar();
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has staff access
  if (!isStaff && roles.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="text-center glass-light rounded-2xl p-8 shadow-lg max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">אין הרשאה</h1>
          <p className="text-muted-foreground mb-6 text-sm">אין לך הרשאות גישה לפאנל הניהול</p>
          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="rounded-xl spring-bounce"
            >
              חזרה לאתר
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/portal')}
              className="rounded-xl spring-bounce"
            >
              פורטל מטופלים
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter(item => {
    // Admin-only items
    if (item.adminOnly && !isAdmin) return false;
    // Permission-based items
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false;
    return true;
  });

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      hasMultipleClinics ? clinicTheme.bg : "bg-background"
    )} dir="rtl">
      {/* Mobile header - Apple-style glass effect */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 glass-light border-b border-border/50 z-50 flex items-center justify-between px-4 safe-area-inset-top">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-10 w-10 rounded-xl tap-highlight spring-bounce hover:bg-primary/5 active:bg-primary/10"
        >
          <Menu className={cn(
            "h-5 w-5 transition-transform duration-300",
            sidebarOpen && "rotate-90 opacity-0"
          )} />
          <X className={cn(
            "h-5 w-5 absolute transition-transform duration-300",
            !sidebarOpen && "-rotate-90 opacity-0"
          )} />
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Stethoscope className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">ניהול מרפאה</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Clinic Selector - positioned after mobile header, before sidebar */}
      <div className="lg:mr-64 pt-14 lg:pt-0 relative z-40">
        <ClinicSelector />
      </div>


      {/* Sidebar - Apple-style with smooth animations */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 right-0 z-40 h-screen w-72 lg:w-64 bg-card border-l border-border/50 shadow-xl lg:shadow-none overflow-hidden',
          'lg:translate-x-0 transition-transform duration-300 ease-out',
          sidebarOpen && !isClosing ? 'translate-x-0' : '',
          isClosing ? '' : '',
          !sidebarOpen && !isClosing ? 'translate-x-full lg:translate-x-0' : '',
          hasMultipleClinics && clinicTheme.border
        )}
      >
        <div className="flex flex-col h-full safe-area-inset-top">
          {/* Logo section */}
          <div className="h-16 lg:h-16 flex items-center gap-3 px-5 border-b border-border/50 mt-14 lg:mt-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm">ד״ר אנה ברמלי</h2>
              <p className="text-xs text-muted-foreground">מערכת ניהול</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavItems.map((item, index) => {
                const isActive = item.exact
                  ? location.pathname === item.href
                  : location.pathname.startsWith(item.href);
                const isMessages = item.href === '/admin/messages';
                const isPatients = item.href === '/admin/patients';
                const badgeCount = isMessages 
                  ? unreadCount?.total || 0 
                  : isPatients 
                    ? unreviewedPatientsCount || 0 
                    : 0;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    style={{ animationDelay: `${index * 30}ms` }}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-sm font-medium',
                      'transition-all duration-200 ease-out tap-highlight spring-bounce',
                      'animate-fade-up',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted/80"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {item.label}
                    </div>
                    {badgeCount > 0 && (
                      <span className={cn(
                        "flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-semibold rounded-full transition-transform spring-bounce",
                        isPatients 
                          ? "bg-amber-500 text-white animate-pulse" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <Separator className="opacity-50" />

          {/* User section */}
          <div className="p-4 safe-area-inset-bottom">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {roles.join(', ') || 'משתמש'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl h-10 spring-bounce border-border/50 hover:bg-muted/50"
                onClick={() => navigate('/')}
              >
                <ChevronLeft className="h-4 w-4 ml-1" />
                לאתר
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="rounded-xl h-10 w-10 spring-bounce text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay - smooth fade */}
      {(sidebarOpen || isClosing) && (
        <div
          className={cn(
            "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 lg:hidden",
            isClosing ? "animate-[overlayFadeOut_0.28s_ease-out_forwards]" : "animate-[overlayFadeIn_0.2s_ease-out_forwards]"
          )}
          onClick={handleCloseSidebar}
        />
      )}

      {/* Main content */}
      <main className="lg:mr-64 min-h-screen overflow-x-hidden">
        <div className="p-4 lg:p-6 w-full max-w-full">{children}</div>
      </main>
    </div>
  );
}
