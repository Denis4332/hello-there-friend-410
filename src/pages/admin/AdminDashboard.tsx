import { AdminHeader } from '@/components/layout/AdminHeader';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Mail, 
  Flag, 
  Shield, 
  FolderKanban, 
  MapPin,
  User,
  ShieldAlert
} from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Count pending profiles
      const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Count verified profiles
      const { count: verifiedCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('verified_at', 'is', null);
      
      // Count active profiles
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      // Count open reports
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      // Count unread messages
      const { count: unreadMessages } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');
      
      // Count pending verifications
      const { count: pendingVerifications } = await supabase
        .from('verification_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Count locked accounts
      const { data: rateLimitsData } = await supabase.rpc('get_rate_limits_for_admin');
      const lockedAccounts = (rateLimitsData as any[])?.filter(r => r.is_locked).length || 0;
      
      return [
        { 
          label: 'Zu prüfen', 
          value: pendingCount || 0, 
          link: '/admin/profile?status=pending',
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-950'
        },
        { 
          label: 'Verifiziert', 
          value: verifiedCount || 0, 
          link: '/admin/profile?verified=true',
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950'
        },
        { 
          label: 'Live (Active)', 
          value: activeCount || 0, 
          link: '/admin/profile?status=active',
          icon: Users,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950'
        },
        { 
          label: 'Nachrichten', 
          value: unreadMessages || 0, 
          link: '/admin/messages',
          icon: Mail,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50 dark:bg-purple-950'
        },
        { 
          label: 'Meldungen', 
          value: reportsCount || 0, 
          link: '/admin/reports',
          icon: Flag,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950'
        },
        { 
          label: 'Verifizierungen', 
          value: pendingVerifications || 0, 
          link: '/admin/verifications',
          icon: Shield,
          color: 'text-cyan-500',
          bgColor: 'bg-cyan-50 dark:bg-cyan-950'
        },
        { 
          label: 'Gesperrte Accounts', 
          value: lockedAccounts, 
          link: '/admin/rate-limits',
          icon: ShieldAlert,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950'
        },
      ];
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          {isLoading ? (
            <div className="grid md:grid-cols-6 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-6">
                  <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse" />
                  <div className="h-8 bg-muted rounded w-12 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-6 gap-4 mb-8">
              {stats?.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Link key={stat.label} to={stat.link}>
                    <div className={`${stat.bgColor} border-2 rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Schnelllinks</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/admin/profile">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Profile prüfen</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Profile moderieren und freigeben</p>
                </div>
              </Link>
              <Link to="/admin/categories">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <FolderKanban className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Kategorien</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Kategorien verwalten</p>
                </div>
              </Link>
              <Link to="/admin/cities">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Städte</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Städte & Kantone verwalten</p>
                </div>
              </Link>
              <Link to="/admin/users">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Nutzer</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Nutzer und Rollen verwalten</p>
                </div>
              </Link>
              <Link to="/admin/reports">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <Flag className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Meldungen</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Gemeldete Profile bearbeiten</p>
                </div>
              </Link>
              <Link to="/admin/messages">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Nachrichten</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Kontaktanfragen beantworten</p>
                </div>
              </Link>
              <Link to="/admin/rate-limits">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Rate Limits</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Gesperrte Accounts verwalten</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
