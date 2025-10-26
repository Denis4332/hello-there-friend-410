import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types/dating';

const AdminProfile = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [dialogStatus, setDialogStatus] = useState('');
  const [dialogVerified, setDialogVerified] = useState(false);
  const [dialogNote, setDialogNote] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles', statusFilter, verifiedFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          photos(id, storage_path, is_primary),
          profile_categories(
            categories(id, name, slug)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      if (verifiedFilter === 'true') {
        query = query.not('verified_at', 'is', null);
      } else if (verifiedFilter === 'false') {
        query = query.is('verified_at', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { 
      profileId: string; 
      status: string; 
      verified: boolean;
      note?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update profile status and verification
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: data.status,
          verified_at: data.verified ? new Date().toISOString() : null
        })
        .eq('id', data.profileId);
      
      if (profileError) throw profileError;
      
      // Save moderation note if provided
      if (data.note && user) {
        const { error: noteError } = await supabase
          .from('profile_moderation_notes')
          .insert({
            profile_id: data.profileId,
            admin_user_id: user.id,
            note: data.note,
            action: data.status
          });
        
        if (noteError) throw noteError;
      }
    },
    onSuccess: () => {
      toast({ 
        title: 'Profil aktualisiert',
        description: 'Die Änderungen wurden gespeichert.'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedProfile(null);
      setDialogNote('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Fehler', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleOpenDialog = (profile: any) => {
    setSelectedProfile(profile);
    setDialogStatus(profile.status);
    setDialogVerified(!!profile.verified_at);
    setDialogNote('');
  };

  const handleSaveProfile = () => {
    if (!selectedProfile) return;
    
    updateProfileMutation.mutate({
      profileId: selectedProfile.id,
      status: dialogStatus,
      verified: dialogVerified,
      note: dialogNote
    });
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

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
                  <option value="pending">Zu prüfen</option>
                  <option value="active">Aktiv</option>
                  <option value="rejected">Abgelehnt</option>
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
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Lade Profile...</p>
              </div>
            ) : profiles && profiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Keine Profile gefunden
              </div>
            ) : (
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
                    {profiles?.map((profile, index) => (
                    <tr key={profile.id} className={`border-t hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
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
                        {profile.verified_at ? (
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
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenDialog(profile)}
                            >
                              Prüfen
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Profil prüfen: {selectedProfile?.display_name}</DialogTitle>
                            </DialogHeader>
                            {selectedProfile && (
                              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {selectedProfile.photos && selectedProfile.photos.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Fotos</label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {selectedProfile.photos.map((photo: any) => (
                                        <img 
                                          key={photo.id}
                                          src={getPhotoUrl(photo.storage_path)}
                                          alt=""
                                          className={`rounded aspect-square object-cover ${
                                            photo.is_primary ? 'ring-2 ring-primary' : ''
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p>{selectedProfile.display_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Alter</label>
                                    <p>{selectedProfile.age}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Stadt</label>
                                    <p>{selectedProfile.city}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Kanton</label>
                                    <p>{selectedProfile.canton}</p>
                                  </div>
                                </div>
                                
                                {selectedProfile.about_me && (
                                  <div>
                                    <label className="text-sm font-medium">Beschreibung</label>
                                    <p className="text-sm">{selectedProfile.about_me}</p>
                                  </div>
                                )}
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Status</label>
                                  <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={dialogStatus}
                                    onChange={(e) => setDialogStatus(e.target.value)}
                                  >
                                    <option value="pending">Zu prüfen</option>
                                    <option value="active">Freigeben</option>
                                    <option value="rejected">Ablehnen</option>
                                  </select>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    id="verified" 
                                    checked={dialogVerified}
                                    onChange={(e) => setDialogVerified(e.target.checked)}
                                  />
                                  <label htmlFor="verified" className="text-sm">Verifiziert</label>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Moderator-Notiz</label>
                                  <Textarea 
                                    rows={3} 
                                    placeholder="Interne Notiz..." 
                                    value={dialogNote}
                                    onChange={(e) => setDialogNote(e.target.value)}
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    className="flex-1"
                                    onClick={handleSaveProfile}
                                    disabled={updateProfileMutation.isPending}
                                  >
                                    {updateProfileMutation.isPending ? 'Speichert...' : 'Speichern'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProfile;
