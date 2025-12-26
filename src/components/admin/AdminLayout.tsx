import { ReactNode, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ClinicSelector } from './ClinicSelector';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'לוח בקרה', exact: true },
  { href: '/admin/patients', icon: Users, label: 'מטופלים' },
  { href: '/admin/appointments', icon: Calendar, label: 'תורים' },
  { href: '/admin/billing', icon: Receipt, label: 'חיוב וחשבוניות' },
  { href: '/admin/expenses', icon: Wallet, label: 'הוצאות' },
  { href: '/admin/messages', icon: MessageSquare, label: 'הודעות' },
  { href: '/admin/team', icon: UsersRound, label: 'צוות' },
  { href: '/admin/audit-log', icon: History, label: 'יומן ביקורת' },
  { href: '/admin/settings', icon: Settings, label: 'הגדרות' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, isStaff, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has staff access
  if (!isStaff && roles.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">אין הרשאה</h1>
          <p className="text-gray-600 mb-4">אין לך הרשאות גישה לפאנל הניהול</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              חזרה לאתר
            </Button>
            <Button variant="outline" onClick={() => navigate('/portal')}>
              פורטל מטופלים
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Clinic Selector */}
      <div className="lg:mr-64">
        <ClinicSelector />
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-medical-600" />
          <span className="font-semibold text-medical-800">ניהול מרפאה</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-40 h-screen w-64 bg-white border-l transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-4 border-b">
            <Stethoscope className="h-8 w-8 text-medical-600" />
            <div>
              <h2 className="font-bold text-medical-800">ד״ר אנה ברמלי</h2>
              <p className="text-xs text-muted-foreground">מערכת ניהול</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.href
                  : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-medical-100 text-medical-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <Separator />

          {/* User section */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <UserCircle className="h-10 w-10 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
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
                className="flex-1"
                onClick={() => navigate('/')}
              >
                <ChevronLeft className="h-4 w-4 ml-1" />
                לאתר
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:mr-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
