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
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useContactMessages';
import { User, Settings, LogOut, ChevronDown, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: unreadCount } = useUnreadCount();
  
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

  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-lg font-bold text-primary">
              ESCORIA Admin
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
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
