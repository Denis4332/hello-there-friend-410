import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCantons } from '@/hooks/useCantons';
import { useCitiesByCantonSlim, CityWithCoordinates } from '@/hooks/useCitiesByCantonSlim';
import { useCategories } from '@/hooks/useCategories';
import { detectLocation } from '@/lib/geolocation';
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
  Loader2, ArrowLeft, Send, CheckCircle, Clock, XCircle, Upload, X, 
  Image as ImageIcon, MapPin, FileText, Tag, Phone, ChevronsUpDown, Check 
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

  // Build structured description based on active tab
  const buildDescription = () => {
    const changes: { field: string; old_value: string; new_value: string }[] = [];

    switch (activeTab) {
      case 'text':
        if (newName !== profile?.display_name) {
          changes.push({ field: 'display_name', old_value: profile?.display_name || '', new_value: newName });
        }
        if (newAboutMe !== (profile?.about_me || '')) {
          changes.push({ field: 'about_me', old_value: profile?.about_me || '', new_value: newAboutMe });
        }
        if (textNote) {
          changes.push({ field: 'note', old_value: '', new_value: textNote });
        }
        break;

      case 'location':
        if (selectedCanton !== profile?.canton) {
          changes.push({ field: 'canton', old_value: profile?.canton || '', new_value: selectedCanton });
        }
        if (selectedCity !== profile?.city) {
          changes.push({ field: 'city', old_value: profile?.city || '', new_value: selectedCity });
        }
        if (selectedPostalCode !== (profile?.postal_code || '')) {
          changes.push({ field: 'postal_code', old_value: profile?.postal_code || '', new_value: selectedPostalCode });
        }
        if (selectedLat && selectedLng) {
          changes.push({ field: 'coordinates', old_value: `${profile?.lat || ''},${profile?.lng || ''}`, new_value: `${selectedLat},${selectedLng}` });
        }
        break;

      case 'categories':
        const oldCatNames = currentCategories.map(id => categories.find(c => c.id === id)?.name || id).join(', ');
        const newCatNames = selectedCategories.map(id => categories.find(c => c.id === id)?.name || id).join(', ');
        if (oldCatNames !== newCatNames) {
          changes.push({ field: 'categories', old_value: oldCatNames, new_value: newCatNames });
        }
        break;

      case 'contact':
        if (contactPhone !== (currentContacts?.phone || '')) {
          changes.push({ field: 'phone', old_value: currentContacts?.phone || '', new_value: contactPhone });
        }
        if (contactWhatsapp !== (currentContacts?.whatsapp || '')) {
          changes.push({ field: 'whatsapp', old_value: currentContacts?.whatsapp || '', new_value: contactWhatsapp });
        }
        if (contactEmail !== (currentContacts?.email || '')) {
          changes.push({ field: 'email', old_value: currentContacts?.email || '', new_value: contactEmail });
        }
        if (contactWebsite !== (currentContacts?.website || '')) {
          changes.push({ field: 'website', old_value: currentContacts?.website || '', new_value: contactWebsite });
        }
        if (contactTelegram !== (currentContacts?.telegram || '')) {
          changes.push({ field: 'telegram', old_value: currentContacts?.telegram || '', new_value: contactTelegram });
        }
        if (contactInstagram !== (currentContacts?.instagram || '')) {
          changes.push({ field: 'instagram', old_value: currentContacts?.instagram || '', new_value: contactInstagram });
        }
        break;

      case 'photos':
        if (selectedFiles.length > 0 || photoNote) {
          changes.push({ 
            field: 'photos', 
            old_value: '', 
            new_value: `${selectedFiles.length} neue Bilder. ${photoNote}`.trim() 
          });
        }
        break;
    }

    return JSON.stringify(changes, null, 2);
  };

  // Check if there are actual changes
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
        return selectedFiles.length > 0 || photoNote.trim() !== '';
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !user) return;

    if (!hasChanges()) {
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
      // Upload images if present (for photo requests)
      if (selectedFiles.length > 0 && activeTab === 'photos') {
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

      // Create the change request
      const description = buildDescription();
      const { data: request, error: requestError } = await supabase
        .from('profile_change_requests')
        .insert({
          profile_id: profile.id,
          user_id: user.id,
          request_type: activeTab,
          description: description,
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
        description: 'Deine Änderungsanfrage wurde eingereicht und wird in Kürze bearbeitet.',
      });

      // Reset form for photos tab
      if (activeTab === 'photos') {
        setSelectedFiles([]);
        filePreviews.forEach(url => URL.revokeObjectURL(url));
        setFilePreviews([]);
        setPhotoNote('');
      }
      
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
    };
    return labels[type] || type;
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
                        />
                        {newName !== profile?.display_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Aktuell: {profile?.display_name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="newAboutMe">Beschreibung</Label>
                        <Textarea
                          id="newAboutMe"
                          value={newAboutMe}
                          onChange={(e) => setNewAboutMe(e.target.value)}
                          placeholder="Über mich..."
                          rows={6}
                        />
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
                          <SelectTrigger>
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
                        {selectedCanton !== profile?.canton && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Aktuell: {profile?.canton}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Stadt</Label>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              className="w-full justify-between font-normal"
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
                        {selectedCity !== profile?.city && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Aktuell: {profile?.city}
                          </p>
                        )}
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
                            {genderCategories.map(cat => (
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
                                    "text-sm cursor-pointer",
                                    selectedGenderId && selectedGenderId !== cat.id && 'text-muted-foreground'
                                  )}
                                >
                                  {cat.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Services */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Service / Angebot</p>
                          <div className="grid grid-cols-2 gap-2">
                            {serviceCategories.map(cat => (
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
                                    "text-sm cursor-pointer",
                                    selectedServiceIds.length >= 2 && !selectedServiceIds.includes(cat.id) && 'text-muted-foreground'
                                  )}
                                >
                                  {cat.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
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
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactWhatsapp">WhatsApp</Label>
                          <Input
                            id="contactWhatsapp"
                            value={contactWhatsapp}
                            onChange={(e) => setContactWhatsapp(e.target.value)}
                            placeholder="+41..."
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
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactWebsite">Website</Label>
                          <Input
                            id="contactWebsite"
                            value={contactWebsite}
                            onChange={(e) => setContactWebsite(e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactTelegram">Telegram</Label>
                          <Input
                            id="contactTelegram"
                            value={contactTelegram}
                            onChange={(e) => setContactTelegram(e.target.value)}
                            placeholder="@username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactInstagram">Instagram</Label>
                          <Input
                            id="contactInstagram"
                            value={contactInstagram}
                            onChange={(e) => setContactInstagram(e.target.value)}
                            placeholder="@username"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* PHOTOS TAB */}
                    <TabsContent value="photos" className="space-y-4">
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
                            {selectedFiles.length} Bild{selectedFiles.length > 1 ? 'er' : ''} ausgewählt:
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

                      <div>
                        <Label htmlFor="photoNote">Beschreibung der Änderungen</Label>
                        <Textarea
                          id="photoNote"
                          value={photoNote}
                          onChange={(e) => setPhotoNote(e.target.value)}
                          placeholder="z.B. 'Bitte Bild 3 löschen und diese neuen Bilder hinzufügen'"
                          rows={3}
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
                            try {
                              const changes = JSON.parse(request.description);
                              if (Array.isArray(changes) && changes.length > 0) {
                                return changes.map((c: { field: string; new_value: string }) => 
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
