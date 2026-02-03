import { AdminHeader } from '@/components/layout/AdminHeader';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  CheckCircle, 
  Mail, 
  Shield, 
  FolderKanban, 
  MapPin,
  User,
  ShieldAlert,
  Download,
  Layers,
  Bell,
  Flag,
  FileEdit
} from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Parallel queries for all counts
      const [
        pendingProfilesRes,
        paidPendingRes,
        activeRes,
        reportsRes,
        messagesRes,
        verificationsRes,
        changeRequestsRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('payment_status', 'paid'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
        supabase.from('verification_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profile_change_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);
      
      const pendingCount = pendingProfilesRes.count || 0;
      const paidPendingCount = paidPendingRes.count || 0;
      const activeCount = activeRes.count || 0;
      const reportsCount = reportsRes.count || 0;
      const unreadMessages = messagesRes.count || 0;
      const pendingVerifications = verificationsRes.count || 0;
      const changeRequestsCount = changeRequestsRes.count || 0;

      // Consolidated 4 tiles
      return {
        actionsNeeded: {
          total: paidPendingCount + changeRequestsCount + reportsCount,
          paidPending: paidPendingCount,
          changeRequests: changeRequestsCount,
          reports: reportsCount
        },
        toReview: {
          total: pendingCount + pendingVerifications,
          profiles: pendingCount,
          verifications: pendingVerifications
        },
        live: activeCount,
        messages: unreadMessages
      };
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border rounded-xl p-6">
                  <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse" />
                  <div className="h-8 bg-muted rounded w-12 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Aktionen nötig */}
              <Link to="/admin/change-requests" className="group">
                <div className="bg-card border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-destructive/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-destructive/10">
                      <Bell className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="text-3xl font-bold text-destructive">{stats?.actionsNeeded.total || 0}</div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mb-2">Aktionen nötig</div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{stats?.actionsNeeded.paidPending || 0} bezahlt warten</div>
                    <div>{stats?.actionsNeeded.changeRequests || 0} Änderungsanfragen</div>
                    <div>{stats?.actionsNeeded.reports || 0} Meldungen</div>
                  </div>
                </div>
              </Link>

              {/* Zu prüfen */}
              <Link to="/admin/profile?status=pending" className="group">
                <div className="bg-card border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-orange-500/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-orange-500/10">
                      <AlertCircle className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="text-3xl font-bold text-orange-500">{stats?.toReview.total || 0}</div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mb-2">Zu prüfen</div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{stats?.toReview.profiles || 0} Profile</div>
                    <div>{stats?.toReview.verifications || 0} Verifikationen</div>
                  </div>
                </div>
              </Link>

              {/* Live */}
              <Link to="/admin/profile?status=active" className="group">
                <div className="bg-card border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-green-500/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-500">{stats?.live || 0}</div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Live</div>
                </div>
              </Link>

              {/* Nachrichten */}
              <Link to="/admin/messages" className="group">
                <div className="bg-card border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-500/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Mail className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-500">{stats?.messages || 0}</div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Nachrichten</div>
                </div>
              </Link>
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
              <Link to="/admin/export">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <Download className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Export</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Daten exportieren & Backup</p>
                </div>
              </Link>
              <Link to="/admin/tier-dashboard">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <Layers className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Tier-Monitor</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Tier-Verteilung & Rotation überwachen</p>
                </div>
              </Link>
              <Link to="/admin/change-requests">
                <div className="border-2 rounded-lg p-5 hover:border-primary transition-all hover:shadow-md group">
                  <div className="flex items-center gap-3 mb-2">
                    <FileEdit className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold">Änderungsanfragen</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Profiländerungen prüfen & genehmigen</p>
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
