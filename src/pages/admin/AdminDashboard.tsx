import { AdminHeader } from '@/components/layout/AdminHeader';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      
      return [
        { label: 'Zu prüfen (Pending)', value: pendingCount || 0, link: '/admin/profile?status=pending' },
        { label: 'Verifiziert', value: verifiedCount || 0, link: '/admin/profile?verified=true' },
        { label: 'Live (Active)', value: activeCount || 0, link: '/admin/profile?status=active' },
        { label: 'Neue Nachrichten', value: unreadMessages || 0, link: '/admin/messages' },
        { label: 'Gemeldet', value: reportsCount || 0, link: '/admin/reports' },
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
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-card border rounded-lg p-6">
                  <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse" />
                  <div className="h-8 bg-muted rounded w-12 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              {stats?.map((stat) => (
                <Link key={stat.label} to={stat.link}>
                  <div className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Schnelllinks</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <Link to="/admin/profile">
                <div className="border rounded p-4 hover:border-primary transition-colors">
                  Profile prüfen
                </div>
              </Link>
              <Link to="/admin/categories">
                <div className="border rounded p-4 hover:border-primary transition-colors">
                  Kategorien verwalten
                </div>
              </Link>
              <Link to="/admin/cities">
                <div className="border rounded p-4 hover:border-primary transition-colors">
                  Städte verwalten
                </div>
              </Link>
              <Link to="/admin/users">
                <div className="border rounded p-4 hover:border-primary transition-colors">
                  Nutzer verwalten
                </div>
              </Link>
              <Link to="/admin/reports">
                <div className="border rounded p-4 hover:border-primary transition-colors">
                  Meldungen bearbeiten
                </div>
              </Link>
              <Link to="/admin/messages">
                <div className="border rounded p-4 hover:border-primary transition-colors">
                  Kontaktanfragen
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
