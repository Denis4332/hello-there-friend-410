import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { mockProfiles } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const AdminProfile = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  const filteredProfiles = mockProfiles.filter((profile) => {
    if (statusFilter && profile.status !== statusFilter) return false;
    if (verifiedFilter === 'true' && !profile.verified) return false;
    if (verifiedFilter === 'false' && profile.verified) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Profile verwalten</h1>

          <div className="bg-card border rounded-lg p-4 mb-4">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Alle</option>
                  <option value="draft">Entwurf</option>
                  <option value="pending_review">Zu prüfen</option>
                  <option value="approved">Freigegeben</option>
                  <option value="rejected">Abgelehnt</option>
                  <option value="suspended">Gesperrt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Verifiziert</label>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Alle</option>
                  <option value="true">Ja</option>
                  <option value="false">Nein</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Name</th>
                    <th className="text-left p-3 text-sm font-medium">Stadt</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Verifiziert</th>
                    <th className="text-left p-3 text-sm font-medium">Erstellt</th>
                    <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                            {profile.display_name.charAt(0)}
                          </div>
                          <span className="font-medium">{profile.display_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{profile.city}</td>
                      <td className="p-3">
                        <Badge variant="outline">{profile.status}</Badge>
                      </td>
                      <td className="p-3">
                        {profile.verified ? (
                          <Badge className="bg-success text-success-foreground">Ja</Badge>
                        ) : (
                          <Badge variant="secondary">Nein</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(profile.created_at).toLocaleDateString('de-CH')}
                      </td>
                      <td className="p-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Prüfen
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Profil prüfen: {profile.display_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Name</label>
                                  <p>{profile.display_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Alter</label>
                                  <p>{profile.age}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Stadt</label>
                                  <p>{profile.city}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Kanton</label>
                                  <p>{profile.canton}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Beschreibung</label>
                                <p className="text-sm">{profile.short_bio}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                  <option value="draft">Entwurf</option>
                                  <option value="pending_review">Zu prüfen</option>
                                  <option value="approved">Freigeben</option>
                                  <option value="rejected">Ablehnen</option>
                                  <option value="suspended">Sperren</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id="verified" defaultChecked={profile.verified} />
                                <label htmlFor="verified" className="text-sm">Verifiziert</label>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Moderator-Notiz</label>
                                <Textarea rows={3} placeholder="Interne Notiz..." />
                              </div>
                              <div className="flex gap-2">
                                <Button className="flex-1">Speichern</Button>
                                <Button variant="outline" className="flex-1">Abbrechen</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            // TODO backend: CRUD Endpunkte + Access Control per Rolle (admin/agency/individual)
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminProfile;
