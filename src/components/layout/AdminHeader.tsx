import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useContactMessages';
import { User, Settings, LogOut, ChevronDown, ShieldAlert, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Fetch locked accounts count
  const { data: lockedCount } = useQuery({
    queryKey: ['locked-accounts-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rate_limits_for_admin');
      if (error) return 0;
      return (data as any[])?.filter(r => r.is_locked).length || 0;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleMobileNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/profile', label: 'Profile' },
    { path: '/admin/users', label: 'Nutzer' },
    { path: '/admin/categories', label: 'Kategorien' },
    { path: '/admin/cities', label: 'Städte' },
    { path: '/admin/reports', label: 'Meldungen' },
    { path: '/admin/messages', label: 'Nachrichten', badge: unreadCount },
    { path: '/admin/advertisements', label: 'Banner' },
    { path: '/admin/pending-payments', label: 'Zahlungen' },
    { path: '/admin/settings', label: 'Einstellungen' },
    { path: '/admin/dropdowns', label: 'Dropdowns' },
    { path: '/admin/analytics', label: 'Analytics' },
    { path: '/admin/performance', label: 'Performance' },
    { path: '/admin/rate-limits', label: 'Sicherheit', badge: lockedCount },
    { path: '/admin/export', label: 'Export' },
  ];

  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle>Admin Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  {navLinks.map((link) => (
                    <Button
                      key={link.path}
                      variant={isActive(link.path) ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => handleMobileNavClick(link.path)}
                    >
                      {link.label}
                      {link.badge && link.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto px-1.5 py-0 text-xs">
                          {link.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/admin" className="text-lg font-bold text-primary shrink-0">
              ESCORIA Admin
            </Link>
            <nav className="hidden lg:flex items-center gap-2 text-sm overflow-x-auto max-w-[calc(100vw-400px)]">
              <Link 
                to="/admin" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/profile" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/profile") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Profile
              </Link>
              <Link 
                to="/admin/users" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/users") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Nutzer
              </Link>
              <Link 
                to="/admin/categories" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/categories") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Kategorien
              </Link>
              <Link 
                to="/admin/cities" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/cities") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Städte
              </Link>
              <Link 
                to="/admin/reports" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/reports") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Meldungen
              </Link>
              <Link 
                to="/admin/messages" 
                className={cn(
                  "hover:text-primary transition-colors flex items-center gap-2",
                  isActive("/admin/messages") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Nachrichten
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
              <Link 
                to="/admin/advertisements" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/advertisements") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Banner
              </Link>
              <Link 
                to="/admin/pending-payments" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/pending-payments") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Zahlungen
              </Link>
              <Link 
                to="/admin/settings"
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/settings") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Einstellungen
              </Link>
              <Link 
                to="/admin/dropdowns" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/dropdowns") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Dropdowns
              </Link>
              <Link 
                to="/admin/analytics" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/analytics") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Analytics
              </Link>
              <Link 
                to="/admin/performance" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/performance") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Performance
              </Link>
              <Link 
                to="/admin/rate-limits" 
                className={cn(
                  "hover:text-primary transition-colors flex items-center gap-2",
                  isActive("/admin/rate-limits") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                <ShieldAlert className="h-4 w-4" />
                Sicherheit
                {lockedCount && lockedCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                    {lockedCount}
                  </Badge>
                )}
              </Link>
              <Link 
                to="/admin/export" 
                className={cn(
                  "hover:text-primary transition-colors",
                  isActive("/admin/export") && "text-primary font-semibold border-b-2 border-primary pb-1"
                )}
              >
                Export
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm hover:text-primary">
              Zur Webseite
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">{user?.email?.split('@')[0]}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Admin Account</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/account')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account-Einstellungen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
