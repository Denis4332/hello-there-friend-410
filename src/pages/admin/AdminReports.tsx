import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const mockReports = [
  {
    id: '1',
    profile_id: '3',
    profile_name: 'Tom',
    reason: 'Gefälschtes Profil',
    message: 'Bilder stammen nicht von dieser Person',
    created_at: '2025-01-18T14:30:00Z',
    status: 'open',
  },
];

const AdminReports = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Meldungen</h1>

          <div className="bg-card border rounded-lg overflow-hidden">
            {mockReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Profil</th>
                      <th className="text-left p-3 text-sm font-medium">Grund</th>
                      <th className="text-left p-3 text-sm font-medium">Kommentar</th>
                      <th className="text-left p-3 text-sm font-medium">Datum</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReports.map((report) => (
                      <tr key={report.id} className="border-t">
                        <td className="p-3 font-medium">{report.profile_name}</td>
                        <td className="p-3 text-sm">{report.reason}</td>
                        <td className="p-3 text-sm">{report.message}</td>
                        <td className="p-3 text-sm">
                          {new Date(report.created_at).toLocaleDateString('de-CH')}
                        </td>
                        <td className="p-3">
                          <Badge variant={report.status === 'open' ? 'destructive' : 'outline'}>
                            {report.status === 'open' ? 'Offen' : 'Erledigt'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive">Sperren</Button>
                            <Button size="sm" variant="outline">Ablehnen</Button>
                            <Button size="sm" variant="outline">Erledigt</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Keine Meldungen vorhanden
              </div>
            )}
          </div>

          <div className="bg-card border rounded-lg p-4 mt-4">
            <p className="text-sm">
              <strong>Hinweis:</strong> Hinweisen wird unverzüglich nachgegangen (Notice-&-Takedown). 
              Bei begründetem Verdacht werden Profile sofort gesperrt und geprüft.
            </p>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            // TODO backend: report workflow
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
