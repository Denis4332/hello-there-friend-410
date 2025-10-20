import { AdminHeader } from '@/components/layout/AdminHeader';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const stats = [
    { label: 'Zu prüfen (Pending)', value: '3', link: '/admin/profile?status=pending_review' },
    { label: 'Verifiziert', value: '2', link: '/admin/profile?verified=true' },
    { label: 'Live (Approved)', value: '4', link: '/admin/profile?status=approved' },
    { label: 'Gemeldet', value: '0', link: '/admin/reports' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Link key={stat.label} to={stat.link}>
                <div className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </Link>
            ))}
          </div>

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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
