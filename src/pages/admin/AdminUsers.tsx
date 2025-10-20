import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const mockUsers = [
  { id: '1', email: 'admin@escoria.ch', role: 'admin', status: 'active', display_name: 'Admin', profiles: 0 },
  { id: '2', email: 'lara@example.com', role: 'individual', status: 'active', display_name: 'Lara', profiles: 1 },
  { id: '3', email: 'anna@example.com', role: 'individual', status: 'active', display_name: 'Anna', profiles: 1 },
  { id: '4', email: 'agency@example.com', role: 'agency', status: 'active', display_name: 'Agentur XY', profiles: 2 },
];

const AdminUsers = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Nutzer verwalten</h1>

          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">ID</th>
                    <th className="text-left p-3 text-sm font-medium">E-Mail</th>
                    <th className="text-left p-3 text-sm font-medium">Rolle</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Profile</th>
                    <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="p-3 text-sm">{user.id}</td>
                      <td className="p-3 text-sm">{user.email}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {user.role === 'admin' ? 'Admin' : user.role === 'agency' ? 'Agentur' : 'Individuell'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={user.status === 'active' ? 'bg-success text-success-foreground' : ''}>
                          {user.status === 'active' ? 'Aktiv' : 'Gesperrt'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{user.profiles}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Rolle ändern</Button>
                          <Button size="sm" variant="outline">Sperren</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            // TODO backend: user management
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
