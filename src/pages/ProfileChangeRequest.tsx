import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCantons } from '@/hooks/useCantons';
import { useCitiesByCantonSlim, CityWithCoordinates } from '@/hooks/useCitiesByCantonSlim';
import { useCategories } from '@/hooks/useCategories';
import { detectLocation } from '@/lib/geolocation';
import { parseDescription } from '@/lib/changeRequestUtils';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { 
  Loader2, ArrowLeft, Send, CheckCircle, Clock, XCircle, Upload, X, 
  Image as ImageIcon, MapPin, FileText, Tag, Phone, ChevronsUpDown, Check,
  Trash2, Undo, Star, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';
import { cn } from '@/lib/utils';

// Constants
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const GENDER_SLUGS = ['damen', 'maenner', 'transsexuelle'];

interface ChangeRequest {
  id: string;
  request_type: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

interface ProfileData {
  id: string;
  status: string;
  display_name: string;
  about_me: string | null;
  canton: string;
  city: string;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
}

interface ContactData {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  telegram: string | null;
  instagram: string | null;
}

interface ExistingPhoto {
  id: string;
  storage_path: string;
  url: string;
  is_primary: boolean;
}

const ProfileChangeRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data loading state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentCategories, setCurrentCategories] = useState<string[]>([]);
  const [currentContacts, setCurrentContacts] = useState<ContactData | null>(null);
  const [existingRequests, setExistingRequests] = useState<ChangeRequest[]>([]);
  
  // Existing photos management
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [newPhotoOrder, setNewPhotoOrder] = useState<string[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);
  const [newPrimaryPhotoId, setNewPrimaryPhotoId] = useState<string | null>(null);
  
  // Form state - Tab selection
  const [activeTab, setActiveTab] = useState('text');
  
  // Text changes
  const [newName, setNewName] = useState('');
  const [newAboutMe, setNewAboutMe] = useState('');
  const [textNote, setTextNote] = useState('');
  
  // Location changes
  const [selectedCanton, setSelectedCanton] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPostalCode, setSelectedPostalCode] = useState('');
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Category changes
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Contact changes
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWebsite, setContactWebsite] = useState('');
  const [contactTelegram, setContactTelegram] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  
  // Photo changes
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [photoNote, setPhotoNote] = useState('');
  
  // Hooks for data
  const { data: cantons = [] } = useCantons();
  const { data: cities = [], isLoading: citiesLoading } = useCitiesByCantonSlim(selectedCanton);
  const { data: categories = [] } = useCategories();

  // Warn user before leaving if they have unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading || selectedFiles.length > 0) {
        e.preventDefault();
        e.returnValue = 'Du hast ungesendete Änderungen. Wirklich verlassen?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading, selectedFiles]);

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load profile with full data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, status, display_name, about_me, canton, city, postal_code, lat, lng')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        navigate('/profil/erstellen');
        return;
      }

      if (profileData.status !== 'active') {
        navigate('/profil/bearbeiten');
        return;
      }

      setProfile(profileData);
      
      // Initialize form with current values
      setNewName(profileData.display_name || '');
      setNewAboutMe(profileData.about_me || '');
      setSelectedCanton(profileData.canton || '');
      setSelectedCity(profileData.city || '');
      setSelectedPostalCode(profileData.postal_code || '');
      setSelectedLat(profileData.lat);
      setSelectedLng(profileData.lng);

      // Load categories
      const { data: categoriesData } = await supabase
        .from('profile_categories')
        .select('category_id')
        .eq('profile_id', profileData.id);
      
      const catIds = categoriesData?.map(c => c.category_id) || [];
      setCurrentCategories(catIds);
      setSelectedCategories(catIds);

      // Load contacts
      const { data: contactsData } = await supabase
        .from('profile_contacts')
        .select('phone, whatsapp, email, website, telegram, instagram')
        .eq('profile_id', profileData.id)
        .maybeSingle();
      
      if (contactsData) {
        setCurrentContacts(contactsData);
        setContactPhone(contactsData.phone || '');
        setContactWhatsapp(contactsData.whatsapp || '');
        setContactEmail(contactsData.email || '');
        setContactWebsite(contactsData.website || '');
        setContactTelegram(contactsData.telegram || '');
        setContactInstagram(contactsData.instagram || '');
      }

      // Load existing photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('id, storage_path, is_primary')
        .eq('profile_id', profileData.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (photosData && photosData.length > 0) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const mappedPhotos: ExistingPhoto[] = photosData.map(p => ({
          id: p.id,
          storage_path: p.storage_path,
          url: `${supabaseUrl}/storage/v1/object/public/profile-photos/${p.storage_path}`,
          is_primary: p.is_primary || false,
        }));
        setExistingPhotos(mappedPhotos);
        setNewPhotoOrder(mappedPhotos.map(p => p.id));
      }

      // Load existing requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('profile_change_requests')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setExistingRequests((requestsData as ChangeRequest[]) || []);
    } catch (error) {
      toast({
        title: 'Fehler beim Laden',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Location detection
  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const location = await detectLocation();
      
      const matchingCanton = cantons.find((c) =>
        c.name.toLowerCase().includes(location.canton.toLowerCase()) ||
        c.abbreviation.toLowerCase() === location.canton.toLowerCase() ||
        location.canton.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (matchingCanton) {
        setSelectedCanton(matchingCanton.abbreviation);
      }
      
      setSelectedCity(location.city);
      setSelectedPostalCode(location.postalCode);
      setSelectedLat(location.lat);
      setSelectedLng(location.lng);
      
      toast({
        title: 'Standort erkannt',
        description: `${location.city}, ${matchingCanton?.abbreviation || location.canton}`,
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Standort konnte nicht ermittelt werden',
        variant: 'destructive',
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  // City selection handler
  const handleCitySelect = (city: CityWithCoordinates) => {
    setSelectedCity(city.name);
    if (city.postal_code) {
      setSelectedPostalCode(city.postal_code);
    }
    if (city.lat && city.lng) {
      setSelectedLat(city.lat);
      setSelectedLng(city.lng);
    }
    setCityOpen(false);
  };

  // Category toggle with gender/service logic
  const genderCategories = categories.filter(cat => GENDER_SLUGS.includes(cat.slug));
  const serviceCategories = categories.filter(cat => !GENDER_SLUGS.includes(cat.slug));
  const selectedGenderId = genderCategories.find(g => selectedCategories.includes(g.id))?.id;
  const selectedServiceIds = serviceCategories.filter(s => selectedCategories.includes(s.id)).map(s => s.id);

  const toggleCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const isGender = GENDER_SLUGS.includes(category.slug);

    if (isGender) {
      // Radio-style: replace any existing gender
      const withoutGender = selectedCategories.filter(id => {
        const cat = categories.find(c => c.id === id);
        return cat && !GENDER_SLUGS.includes(cat.slug);
      });
      
      if (selectedCategories.includes(categoryId)) {
        // Deselect
        setSelectedCategories(withoutGender);
      } else {
        // Select new gender
        setSelectedCategories([...withoutGender, categoryId]);
      }
    } else {
      // Service toggle with max 2 limit
      if (selectedCategories.includes(categoryId)) {
        setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
      } else if (selectedServiceIds.length < 2) {
        setSelectedCategories([...selectedCategories, categoryId]);
      }
    }
  };

  // Photo management handlers
  const togglePhotoForDeletion = (photoId: string) => {
    setPhotosToDelete(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
    // If the photo being deleted was set as new primary, remove that selection
    if (newPrimaryPhotoId === photoId) {
      setNewPrimaryPhotoId(null);
    }
  };

  const movePhotoLeft = (photoId: string) => {
    const index = newPhotoOrder.indexOf(photoId);
    if (index > 0) {
      const order = [...newPhotoOrder];
      [order[index - 1], order[index]] = [order[index], order[index - 1]];
      setNewPhotoOrder(order);
      setOrderChanged(true);
    }
  };

  const movePhotoRight = (photoId: string) => {
    const index = newPhotoOrder.indexOf(photoId);
    if (index < newPhotoOrder.length - 1) {
      const order = [...newPhotoOrder];
      [order[index], order[index + 1]] = [order[index + 1], order[index]];
      setNewPhotoOrder(order);
      setOrderChanged(true);
    }
  };

  const setNewPrimary = (photoId: string) => {
    if (!photosToDelete.includes(photoId)) {
      const currentPrimary = existingPhotos.find(p => p.is_primary);
      // Only set if it's different from current primary
      if (currentPrimary?.id !== photoId) {
        setNewPrimaryPhotoId(photoId);
      } else {
        setNewPrimaryPhotoId(null);
      }
    }
  };

  // File handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_FILES - selectedFiles.length;
    if (files.length > remainingSlots) {
      toast({
        title: 'Zu viele Bilder',
        description: `Du kannst maximal ${MAX_FILES} Bilder hochladen.`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: 'Ungültiger Dateityp',
          description: `${file.name} ist kein gültiges Bildformat. Erlaubt: JPEG, PNG, WebP`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Datei zu gross',
          description: `${file.name} ist grösser als 5MB.`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setFilePreviews(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Build ALL changes across all tabs
  const buildAllChanges = () => {
    const allChanges: { 
      type: string; 
      changes: { field: string; old_value: string; new_value: string }[] 
    }[] = [];

    // Text changes
    const textChanges: { field: string; old_value: string; new_value: string }[] = [];
    if (newName !== profile?.display_name) {
      textChanges.push({ field: 'display_name', old_value: profile?.display_name || '', new_value: newName });
    }
    if (newAboutMe !== (profile?.about_me || '')) {
      textChanges.push({ field: 'about_me', old_value: profile?.about_me || '', new_value: newAboutMe });
    }
    if (textNote.trim()) {
      textChanges.push({ field: 'note', old_value: '', new_value: textNote });
    }
    if (textChanges.length > 0) {
      allChanges.push({ type: 'text', changes: textChanges });
    }

    // Location changes
    const locationChanges: { field: string; old_value: string; new_value: string }[] = [];
    if (selectedCanton !== profile?.canton) {
      locationChanges.push({ field: 'canton', old_value: profile?.canton || '', new_value: selectedCanton });
    }
    if (selectedCity !== profile?.city) {
      locationChanges.push({ field: 'city', old_value: profile?.city || '', new_value: selectedCity });
    }
    if (selectedPostalCode !== (profile?.postal_code || '')) {
      locationChanges.push({ field: 'postal_code', old_value: profile?.postal_code || '', new_value: selectedPostalCode });
    }
    if (selectedLat && selectedLng && (selectedLat !== profile?.lat || selectedLng !== profile?.lng)) {
      locationChanges.push({ field: 'coordinates', old_value: `${profile?.lat || ''},${profile?.lng || ''}`, new_value: `${selectedLat},${selectedLng}` });
    }
    if (locationChanges.length > 0) {
      allChanges.push({ type: 'location', changes: locationChanges });
    }

    // Category changes - store UUIDs for processing, names for display
    const categoriesChanged = JSON.stringify([...selectedCategories].sort()) !== JSON.stringify([...currentCategories].sort());
    if (categoriesChanged) {
      // Store category UUIDs (not names) so changeRequestUtils can process them
      allChanges.push({ 
        type: 'categories', 
        changes: [{ 
          field: 'categories', 
          old_value: currentCategories.join(','),  // UUIDs for reference
          new_value: selectedCategories.join(',')   // UUIDs for processing
        }] 
      });
    }

    // Contact changes
    const contactChanges: { field: string; old_value: string; new_value: string }[] = [];
    if (contactPhone !== (currentContacts?.phone || '')) {
      contactChanges.push({ field: 'phone', old_value: currentContacts?.phone || '', new_value: contactPhone });
    }
    if (contactWhatsapp !== (currentContacts?.whatsapp || '')) {
      contactChanges.push({ field: 'whatsapp', old_value: currentContacts?.whatsapp || '', new_value: contactWhatsapp });
    }
    if (contactEmail !== (currentContacts?.email || '')) {
      contactChanges.push({ field: 'email', old_value: currentContacts?.email || '', new_value: contactEmail });
    }
    if (contactWebsite !== (currentContacts?.website || '')) {
      contactChanges.push({ field: 'website', old_value: currentContacts?.website || '', new_value: contactWebsite });
    }
    if (contactTelegram !== (currentContacts?.telegram || '')) {
      contactChanges.push({ field: 'telegram', old_value: currentContacts?.telegram || '', new_value: contactTelegram });
    }
    if (contactInstagram !== (currentContacts?.instagram || '')) {
      contactChanges.push({ field: 'instagram', old_value: currentContacts?.instagram || '', new_value: contactInstagram });
    }
    if (contactChanges.length > 0) {
      allChanges.push({ type: 'contact', changes: contactChanges });
    }

    // Photo changes - FIX: Store actual UUIDs, not human-readable strings
    const photoChanges: { field: string; old_value: string; new_value: string }[] = [];
    
    // DELETE PHOTOS - store actual UUIDs
    if (photosToDelete.length > 0) {
      photoChanges.push({ 
        field: 'delete_photos', 
        old_value: `${photosToDelete.length} Fotos`,  // Human-readable for display
        new_value: photosToDelete.join(',')            // Actual UUIDs for processing
      });
    }
    
    // REORDER PHOTOS - store UUIDs in new order
    if (orderChanged) {
      const oldOrderUUIDs = existingPhotos.map(p => p.id).join(',');
      photoChanges.push({ 
        field: 'reorder_photos', 
        old_value: oldOrderUUIDs,           // Old order UUIDs
        new_value: newPhotoOrder.join(',')  // New order UUIDs
      });
    }
    
    // PRIMARY PHOTO - store actual UUID
    if (newPrimaryPhotoId) {
      const currentPrimary = existingPhotos.find(p => p.is_primary);
      if (currentPrimary?.id !== newPrimaryPhotoId) {
        photoChanges.push({ 
          field: 'primary_photo', 
          old_value: currentPrimary?.id || '',  // Old primary UUID
          new_value: newPrimaryPhotoId          // New primary UUID
        });
      }
    }
    
    if (selectedFiles.length > 0) {
      photoChanges.push({ field: 'new_photos', old_value: '', new_value: `${selectedFiles.length} neue Bilder` });
    }
    if (photoNote.trim()) {
      photoChanges.push({ field: 'photo_note', old_value: '', new_value: photoNote });
    }
    if (photoChanges.length > 0) {
      allChanges.push({ type: 'photos', changes: photoChanges });
    }

    return allChanges;
  };

  // Check if there are ANY changes across all tabs
  const hasAnyChanges = () => {
    // Text
    const textChanged = newName !== profile?.display_name || 
                        newAboutMe !== (profile?.about_me || '') || 
                        textNote.trim() !== '';
    
    // Location
    const locationChanged = selectedCanton !== profile?.canton || 
                            selectedCity !== profile?.city ||
                            selectedPostalCode !== (profile?.postal_code || '');
    
    // Categories
    const categoriesChanged = JSON.stringify([...selectedCategories].sort()) !== 
                              JSON.stringify([...currentCategories].sort());
    
    // Contact
    const contactChanged = contactPhone !== (currentContacts?.phone || '') ||
                           contactWhatsapp !== (currentContacts?.whatsapp || '') ||
                           contactEmail !== (currentContacts?.email || '') ||
                           contactWebsite !== (currentContacts?.website || '') ||
                           contactTelegram !== (currentContacts?.telegram || '') ||
                           contactInstagram !== (currentContacts?.instagram || '');
    
    // Photos
    const currentPrimary = existingPhotos.find(p => p.is_primary);
    const primaryChanged = newPrimaryPhotoId !== null && newPrimaryPhotoId !== currentPrimary?.id;
    const photosChanged = selectedFiles.length > 0 || 
                          photoNote.trim() !== '' || 
                          photosToDelete.length > 0 || 
                          orderChanged ||
                          primaryChanged;

    return textChanged || locationChanged || categoriesChanged || contactChanged || photosChanged;
  };

  // Legacy hasChanges for current tab (still useful for tab-specific UI feedback)
  const hasChanges = () => {
    switch (activeTab) {
      case 'text':
        return newName !== profile?.display_name || newAboutMe !== (profile?.about_me || '') || textNote.trim() !== '';
      case 'location':
        return selectedCanton !== profile?.canton || selectedCity !== profile?.city;
      case 'categories':
        return JSON.stringify([...selectedCategories].sort()) !== JSON.stringify([...currentCategories].sort());
      case 'contact':
        return contactPhone !== (currentContacts?.phone || '') ||
               contactWhatsapp !== (currentContacts?.whatsapp || '') ||
               contactEmail !== (currentContacts?.email || '') ||
               contactWebsite !== (currentContacts?.website || '') ||
               contactTelegram !== (currentContacts?.telegram || '') ||
               contactInstagram !== (currentContacts?.instagram || '');
      case 'photos':
        const currentPrimary = existingPhotos.find(p => p.is_primary);
        const primaryChanged = newPrimaryPhotoId !== null && newPrimaryPhotoId !== currentPrimary?.id;
        return selectedFiles.length > 0 || 
               photoNote.trim() !== '' || 
               photosToDelete.length > 0 || 
               orderChanged ||
               primaryChanged;
      default:
        return false;
    }
  };

  // Category change helpers
  const addedCategories = selectedCategories.filter(id => !currentCategories.includes(id));
  const removedCategories = currentCategories.filter(id => !selectedCategories.includes(id));

  // Delete a pending change request
  const handleDeleteRequest = async (requestId: string) => {
    try {
      // First, get and delete any associated media from storage
      const { data: media } = await supabase
        .from('change_request_media')
        .select('storage_path')
        .eq('request_id', requestId);

      if (media && media.length > 0) {
        await supabase.storage
          .from('change-request-media')
          .remove(media.map(m => m.storage_path));
      }

      // Delete the change request (RLS policy ensures only pending + own requests)
      const { error } = await supabase
        .from('profile_change_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Anfrage gelöscht',
        description: 'Deine Änderungsanfrage wurde entfernt.',
      });

      // Reload data to refresh the list
      loadData();
    } catch (error) {
      console.error('Delete request error:', error);
      toast({
        title: 'Fehler',
        description: 'Die Anfrage konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !user) return;

    // Use hasAnyChanges to check all tabs, not just active
    if (!hasAnyChanges()) {
      toast({
        title: 'Keine Änderungen',
        description: 'Du hast noch keine Änderungen vorgenommen.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const uploadedPaths: string[] = [];

    try {
      // Build all changes across all tabs
      const allChanges = buildAllChanges();
      
      // Upload images if present (regardless of active tab, check if photos were selected)
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const compressedFile = await compressImage(file);
          const extension = compressedFile.name.split('.').pop() || 'webp';
          const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
          
          const { error: uploadError } = await supabase.storage
            .from('change-request-media')
            .upload(path, compressedFile);

          if (uploadError) throw uploadError;
          uploadedPaths.push(path);
          setUploadProgress({ current: i + 1, total: selectedFiles.length });
        }
        setIsUploading(false);
      }

      // Determine request_type: 'combined' if multiple types, otherwise single type
      const requestType = allChanges.length > 1 ? 'combined' : allChanges[0]?.type || 'other';
      
      // Create the change request with all changes
      const { data: request, error: requestError } = await supabase
        .from('profile_change_requests')
        .insert({
          profile_id: profile.id,
          user_id: user.id,
          request_type: requestType,
          description: JSON.stringify(allChanges),
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create media entries if we uploaded files
      if (uploadedPaths.length > 0) {
        const mediaInserts = uploadedPaths.map(path => ({
          request_id: request.id,
          storage_path: path,
        }));

        const { error: mediaError } = await supabase
          .from('change_request_media')
          .insert(mediaInserts);

        if (mediaError) throw mediaError;
      }

      toast({
        title: 'Anfrage gesendet',
        description: `Deine Änderungsanfrage (${allChanges.length} Bereich${allChanges.length > 1 ? 'e' : ''}) wurde eingereicht.`,
      });

      // Reset all form fields
      setTextNote('');
      if (selectedFiles.length > 0) {
        filePreviews.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setFilePreviews([]);
      }
      setPhotoNote('');
      setPhotosToDelete([]);
      setOrderChanged(false);
      setNewPrimaryPhotoId(null);
      setNewPhotoOrder(existingPhotos.map(p => p.id));
      
      // Reload data to show updated requests
      loadData();

    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from('change-request-media')
          .remove(uploadedPaths);
      }

      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Bearbeitung
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            Genehmigt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Abgelehnt
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Texte',
      location: 'Standort',
      categories: 'Kategorien',
      contact: 'Kontakt',
      photos: 'Fotos',
      other: 'Sonstiges',
      combined: 'Mehrere Bereiche',
    };
    return labels[type] || type;
  };

  // Helper component for value comparison
  const ValueComparison = ({ label, oldValue, newValue, changed }: { 
    label: string; 
    oldValue: string; 
    newValue: string; 
    changed: boolean;
  }) => {
    if (!changed) return null;
    return (
      <div className="mt-1 text-xs flex items-center gap-1.5 text-muted-foreground">
        <span className="font-medium">{label}:</span>
        <span className="line-through text-destructive/70">{oldValue || '(leer)'}</span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-primary font-medium">{newValue || '(leer)'}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <SEO title="Änderung anfragen" description="Fordere eine Änderung deines Profils an" />
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Änderung anfragen" description="Fordere eine Änderung deines Profils an" />
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/mein-profil">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Link>
            </Button>

            <h1 className="text-3xl font-bold mb-2">Änderung anfragen</h1>
            <p className="text-muted-foreground mb-8">
              Dein Profil ist aktiv. Wähle aus, was du ändern möchtest, und fülle die entsprechenden Felder aus.
            </p>

            {/* Tab-based Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Was möchtest du ändern?</CardTitle>
                <CardDescription>
                  Wähle eine Kategorie und gib die gewünschten Änderungen ein.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-6">
                      <TabsTrigger value="text" className="gap-1 text-xs sm:text-sm">
                        <FileText className="h-4 w-4 hidden sm:inline" />
                        Texte
                      </TabsTrigger>
                      <TabsTrigger value="location" className="gap-1 text-xs sm:text-sm">
                        <MapPin className="h-4 w-4 hidden sm:inline" />
                        Standort
                      </TabsTrigger>
                      <TabsTrigger value="categories" className="gap-1 text-xs sm:text-sm">
                        <Tag className="h-4 w-4 hidden sm:inline" />
                        Kategorien
                      </TabsTrigger>
                      <TabsTrigger value="contact" className="gap-1 text-xs sm:text-sm">
                        <Phone className="h-4 w-4 hidden sm:inline" />
                        Kontakt
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="gap-1 text-xs sm:text-sm">
                        <ImageIcon className="h-4 w-4 hidden sm:inline" />
                        Fotos
                      </TabsTrigger>
                    </TabsList>

                    {/* TEXT TAB */}
                    <TabsContent value="text" className="space-y-4">
                      <div>
                        <Label htmlFor="newName">Name</Label>
                        <Input
                          id="newName"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Dein Anzeigename"
                          className={cn(
                            newName !== profile?.display_name && "border-primary"
                          )}
                        />
                        <ValueComparison 
                          label="Änderung"
                          oldValue={profile?.display_name || ''}
                          newValue={newName}
                          changed={newName !== profile?.display_name}
                        />
                      </div>
                      <div>
                        <Label htmlFor="newAboutMe">Beschreibung</Label>
                        <Textarea
                          id="newAboutMe"
                          value={newAboutMe}
                          onChange={(e) => setNewAboutMe(e.target.value)}
                          placeholder="Über mich..."
                          rows={6}
                          className={cn(
                            newAboutMe !== (profile?.about_me || '') && "border-primary"
                          )}
                        />
                        {newAboutMe !== (profile?.about_me || '') && (
                          <p className="mt-1 text-xs text-primary flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Text wurde geändert
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="textNote">Zusätzliche Anmerkungen (optional)</Label>
                        <Textarea
                          id="textNote"
                          value={textNote}
                          onChange={(e) => setTextNote(e.target.value)}
                          placeholder="Weitere Hinweise für den Admin..."
                          rows={2}
                        />
                      </div>
                    </TabsContent>

                    {/* LOCATION TAB */}
                    <TabsContent value="location" className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDetectLocation}
                          disabled={detectingLocation}
                        >
                          {detectingLocation ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4 mr-1" />
                          )}
                          Mein Standort
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Kanton</Label>
                        <Select 
                          value={selectedCanton} 
                          onValueChange={(value) => {
                            setSelectedCanton(value);
                            if (selectedCanton !== value) {
                              setSelectedCity('');
                              setSelectedPostalCode('');
                            }
                          }}
                        >
                          <SelectTrigger className={cn(
                            selectedCanton !== profile?.canton && "border-primary"
                          )}>
                            <SelectValue placeholder="Wähle deinen Kanton" />
                          </SelectTrigger>
                          <SelectContent>
                            {cantons.map((canton) => (
                              <SelectItem key={canton.id} value={canton.abbreviation}>
                                {canton.name} ({canton.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ValueComparison 
                          label="Änderung"
                          oldValue={profile?.canton || ''}
                          newValue={selectedCanton}
                          changed={selectedCanton !== profile?.canton}
                        />
                      </div>

                      <div>
                        <Label>Stadt</Label>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                selectedCity !== profile?.city && "border-primary"
                              )}
                              disabled={!selectedCanton || citiesLoading}
                            >
                              {citiesLoading ? (
                                <span className="text-muted-foreground">Lade Städte...</span>
                              ) : selectedCity ? (
                                <span>{selectedCity}</span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {selectedCanton ? "Stadt wählen..." : "Zuerst Kanton wählen"}
                                </span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Stadt suchen..." />
                              <CommandList>
                                <CommandEmpty>Keine Stadt gefunden</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                  {cities.map((city) => (
                                    <CommandItem
                                      key={city.id}
                                      value={city.name}
                                      onSelect={() => handleCitySelect(city)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedCity === city.name ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {city.name} {city.postal_code && `(${city.postal_code})`}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <ValueComparison 
                          label="Änderung"
                          oldValue={profile?.city || ''}
                          newValue={selectedCity}
                          changed={selectedCity !== profile?.city}
                        />
                      </div>

                      <div>
                        <Label>PLZ</Label>
                        <Input value={selectedPostalCode} readOnly className="bg-muted" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Wird automatisch aus der Stadt übernommen
                        </p>
                      </div>
                    </TabsContent>

                    {/* CATEGORIES TAB */}
                    <TabsContent value="categories" className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Wähle dein Geschlecht (Pflicht) und bis zu 2 Services (optional)
                        </p>
                        
                        {/* Gender */}
                        <div className="mb-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Geschlecht</p>
                          <div className="grid grid-cols-2 gap-2">
                            {genderCategories.map(cat => {
                              const isCurrentlySelected = currentCategories.includes(cat.id);
                              return (
                                <div key={cat.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`cat-${cat.id}`}
                                    checked={selectedCategories.includes(cat.id)}
                                    onCheckedChange={() => toggleCategory(cat.id)}
                                    disabled={!!selectedGenderId && selectedGenderId !== cat.id}
                                  />
                                  <label 
                                    htmlFor={`cat-${cat.id}`} 
                                    className={cn(
                                      "text-sm cursor-pointer flex items-center gap-1.5",
                                      selectedGenderId && selectedGenderId !== cat.id && 'text-muted-foreground'
                                    )}
                                  >
                                    {cat.name}
                                    {isCurrentlySelected && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        Aktuell
                                      </Badge>
                                    )}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Services */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            Service / Angebot ({selectedServiceIds.length}/2)
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {serviceCategories.map(cat => {
                              const isCurrentlySelected = currentCategories.includes(cat.id);
                              return (
                                <div key={cat.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`cat-${cat.id}`}
                                    checked={selectedCategories.includes(cat.id)}
                                    onCheckedChange={() => toggleCategory(cat.id)}
                                    disabled={selectedServiceIds.length >= 2 && !selectedServiceIds.includes(cat.id)}
                                  />
                                  <label 
                                    htmlFor={`cat-${cat.id}`} 
                                    className={cn(
                                      "text-sm cursor-pointer flex items-center gap-1.5",
                                      selectedServiceIds.length >= 2 && !selectedServiceIds.includes(cat.id) && 'text-muted-foreground'
                                    )}
                                  >
                                    {cat.name}
                                    {isCurrentlySelected && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        Aktuell
                                      </Badge>
                                    )}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Category changes summary */}
                        {(addedCategories.length > 0 || removedCategories.length > 0) && (
                          <div className="mt-4 p-3 bg-muted rounded-lg text-sm space-y-1">
                            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Änderungen</p>
                            {addedCategories.length > 0 && (
                              <p className="text-primary flex items-center gap-1">
                                <span className="font-bold">+</span>
                                {addedCategories.map(id => categories.find(c => c.id === id)?.name).join(', ')}
                              </p>
                            )}
                            {removedCategories.length > 0 && (
                              <p className="text-destructive flex items-center gap-1">
                                <span className="font-bold">−</span>
                                {removedCategories.map(id => categories.find(c => c.id === id)?.name).join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* CONTACT TAB */}
                    <TabsContent value="contact" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactPhone">Telefon</Label>
                          <Input
                            id="contactPhone"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+41..."
                            className={cn(
                              contactPhone !== (currentContacts?.phone || '') && "border-primary"
                            )}
                          />
                          <ValueComparison 
                            label="Aktuell"
                            oldValue={currentContacts?.phone || ''}
                            newValue={contactPhone}
                            changed={contactPhone !== (currentContacts?.phone || '')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactWhatsapp">WhatsApp</Label>
                          <Input
                            id="contactWhatsapp"
                            value={contactWhatsapp}
                            onChange={(e) => setContactWhatsapp(e.target.value)}
                            placeholder="+41..."
                            className={cn(
                              contactWhatsapp !== (currentContacts?.whatsapp || '') && "border-primary"
                            )}
                          />
                          <ValueComparison 
                            label="Aktuell"
                            oldValue={currentContacts?.whatsapp || ''}
                            newValue={contactWhatsapp}
                            changed={contactWhatsapp !== (currentContacts?.whatsapp || '')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactEmail">E-Mail</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="email@example.com"
                            className={cn(
                              contactEmail !== (currentContacts?.email || '') && "border-primary"
                            )}
                          />
                          <ValueComparison 
                            label="Aktuell"
                            oldValue={currentContacts?.email || ''}
                            newValue={contactEmail}
                            changed={contactEmail !== (currentContacts?.email || '')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactWebsite">Website</Label>
                          <Input
                            id="contactWebsite"
                            value={contactWebsite}
                            onChange={(e) => setContactWebsite(e.target.value)}
                            placeholder="https://..."
                            className={cn(
                              contactWebsite !== (currentContacts?.website || '') && "border-primary"
                            )}
                          />
                          <ValueComparison 
                            label="Aktuell"
                            oldValue={currentContacts?.website || ''}
                            newValue={contactWebsite}
                            changed={contactWebsite !== (currentContacts?.website || '')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactTelegram">Telegram</Label>
                          <Input
                            id="contactTelegram"
                            value={contactTelegram}
                            onChange={(e) => setContactTelegram(e.target.value)}
                            placeholder="@username"
                            className={cn(
                              contactTelegram !== (currentContacts?.telegram || '') && "border-primary"
                            )}
                          />
                          <ValueComparison 
                            label="Aktuell"
                            oldValue={currentContacts?.telegram || ''}
                            newValue={contactTelegram}
                            changed={contactTelegram !== (currentContacts?.telegram || '')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactInstagram">Instagram</Label>
                          <Input
                            id="contactInstagram"
                            value={contactInstagram}
                            onChange={(e) => setContactInstagram(e.target.value)}
                            placeholder="@username"
                            className={cn(
                              contactInstagram !== (currentContacts?.instagram || '') && "border-primary"
                            )}
                          />
                          <ValueComparison 
                            label="Aktuell"
                            oldValue={currentContacts?.instagram || ''}
                            newValue={contactInstagram}
                            changed={contactInstagram !== (currentContacts?.instagram || '')}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* PHOTOS TAB */}
                    <TabsContent value="photos" className="space-y-6">
                      {/* Existing Photos */}
                      {existingPhotos.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Deine aktuellen Fotos ({existingPhotos.length})
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Markiere Fotos zum Löschen, ändere die Reihenfolge oder wähle ein neues Hauptfoto.
                          </p>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {newPhotoOrder.map((photoId, index) => {
                              const photo = existingPhotos.find(p => p.id === photoId);
                              if (!photo) return null;
                              
                              const isMarkedForDeletion = photosToDelete.includes(photo.id);
                              const currentPrimary = existingPhotos.find(p => p.is_primary);
                              const isPrimary = (photo.is_primary && !newPrimaryPhotoId) || newPrimaryPhotoId === photo.id;
                              const originalIndex = existingPhotos.findIndex(p => p.id === photo.id);
                              
                              return (
                                <div 
                                  key={photo.id} 
                                  className={cn(
                                    "relative group rounded-lg overflow-hidden border-2 transition-all",
                                    isMarkedForDeletion ? "border-destructive opacity-60" : "border-border",
                                    isPrimary && !isMarkedForDeletion && "border-primary ring-2 ring-primary/20"
                                  )}
                                >
                                  <img
                                    src={photo.url}
                                    alt={`Foto ${originalIndex + 1}`}
                                    className="w-full aspect-square object-cover"
                                    loading="lazy"
                                  />
                                  
                                  {/* Position Badge */}
                                  <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                    {index + 1}
                                  </div>
                                  
                                  {/* Primary Badge */}
                                  {isPrimary && !isMarkedForDeletion && (
                                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-current" />
                                      Haupt
                                    </div>
                                  )}
                                  
                                  {/* Deletion Overlay */}
                                  {isMarkedForDeletion && (
                                    <div className="absolute inset-0 bg-destructive/30 flex items-center justify-center">
                                      <Trash2 className="h-8 w-8 text-destructive" />
                                    </div>
                                  )}
                                  
                                  {/* Action Buttons */}
                                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Delete Toggle */}
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant={isMarkedForDeletion ? "default" : "secondary"}
                                      className="h-7 w-7"
                                      onClick={() => togglePhotoForDeletion(photo.id)}
                                      title={isMarkedForDeletion ? "Nicht löschen" : "Zum Löschen markieren"}
                                    >
                                      {isMarkedForDeletion ? <Undo className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                    
                                    {/* Set as Primary */}
                                    {!isMarkedForDeletion && !isPrimary && (
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7"
                                        onClick={() => setNewPrimary(photo.id)}
                                        title="Als Hauptfoto setzen"
                                      >
                                        <Star className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Reorder Buttons */}
                                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="secondary"
                                      className="h-6 w-6"
                                      onClick={() => movePhotoLeft(photo.id)}
                                      disabled={index === 0}
                                      title="Nach vorne"
                                    >
                                      <ChevronLeft className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="secondary"
                                      className="h-6 w-6"
                                      onClick={() => movePhotoRight(photo.id)}
                                      disabled={index === newPhotoOrder.length - 1}
                                      title="Nach hinten"
                                    >
                                      <ChevronRight className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Photo Changes Summary */}
                          {(photosToDelete.length > 0 || orderChanged || newPrimaryPhotoId) && (
                            <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                Geplante Änderungen
                              </p>
                              {photosToDelete.length > 0 && (
                                <p className="text-destructive flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" />
                                  {photosToDelete.length} Foto(s) zum Löschen markiert
                                </p>
                              )}
                              {orderChanged && (
                                <p className="text-primary flex items-center gap-2">
                                  <ChevronLeft className="h-4 w-4" />
                                  <ChevronRight className="h-4 w-4 -ml-3" />
                                  Neue Reihenfolge wird angefragt
                                </p>
                              )}
                              {newPrimaryPhotoId && (
                                <p className="text-primary flex items-center gap-2">
                                  <Star className="h-4 w-4" />
                                  Neues Hauptfoto ausgewählt (Foto {existingPhotos.findIndex(p => p.id === newPrimaryPhotoId) + 1})
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {existingPhotos.length > 0 && <Separator />}

                      {/* New Photos Upload */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Neue Fotos hinzufügen</h4>
                        <div 
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Klicke hier um Bilder auszuwählen
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Max. {MAX_FILES} Bilder, je max. 5MB (JPEG, PNG, WebP)
                          </p>
                        </div>

                        {selectedFiles.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              {selectedFiles.length} neue(s) Bild{selectedFiles.length > 1 ? 'er' : ''} ausgewählt:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {filePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={preview}
                                    alt={`Vorschau ${index + 1}`}
                                    className="h-20 w-20 object-cover rounded-lg border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {isUploading && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Lade Bilder hoch...</span>
                              <span>{uploadProgress.current} / {uploadProgress.total}</span>
                            </div>
                            <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="photoNote">Zusätzliche Anmerkungen (optional)</Label>
                        <Textarea
                          id="photoNote"
                          value={photoNote}
                          onChange={(e) => setPhotoNote(e.target.value)}
                          placeholder="z.B. 'Bitte diese neuen Bilder als erste anzeigen'"
                          rows={2}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      disabled={submitting || isUploading || !hasChanges()}
                      className="w-full sm:w-auto"
                    >
                      {submitting || isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {isUploading ? 'Bilder werden hochgeladen...' : 'Änderung anfragen'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Existing Requests */}
            {existingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deine Anfragen</CardTitle>
                  <CardDescription>
                    Übersicht deiner bisherigen Änderungsanfragen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {existingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {getRequestTypeLabel(request.request_type)}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {(() => {
                            // Try new combined format first
                            const changeGroups = parseDescription(request.description);
                            if (changeGroups) {
                              return changeGroups.flatMap(group => 
                                group.changes.map(c => `${c.field}: ${c.new_value}`)
                              ).join(', ');
                            }
                            // Try legacy format
                            try {
                              const legacyChanges = JSON.parse(request.description);
                              if (Array.isArray(legacyChanges) && legacyChanges.length > 0) {
                                return legacyChanges.map((c: { field: string; new_value: string }) => 
                                  `${c.field}: ${c.new_value}`
                                ).join(', ');
                              }
                              return request.description;
                            } catch {
                              return request.description;
                            }
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {request.admin_note && (
                          <div className="bg-muted p-2 rounded text-sm">
                            <span className="font-medium">Admin-Notiz:</span>{' '}
                            {request.admin_note}
                          </div>
                        )}
                        
                        {/* Delete button only for pending requests */}
                        {request.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="mt-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Anfrage löschen
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Anfrage wirklich löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Möchtest du diese Änderungsanfrage wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRequest(request.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileChangeRequest;
