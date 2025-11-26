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
  const [dialogListingType, setDialogListingType] = useState('');
  const [dialogExpiryDate, setDialogExpiryDate] = useState('');
  const [freeListingType, setFreeListingType] = useState('basic');
  const [freeDuration, setFreeDuration] = useState('30');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles', statusFilter, verifiedFilter],
    queryFn: async () => {
      // Erst Admin User IDs holen
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      const adminUserIds = adminRoles?.map(r => r.user_id) || [];
      
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
      
      // Admins ausschließen
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.join(',')})`);
      }
      
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

      // SECURITY: Load contact data for each profile (admins can see all)
      const profilesWithContacts = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: contactData } = await supabase
            .from('profile_contacts')
            .select('*')
            .eq('profile_id', profile.id)
            .maybeSingle();
          
          return { ...profile, contact: contactData };
        })
      );
      
      return profilesWithContacts;
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { 
      profileId: string; 
      status: string; 
      verified: boolean;
      note?: string;
      listingType: string;
      expiryDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Build update object
      const updates: any = {
        status: data.status,
        verified_at: data.verified ? new Date().toISOString() : null,
        listing_type: data.listingType
      };
      
      // Handle expiry dates based on listing type
      if (data.listingType === 'premium' && data.expiryDate) {
        updates.premium_until = new Date(data.expiryDate).toISOString();
        updates.top_ad_until = null;
      } else if (data.listingType === 'top' && data.expiryDate) {
        updates.top_ad_until = new Date(data.expiryDate).toISOString();
        updates.premium_until = null;
      } else if (data.listingType === 'basic' || data.listingType === 'free') {
        updates.premium_until = null;
        updates.top_ad_until = null;
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
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

  const activateFreeMutation = useMutation({
    mutationFn: async (data: { 
      profileId: string; 
      listingType: string; 
      durationDays: number | null;
    }) => {
      const updates: any = {
        status: 'active',
        payment_status: 'free',
        listing_type: data.listingType,
      };
      
      if (data.durationDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + data.durationDays);
        
        if (data.listingType === 'premium') {
          updates.premium_until = expiryDate.toISOString();
          updates.top_ad_until = null;
        } else if (data.listingType === 'top') {
          updates.top_ad_until = expiryDate.toISOString();
          updates.premium_until = null;
        }
      } else {
        updates.premium_until = null;
        updates.top_ad_until = null;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', data.profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Gratis aktiviert!',
        description: 'Profil wurde kostenlos freigeschaltet.'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setSelectedProfile(null);
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
    setDialogListingType(profile.listing_type || 'free');
    
    // Set expiry date if exists
    const expiryDate = profile.listing_type === 'premium' 
      ? profile.premium_until 
      : profile.listing_type === 'top' 
        ? profile.top_ad_until 
        : null;
    
    setDialogExpiryDate(expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : '');
  };

  const handleSaveProfile = () => {
    if (!selectedProfile) return;
    
    updateProfileMutation.mutate({
      profileId: selectedProfile.id,
      status: dialogStatus,
      verified: dialogVerified,
      note: dialogNote,
      listingType: dialogListingType,
      expiryDate: dialogExpiryDate
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
                                
                                {(!selectedProfile.photos || selectedProfile.photos.length === 0) && (
                                  <div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                                    <span className="text-lg">⚠️</span>
                                    <div>
                                      <p className="font-semibold">Keine Fotos hochgeladen</p>
                                      <p className="text-xs mt-1">Dieses Profil kann erst freigeschaltet werden, wenn mindestens 1 Foto vorhanden ist.</p>
                                    </div>
                                  </div>
                                )}
                                
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Kontaktdaten</label>
                                  <div className="space-y-1 text-sm">
                                    {selectedProfile.contact?.phone && <p>📞 Telefon: {selectedProfile.contact.phone}</p>}
                                    {selectedProfile.contact?.whatsapp && <p>💬 WhatsApp: {selectedProfile.contact.whatsapp}</p>}
                                    {selectedProfile.contact?.email && <p>📧 Email: {selectedProfile.contact.email}</p>}
                                    {selectedProfile.contact?.website && <p>🌐 Website: {selectedProfile.contact.website}</p>}
                                    {selectedProfile.contact?.telegram && <p>✈️ Telegram: {selectedProfile.contact.telegram}</p>}
                                    {selectedProfile.contact?.instagram && <p>📷 Instagram: {selectedProfile.contact.instagram}</p>}
                                    {selectedProfile.contact?.street_address && (
                                      <p>🏠 Adresse: {selectedProfile.contact.street_address}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Status</label>
                                  <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={dialogStatus}
                                    onChange={(e) => setDialogStatus(e.target.value)}
                                  >
                                    <option value="pending">Zu prüfen</option>
                                    <option 
                                      value="active" 
                                      disabled={!selectedProfile.photos || selectedProfile.photos.length === 0}
                                    >
                                      {(!selectedProfile.photos || selectedProfile.photos.length === 0) 
                                        ? 'Freigeben (❌ Fotos fehlen!)' 
                                        : 'Freigeben ✓'}
                                    </option>
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
                                
                                <div className="border-t pt-4 mt-4">
                                  <h3 className="font-semibold mb-3 text-sm">💎 Inserat-Paket verwalten</h3>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Inserat-Typ</label>
                                      <select 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={dialogListingType}
                                        onChange={(e) => setDialogListingType(e.target.value)}
                                      >
                                        <option value="free">Free (Standard)</option>
                                        <option value="basic">Basic (CHF 49)</option>
                                        <option value="premium">Premium (CHF 99)</option>
                                        <option value="top">TOP AD (CHF 199)</option>
                                      </select>
                                    </div>

                                    {(dialogListingType === 'premium' || dialogListingType === 'top') && (
                                      <div>
                                        <label className="block text-sm font-medium mb-1">Gültig bis</label>
                                        <input 
                                          type="date"
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                          value={dialogExpiryDate}
                                          onChange={(e) => setDialogExpiryDate(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Leer lassen für unbegrenzt gültig
                                        </p>
                                      </div>
                                    )}
                                   </div>
                                 </div>
                                 
                                 <div className="border-t pt-4 mt-4 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                                   <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                     🎁 Gratis Aktivierung (Schnell-Aktion)
                                   </h3>
                                   
                                   <div className="grid grid-cols-2 gap-4 mb-4">
                                     <div>
                                       <label className="block text-sm font-medium mb-1">Inserat-Typ</label>
                                       <select 
                                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                         value={freeListingType}
                                         onChange={(e) => setFreeListingType(e.target.value)}
                                       >
                                         <option value="basic">Basic</option>
                                         <option value="premium">Premium</option>
                                         <option value="top">TOP AD</option>
                                       </select>
                                     </div>
                                     
                                     <div>
                                       <label className="block text-sm font-medium mb-1">Laufzeit</label>
                                       <select 
                                         className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                         value={freeDuration}
                                         onChange={(e) => setFreeDuration(e.target.value)}
                                       >
                                         <option value="7">7 Tage</option>
                                         <option value="30">30 Tage</option>
                                         <option value="90">90 Tage</option>
                                         <option value="unlimited">Unbegrenzt</option>
                                       </select>
                                     </div>
                                   </div>
                                   
                                   <Button 
                                     className="w-full bg-green-600 hover:bg-green-700"
                                     onClick={() => {
                                       if (!selectedProfile) return;
                                       activateFreeMutation.mutate({
                                         profileId: selectedProfile.id,
                                         listingType: freeListingType,
                                         durationDays: freeDuration === 'unlimited' ? null : parseInt(freeDuration),
                                       });
                                     }}
                                     disabled={
                                       activateFreeMutation.isPending ||
                                       (!selectedProfile?.photos || selectedProfile.photos.length === 0)
                                     }
                                   >
                                     {activateFreeMutation.isPending ? 'Aktiviere...' : '🎁 Gratis freischalten'}
                                   </Button>
                                   
                                   {(!selectedProfile?.photos || selectedProfile.photos.length === 0) && (
                                     <p className="text-xs text-destructive mt-2">
                                       ⚠️ Kann nicht aktiviert werden - Fotos fehlen!
                                     </p>
                                   )}
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
                                    disabled={
                                      updateProfileMutation.isPending || 
                                      (dialogStatus === 'active' && (!selectedProfile.photos || selectedProfile.photos.length === 0))
                                    }
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
