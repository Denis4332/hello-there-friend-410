import { useState, useRef } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminProfileCreateDialog } from '@/components/admin/AdminProfileCreateDialog';
import { BulkImageCompressor } from '@/components/admin/BulkImageCompressor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useAgbAcceptances } from '@/hooks/useAgbAcceptances';
import { Trash2, X, Pencil, FileCheck, ImagePlus, Loader2, Camera } from 'lucide-react';
import type { Profile } from '@/types/dating';
import { compressImage } from '@/utils/imageCompression';

interface NewPhotoPreview {
  url: string;
  file: File;
}

// State for quick upload from list
interface QuickUploadState {
  profileId: string;
  profileName: string;
  isUploading: boolean;
}

const AdminProfile = () => {
  // CMS Preise laden
  const { data: basicPrice } = useSiteSetting('pricing_basic_price');
  const { data: premiumPrice } = useSiteSetting('pricing_premium_price');
  const { data: topPrice } = useSiteSetting('pricing_top_price');
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
  
  // Edit mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAboutMe, setEditAboutMe] = useState('');
  const [editContact, setEditContact] = useState({
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    telegram: '',
    instagram: '',
    street_address: '',
  });
  
  // New photo upload states
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<NewPhotoPreview[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Quick upload from list states
  const [quickUpload, setQuickUpload] = useState<QuickUploadState | null>(null);
  const quickUploadInputRef = useRef<HTMLInputElement>(null);
  
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
      
      // Admins ausschließen (aber Admin-erstellte Profile mit user_id=NULL behalten)
      if (adminUserIds.length > 0) {
        query = query.or(`user_id.is.null,user_id.not.in.(${adminUserIds.join(',')})`);
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
      if (data.expiryDate) {
        // Manual expiry date provided
        if (data.listingType === 'premium') {
          updates.premium_until = new Date(data.expiryDate).toISOString();
          updates.top_ad_until = null;
        } else if (data.listingType === 'top') {
          updates.top_ad_until = new Date(data.expiryDate).toISOString();
          updates.premium_until = null;
        }
      } else if (data.status === 'active') {
        // Auto-set 30 days when activating without manual expiry date
        const autoExpiry = new Date();
        autoExpiry.setDate(autoExpiry.getDate() + 30);
        
        if (data.listingType === 'premium' || data.listingType === 'basic') {
          updates.premium_until = autoExpiry.toISOString();
          updates.top_ad_until = null;
        } else if (data.listingType === 'top') {
          updates.top_ad_until = autoExpiry.toISOString();
          updates.premium_until = null;
        }
      }
      
      if (data.listingType === 'basic' || data.listingType === 'free') {
        // Basic/Free have no special expiry (unless set above for activation)
        if (!data.expiryDate && data.status !== 'active') {
          updates.premium_until = null;
          updates.top_ad_until = null;
        }
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

  // Update profile text (display_name, about_me)
  const updateProfileTextMutation = useMutation({
    mutationFn: async (data: { profileId: string; display_name: string; about_me: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: data.display_name,
          about_me: data.about_me 
        })
        .eq('id', data.profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '✅ Profiltext aktualisiert' });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setIsEditingProfile(false);
      // Update local state
      if (selectedProfile) {
        setSelectedProfile({
          ...selectedProfile,
          display_name: editDisplayName,
          about_me: editAboutMe
        });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  });

  // Update contact data
  const updateContactMutation = useMutation({
    mutationFn: async (data: { profileId: string; contact: typeof editContact }) => {
      // Check if contact exists
      const { data: existingContact } = await supabase
        .from('profile_contacts')
        .select('id')
        .eq('profile_id', data.profileId)
        .maybeSingle();

      if (existingContact) {
        const { error } = await supabase
          .from('profile_contacts')
          .update({
            phone: data.contact.phone || null,
            whatsapp: data.contact.whatsapp || null,
            email: data.contact.email || null,
            website: data.contact.website || null,
            telegram: data.contact.telegram || null,
            instagram: data.contact.instagram || null,
            street_address: data.contact.street_address || null,
          })
          .eq('profile_id', data.profileId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profile_contacts')
          .insert({
            profile_id: data.profileId,
            phone: data.contact.phone || null,
            whatsapp: data.contact.whatsapp || null,
            email: data.contact.email || null,
            website: data.contact.website || null,
            telegram: data.contact.telegram || null,
            instagram: data.contact.instagram || null,
            street_address: data.contact.street_address || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: '✅ Kontaktdaten aktualisiert' });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setIsEditingContact(false);
      // Update local state
      if (selectedProfile) {
        setSelectedProfile({
          ...selectedProfile,
          contact: editContact
        });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  });

  // Delete single photo
  const deletePhotoMutation = useMutation({
    mutationFn: async (data: { photoId: string; storagePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('profile-photos')
        .remove([data.storagePath]);
      
      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue anyway - storage might already be deleted
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', data.photoId);
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast({ title: '🗑️ Foto gelöscht' });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      // Update local state
      if (selectedProfile) {
        setSelectedProfile({
          ...selectedProfile,
          photos: selectedProfile.photos.filter((p: any) => p.id !== deletePhotoMutation.variables?.photoId)
        });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Fehler beim Löschen', description: error.message, variant: 'destructive' });
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

  const deleteProfileMutation = useMutation({
    mutationFn: async (data: { profileId: string; userId: string | null }) => {
      // Wenn User existiert, kompletten User + alle Daten löschen via Edge Function
      if (data.userId) {
        const { data: result, error } = await supabase.functions.invoke('admin-delete-user', {
          body: { userId: data.userId }
        });
        
        if (error) throw error;
        if (result?.error) throw new Error(result.error);
        return; // Edge Function löscht alles (User + Profile + Daten)
      }
      
      // Admin-erstelltes Profil (ohne User): Nur Profil-Daten löschen
      await supabase.from('profile_categories').delete().eq('profile_id', data.profileId);
      await supabase.from('profile_contacts').delete().eq('profile_id', data.profileId);
      await supabase.from('photos').delete().eq('profile_id', data.profileId);
      await supabase.from('profile_moderation_notes').delete().eq('profile_id', data.profileId);
      await supabase.from('profile_views').delete().eq('profile_id', data.profileId);
      await supabase.from('reports').delete().eq('profile_id', data.profileId);
      await supabase.from('user_favorites').delete().eq('profile_id', data.profileId);
      await supabase.from('verification_submissions').delete().eq('profile_id', data.profileId);
      await supabase.from('agb_acceptances').delete().eq('profile_id', data.profileId);
      
      const { error } = await supabase.from('profiles').delete().eq('id', data.profileId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const message = variables.userId 
        ? 'Nutzer, Profil und alle Daten wurden entfernt.'
        : 'Profil und alle zugehörigen Daten wurden entfernt.';
      toast({ 
        title: '🗑️ Erfolgreich gelöscht',
        description: message
      });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedProfile(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Fehler beim Löschen', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Handle new photo selection with compression
  const handleAddPhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const previews: NewPhotoPreview[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Datei zu groß',
          description: `${file.name} ist zu groß (max. 10MB)`,
          variant: 'destructive',
        });
        continue;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Ungültiger Dateityp',
          description: `${file.name} ist kein Bild`,
          variant: 'destructive',
        });
        continue;
      }
      
      try {
        const compressedFile = await compressImage(file);
        previews.push({
          url: URL.createObjectURL(compressedFile),
          file: compressedFile,
        });
      } catch (error) {
        console.error('Compression error:', error);
        previews.push({
          url: URL.createObjectURL(file),
          file,
        });
      }
    }

    setNewPhotoPreviews(prev => [...prev, ...previews]);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Upload new photos mutation
  const uploadNewPhotosMutation = useMutation({
    mutationFn: async (data: { profileId: string; photos: NewPhotoPreview[] }) => {
      const uploadedPhotos: { storage_path: string }[] = [];
      
      for (const preview of data.photos) {
        const fileName = `${data.profileId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('profile-photos')
          .upload(fileName, preview.file, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        uploadedPhotos.push({ storage_path: fileName });
      }
      
      // Insert photo records
      for (const photo of uploadedPhotos) {
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            profile_id: data.profileId,
            storage_path: photo.storage_path,
            is_primary: false,
            media_type: 'image'
          });
        
        if (dbError) throw dbError;
      }
      
      return uploadedPhotos;
    },
    onSuccess: () => {
      toast({ title: '✅ Fotos hochgeladen' });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      setNewPhotoPreviews([]);
      // Refresh selectedProfile photos
      if (selectedProfile) {
        queryClient.fetchQuery({ queryKey: ['admin-profiles'] }).then((profiles: any) => {
          const updated = profiles?.find((p: any) => p.id === selectedProfile.id);
          if (updated) setSelectedProfile(updated);
        });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Fehler beim Upload', description: error.message, variant: 'destructive' });
    }
  });

  // Quick upload handler for list view
  const handleQuickUploadSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!quickUpload || !event.target.files?.length) return;
    
    const files = Array.from(event.target.files);
    setQuickUpload(prev => prev ? { ...prev, isUploading: true } : null);
    
    try {
      for (const file of files) {
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Upload to storage
        const fileName = `${quickUpload.profileId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError } = await supabase
          .storage
          .from('profile-photos')
          .upload(fileName, compressedFile, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        // Insert photo record
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            profile_id: quickUpload.profileId,
            storage_path: fileName,
            is_primary: false,
            media_type: 'image'
          });
        
        if (dbError) throw dbError;
      }
      
      toast({ 
        title: `✅ ${files.length} Foto(s) hochgeladen`,
        description: `für ${quickUpload.profileName}`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    } catch (error: any) {
      toast({ 
        title: 'Fehler beim Upload', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setQuickUpload(null);
      if (quickUploadInputRef.current) {
        quickUploadInputRef.current.value = '';
      }
    }
  };

  const triggerQuickUpload = (profileId: string, profileName: string) => {
    setQuickUpload({ profileId, profileName, isUploading: false });
    setTimeout(() => quickUploadInputRef.current?.click(), 0);
  };

  const handleOpenDialog = (profile: any) => {
    setSelectedProfile(profile);
    setDialogStatus(profile.status);
    setDialogVerified(!!profile.verified_at);
    setDialogNote('');
    setDialogListingType(profile.listing_type || 'basic');
    
    // Reset photo upload state
    setNewPhotoPreviews([]);
    
    // Set edit fields
    setEditDisplayName(profile.display_name || '');
    setEditAboutMe(profile.about_me || '');
    setEditContact({
      phone: profile.contact?.phone || '',
      whatsapp: profile.contact?.whatsapp || '',
      email: profile.contact?.email || '',
      website: profile.contact?.website || '',
      telegram: profile.contact?.telegram || '',
      instagram: profile.contact?.instagram || '',
      street_address: profile.contact?.street_address || '',
    });
    setIsEditingProfile(false);
    setIsEditingContact(false);
    
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
      
      {/* Hidden input for quick upload from list */}
      <input
        ref={quickUploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleQuickUploadSelect}
      />
      
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Profile verwalten</h1>
            <AdminProfileCreateDialog />
          </div>

          <BulkImageCompressor />

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
                      <th className="text-left p-3 text-sm font-medium">Typ</th>
                      <th className="text-left p-3 text-sm font-medium">Fotos</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Zahlung</th>
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
                          <div>
                            <span className="font-medium">{profile.display_name}</span>
                            {!profile.user_id && (
                              <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{profile.city}</td>
                      <td className="p-3">
                        <Badge 
                          variant={profile.listing_type === 'top' ? 'destructive' : 
                                   profile.listing_type === 'premium' ? 'default' : 'secondary'}
                          className={profile.listing_type === 'top' ? 'bg-red-600 text-white' : 
                                     profile.listing_type === 'premium' ? 'bg-amber-500 text-white' : ''}
                        >
                          {profile.listing_type === 'top' ? '🔥 TOP' : 
                           profile.listing_type === 'premium' ? '⭐ Premium' : 'Basic'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        {profile.photos?.length || 0} 📷
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{profile.status}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={profile.payment_status === 'paid' ? 'default' : 
                                   profile.payment_status === 'free' ? 'secondary' : 'destructive'}
                          className={profile.payment_status === 'paid' ? 'bg-green-600 text-white' : 
                                     profile.payment_status === 'free' ? 'bg-blue-500 text-white' : ''}
                        >
                          {profile.payment_status === 'paid' ? '✅ Bezahlt' : 
                           profile.payment_status === 'free' ? '🎁 Gratis' : '⏳ Offen'}
                        </Badge>
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
                        <div className="flex gap-1">
                          {/* Quick Upload Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={quickUpload?.isUploading}
                            onClick={() => triggerQuickUpload(profile.id, profile.display_name)}
                            title="Fotos hochladen"
                          >
                            {quickUpload?.profileId === profile.id && quickUpload?.isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                          </Button>
                          
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
                          <DialogContent className="max-w-3xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>Profil prüfen: {selectedProfile?.display_name}</DialogTitle>
                            </DialogHeader>
                            {selectedProfile && (
                              <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                                {/* Payment Status - Prominent at top */}
                                <div className={`p-3 rounded-lg ${
                                  selectedProfile.payment_status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 border border-green-500' :
                                  selectedProfile.payment_status === 'free' ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-500' :
                                  'bg-red-100 dark:bg-red-900/30 border border-red-500'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">
                                      {selectedProfile.payment_status === 'paid' ? '✅ BEZAHLT' :
                                       selectedProfile.payment_status === 'free' ? '🎁 GRATIS (Admin/Promo)' :
                                       '⚠️ NICHT BEZAHLT'}
                                    </span>
                                    {selectedProfile.payment_reference && (
                                      <span className="text-xs text-muted-foreground">
                                        Ref: {selectedProfile.payment_reference}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Photos Section with Delete and Upload */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">
                                      Fotos ({selectedProfile.photos?.length || 0})
                                    </label>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => photoInputRef.current?.click()}
                                    >
                                      <ImagePlus className="h-4 w-4 mr-1" />
                                      Fotos hinzufügen
                                    </Button>
                                    <input
                                      ref={photoInputRef}
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={handleAddPhotoSelect}
                                    />
                                  </div>
                                  
                                  {/* Existing Photos */}
                                  {selectedProfile.photos && selectedProfile.photos.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mb-3">
                                      {selectedProfile.photos.map((photo: any) => (
                                        <div key={photo.id} className="relative group">
                                          <img 
                                            src={getPhotoUrl(photo.storage_path)}
                                            alt=""
                                            className={`rounded aspect-square object-cover ${
                                              photo.is_primary ? 'ring-2 ring-primary' : ''
                                            }`}
                                          />
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                size="icon"
                                                variant="destructive"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Foto löschen?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Dieses Foto wird dauerhaft gelöscht.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                <AlertDialogAction
                                                  className="bg-destructive text-destructive-foreground"
                                                  onClick={() => deletePhotoMutation.mutate({ 
                                                    photoId: photo.id, 
                                                    storagePath: photo.storage_path 
                                                  })}
                                                >
                                                  Löschen
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          {photo.is_primary && (
                                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                                              Haupt
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* New Photos Preview */}
                                  {newPhotoPreviews.length > 0 && (
                                    <div className="border-t pt-3 mt-3">
                                      <label className="text-sm font-medium mb-2 block text-green-600">
                                        Neue Fotos ({newPhotoPreviews.length})
                                      </label>
                                      <div className="grid grid-cols-4 gap-2 mb-3">
                                        {newPhotoPreviews.map((preview, index) => (
                                          <div key={index} className="relative group">
                                            <img 
                                              src={preview.url}
                                              alt=""
                                              className="rounded aspect-square object-cover ring-2 ring-green-500"
                                            />
                                            <Button
                                              size="icon"
                                              variant="destructive"
                                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                              onClick={() => {
                                                URL.revokeObjectURL(preview.url);
                                                setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
                                              }}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                      <Button 
                                        size="sm"
                                        onClick={() => uploadNewPhotosMutation.mutate({
                                          profileId: selectedProfile.id,
                                          photos: newPhotoPreviews
                                        })}
                                        disabled={uploadNewPhotosMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        {uploadNewPhotosMutation.isPending ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            Lade hoch...
                                          </>
                                        ) : (
                                          <>
                                            <ImagePlus className="h-4 w-4 mr-1" />
                                            {newPhotoPreviews.length} Foto(s) hochladen
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {(!selectedProfile.photos || selectedProfile.photos.length === 0) && newPhotoPreviews.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Keine Fotos vorhanden</p>
                                  )}
                                </div>
                                
                                {/* Profile Text Section - Editable */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">Profildaten</label>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      {isEditingProfile ? 'Abbrechen' : 'Bearbeiten'}
                                    </Button>
                                  </div>
                                  
                                  {isEditingProfile ? (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs text-muted-foreground">Name</label>
                                        <Input
                                          value={editDisplayName}
                                          onChange={(e) => setEditDisplayName(e.target.value)}
                                          placeholder="Display Name"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-muted-foreground">Über mich</label>
                                        <Textarea
                                          value={editAboutMe}
                                          onChange={(e) => setEditAboutMe(e.target.value)}
                                          rows={3}
                                          placeholder="Beschreibung..."
                                        />
                                      </div>
                                      <Button 
                                        size="sm"
                                        onClick={() => updateProfileTextMutation.mutate({
                                          profileId: selectedProfile.id,
                                          display_name: editDisplayName,
                                          about_me: editAboutMe
                                        })}
                                        disabled={updateProfileTextMutation.isPending}
                                      >
                                        {updateProfileTextMutation.isPending ? 'Speichere...' : 'Speichern'}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Name:</span>
                                        <p className="font-medium">{selectedProfile.display_name}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Stadt:</span>
                                        <p>{selectedProfile.city}, {selectedProfile.canton}</p>
                                      </div>
                                      {selectedProfile.about_me && (
                                        <div className="col-span-2">
                                          <span className="text-muted-foreground">Über mich:</span>
                                          <p className="text-sm">{selectedProfile.about_me}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {(!selectedProfile.photos || selectedProfile.photos.length === 0) && (
                                  <div className="bg-destructive/10 border border-destructive text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                                    <span className="text-lg">⚠️</span>
                                    <div>
                                      <p className="font-semibold">Keine Fotos hochgeladen</p>
                                      <p className="text-xs mt-1">Dieses Profil kann erst freigeschaltet werden, wenn mindestens 1 Foto vorhanden ist.</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Contact Section - Editable */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium">Kontaktdaten</label>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => setIsEditingContact(!isEditingContact)}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      {isEditingContact ? 'Abbrechen' : 'Bearbeiten'}
                                    </Button>
                                  </div>
                                  
                                  {isEditingContact ? (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-xs text-muted-foreground">📞 Telefon</label>
                                          <div className="flex gap-1">
                                            <Input
                                              value={editContact.phone}
                                              onChange={(e) => setEditContact({...editContact, phone: e.target.value})}
                                              placeholder="Telefon"
                                              className="h-8 text-sm"
                                            />
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-8 w-8"
                                              onClick={() => setEditContact({...editContact, phone: ''})}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground">💬 WhatsApp</label>
                                          <div className="flex gap-1">
                                            <Input
                                              value={editContact.whatsapp}
                                              onChange={(e) => setEditContact({...editContact, whatsapp: e.target.value})}
                                              placeholder="WhatsApp"
                                              className="h-8 text-sm"
                                            />
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-8 w-8"
                                              onClick={() => setEditContact({...editContact, whatsapp: ''})}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground">📧 Email</label>
                                          <div className="flex gap-1">
                                            <Input
                                              value={editContact.email}
                                              onChange={(e) => setEditContact({...editContact, email: e.target.value})}
                                              placeholder="Email"
                                              className="h-8 text-sm"
                                            />
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-8 w-8"
                                              onClick={() => setEditContact({...editContact, email: ''})}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground">🌐 Website</label>
                                          <div className="flex gap-1">
                                            <Input
                                              value={editContact.website}
                                              onChange={(e) => setEditContact({...editContact, website: e.target.value})}
                                              placeholder="Website"
                                              className="h-8 text-sm"
                                            />
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-8 w-8"
                                              onClick={() => setEditContact({...editContact, website: ''})}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground">✈️ Telegram</label>
                                          <div className="flex gap-1">
                                            <Input
                                              value={editContact.telegram}
                                              onChange={(e) => setEditContact({...editContact, telegram: e.target.value})}
                                              placeholder="Telegram"
                                              className="h-8 text-sm"
                                            />
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-8 w-8"
                                              onClick={() => setEditContact({...editContact, telegram: ''})}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground">📷 Instagram</label>
                                          <div className="flex gap-1">
                                            <Input
                                              value={editContact.instagram}
                                              onChange={(e) => setEditContact({...editContact, instagram: e.target.value})}
                                              placeholder="Instagram"
                                              className="h-8 text-sm"
                                            />
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-8 w-8"
                                              onClick={() => setEditContact({...editContact, instagram: ''})}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs text-muted-foreground">🏠 Adresse</label>
                                        <div className="flex gap-1">
                                          <Input
                                            value={editContact.street_address}
                                            onChange={(e) => setEditContact({...editContact, street_address: e.target.value})}
                                            placeholder="Straße, PLZ Ort"
                                            className="h-8 text-sm"
                                          />
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8"
                                            onClick={() => setEditContact({...editContact, street_address: ''})}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <Button 
                                        size="sm"
                                        onClick={() => updateContactMutation.mutate({
                                          profileId: selectedProfile.id,
                                          contact: editContact
                                        })}
                                        disabled={updateContactMutation.isPending}
                                      >
                                        {updateContactMutation.isPending ? 'Speichere...' : 'Kontakte speichern'}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="space-y-1 text-sm">
                                      {selectedProfile.contact?.phone && <p>📞 {selectedProfile.contact.phone}</p>}
                                      {selectedProfile.contact?.whatsapp && <p>💬 {selectedProfile.contact.whatsapp}</p>}
                                      {selectedProfile.contact?.email && <p>📧 {selectedProfile.contact.email}</p>}
                                      {selectedProfile.contact?.website && <p>🌐 {selectedProfile.contact.website}</p>}
                                      {selectedProfile.contact?.telegram && <p>✈️ {selectedProfile.contact.telegram}</p>}
                                      {selectedProfile.contact?.instagram && <p>📷 {selectedProfile.contact.instagram}</p>}
                                      {selectedProfile.contact?.street_address && <p>🏠 {selectedProfile.contact.street_address}</p>}
                                      {!selectedProfile.contact?.phone && !selectedProfile.contact?.email && 
                                       !selectedProfile.contact?.whatsapp && !selectedProfile.contact?.website && (
                                        <p className="text-muted-foreground italic">Keine Kontaktdaten</p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* AGB-Akzeptanz Nachweis */}
                                <AgbAcceptanceSection profileId={selectedProfile.id} />
                                
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
                                        <option value="basic">Basic ({basicPrice || 'CHF 49/Monat'})</option>
                                        <option value="premium">Premium ({premiumPrice || 'CHF 99/Monat'})</option>
                                        <option value="top">TOP AD ({topPrice || 'CHF 199/Monat'})</option>
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
                                
                                {/* Profil löschen Section */}
                                <div className="border-t pt-4 mt-4">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="destructive" 
                                        className="w-full"
                                        disabled={deleteProfileMutation.isPending}
                                      >
                                        {deleteProfileMutation.isPending ? 'Lösche...' : selectedProfile?.user_id ? '🗑️ Profil + Nutzer löschen' : '🗑️ Profil löschen'}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          {selectedProfile?.user_id ? 'Profil UND Nutzer wirklich löschen?' : 'Profil wirklich löschen?'}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Diese Aktion kann nicht rückgängig gemacht werden.{' '}
                                          {selectedProfile?.user_id ? (
                                            <>
                                              Das Profil von <strong>{selectedProfile?.display_name}</strong> sowie der zugehörige <strong>Nutzer-Account (E-Mail/Login)</strong> werden dauerhaft gelöscht.
                                            </>
                                          ) : (
                                            <>
                                              Das Admin-erstellte Profil von <strong>{selectedProfile?.display_name}</strong> wird dauerhaft gelöscht. (Kein Nutzer-Account vorhanden)
                                            </>
                                          )}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => {
                                            if (selectedProfile) {
                                              deleteProfileMutation.mutate({
                                                profileId: selectedProfile.id,
                                                userId: selectedProfile.user_id || null
                                              });
                                            }
                                          }}
                                        >
                                          {selectedProfile?.user_id ? 'Ja, beides löschen' : 'Ja, Profil löschen'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        </div>
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

// AGB-Akzeptanz Anzeige Komponente
const AgbAcceptanceSection = ({ profileId }: { profileId: string }) => {
  const { data: acceptances, isLoading } = useAgbAcceptances(profileId);

  if (isLoading) {
    return (
      <div className="border rounded-lg p-3">
        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          AGB-Akzeptanz
        </label>
        <p className="text-sm text-muted-foreground">Laden...</p>
      </div>
    );
  }

  const hasAcceptances = acceptances && acceptances.length > 0;

  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
        <FileCheck className="h-4 w-4" />
        📜 AGB-Akzeptanz (Rechtlicher Nachweis)
      </label>
      
      {hasAcceptances ? (
        <div className="space-y-2">
          {acceptances.map((acc) => (
            <div 
              key={acc.id} 
              className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                    ✅ {acc.acceptance_type === 'registration' ? 'Registrierung' : 
                        acc.acceptance_type === 'profile_creation' ? 'Inserat-Erstellung' : 
                        'Admin-Erstellung'}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground">E-Mail:</span>{' '}
                    <strong>{acc.email}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Datum: {new Date(acc.accepted_at).toLocaleString('de-CH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} Uhr
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AGB-Version: {acc.agb_version}
                  </p>
                  {acc.created_by_admin && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Admin-erfasst
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠️ Keine AGB-Akzeptanz gefunden
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dieses Profil wurde möglicherweise vor Einführung der AGB-Erfassung erstellt.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
