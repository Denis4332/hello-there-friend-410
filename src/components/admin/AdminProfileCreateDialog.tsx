import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { useCantons } from '@/hooks/useCantons';
import { useCitiesByCantonSlim } from '@/hooks/useCitiesByCantonSlim';
import { recordAgbAcceptance } from '@/hooks/useAgbAcceptances';
import { Plus, ChevronsUpDown, Check, MapPin, Upload, X, Star, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage } from '@/utils/imageCompression';

interface AdminProfileCreateDialogProps {
  onSuccess?: () => void;
}

interface PhotoPreview {
  url: string;
  file: File;
}

export const AdminProfileCreateDialog = ({ onSuccess }: AdminProfileCreateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [cityId, setCityId] = useState('');
  const [city, setCity] = useState('');
  const [canton, setCanton] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [aboutMe, setAboutMe] = useState('');
  const [gender, setGender] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [listingType, setListingType] = useState('basic');
  const [duration, setDuration] = useState('30');
  
  // Contact fields
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');

  // Photo upload state
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0);

  // AGB acceptance state
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Data hooks
  const { data: categories } = useCategories();
  const { data: languages } = useDropdownOptions('languages');
  const { data: cantons } = useCantons();
  const { data: cities, isLoading: citiesLoading } = useCitiesByCantonSlim(canton);

  const resetForm = () => {
    setDisplayName('');
    setCityId('');
    setCity('');
    setCanton('');
    setPostalCode('');
    setLat(null);
    setLng(null);
    setAboutMe('');
    setGender('');
    setSelectedCategories([]);
    setSelectedLanguages([]);
    setListingType('basic');
    setDuration('30');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setWebsite('');
    setTelegram('');
    setInstagram('');
    setPhotoPreviews([]);
    setPrimaryPhotoIndex(0);
    setAgbAccepted(false);
    setCustomerEmail('');
  };

  // Handle canton change - reset city when canton changes
  const handleCantonChange = (newCanton: string) => {
    setCanton(newCanton);
    setCityId('');
    setCity('');
    setPostalCode('');
    setLat(null);
    setLng(null);
  };

  // Handle city selection - set all location fields
  const handleCitySelect = (selectedCity: typeof cities extends (infer T)[] ? T : never) => {
    if (!selectedCity) return;
    
    setCityId(selectedCity.id);
    setCity(selectedCity.name);
    setPostalCode(selectedCity.postal_code || '');
    setLat(selectedCity.lat);
    setLng(selectedCity.lng);
    setCityPopoverOpen(false);
  };

  // Photo handling with compression
  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxPhotos = 5;
    if (photoPreviews.length + files.length > maxPhotos) {
      toast({
        title: 'Zu viele Fotos',
        description: `Maximal ${maxPhotos} Fotos erlaubt`,
        variant: 'destructive',
      });
      return;
    }

    const newPreviews: PhotoPreview[] = [];
    for (const file of Array.from(files)) {
      // Basic validation
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Datei zu groß',
          description: `${file.name} ist zu groß (max. 10MB)`,
          variant: 'destructive',
        });
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Ungültiges Format',
          description: `${file.name} ist kein erlaubtes Bildformat`,
          variant: 'destructive',
        });
        continue;
      }
      
      try {
        // Compress image before adding to previews
        const compressedFile = await compressImage(file);
        newPreviews.push({
          url: URL.createObjectURL(compressedFile),
          file: compressedFile,
        });
      } catch (error) {
        console.error('Compression error:', error);
        // Fallback to original file if compression fails
        newPreviews.push({
          url: URL.createObjectURL(file),
          file,
        });
      }
    }

    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setPhotoPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      if (primaryPhotoIndex >= newPreviews.length) {
        setPrimaryPhotoIndex(Math.max(0, newPreviews.length - 1));
      } else if (index < primaryPhotoIndex) {
        setPrimaryPhotoIndex(primaryPhotoIndex - 1);
      }
      return newPreviews;
    });
  };

  const createProfileMutation = useMutation({
    mutationFn: async () => {
      // Validate GPS coordinates
      if (!lat || !lng) {
        throw new Error('Bitte wählen Sie eine Stadt aus der Liste für garantierte GPS-Koordinaten.');
      }

      // 1. Generate slug from display name
      const slug = displayName
        .toLowerCase()
        .replace(/[äöü]/g, (c) => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[c] || c))
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);

      // 2. Calculate expiry dates
      const durationDays = duration === 'unlimited' ? null : parseInt(duration);
      let premiumUntil = null;
      let topAdUntil = null;
      
      if (durationDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);
        
        if (listingType === 'premium') {
          premiumUntil = expiryDate.toISOString();
        } else if (listingType === 'top') {
          topAdUntil = expiryDate.toISOString();
        }
      }

      // 3. Create profile with GPS coordinates directly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: null, // Admin-created profile without user account
          display_name: displayName,
          city,
          canton,
          postal_code: postalCode || null,
          lat, // GPS directly from city selection
          lng, // GPS directly from city selection
          about_me: aboutMe || null,
          gender: gender || null,
          languages: selectedLanguages,
          slug,
          status: 'active', // Immediately active
          payment_status: 'free', // Admin-created = free
          listing_type: listingType,
          premium_until: premiumUntil,
          top_ad_until: topAdUntil,
          is_adult: true,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 4. Add categories
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(catId => ({
          profile_id: profile.id,
          category_id: catId,
        }));
        
        const { error: catError } = await supabase
          .from('profile_categories')
          .insert(categoryInserts);
        
        if (catError) throw catError;
      }

      // 5. Add contact data
      const hasContactData = phone || whatsapp || email || website || telegram || instagram;
      if (hasContactData) {
        const { error: contactError } = await supabase
          .from('profile_contacts')
          .insert({
            profile_id: profile.id,
            phone: phone || null,
            whatsapp: whatsapp || null,
            email: email || null,
            website: website || null,
            telegram: telegram || null,
            instagram: instagram || null,
          });
        
        if (contactError) throw contactError;
      }

      // 6. Record AGB acceptance
      await recordAgbAcceptance({
        email: customerEmail,
        profileId: profile.id,
        acceptanceType: 'admin_created',
        createdByAdmin: true,
        agbVersion: '1.0',
      });

      // 7. Upload photos
      if (photoPreviews.length > 0) {
        for (let i = 0; i < photoPreviews.length; i++) {
          const preview = photoPreviews[i];
          const file = preview.file;

          // Generate random filename
          const fileExt = file.name.split('.').pop();
          const randomBytes = new Uint8Array(16);
          crypto.getRandomValues(randomBytes);
          const randomName = Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          const fileName = `${randomName}.${fileExt}`;

          // Upload via edge function
          const formData = new FormData();
          formData.append('file', file);
          formData.append('profileId', profile.id);
          formData.append('fileName', fileName);

          const { data, error } = await supabase.functions.invoke('validate-image', {
            body: formData,
          });

          if (error) {
            console.error('Photo upload error:', error);
            continue; // Continue with other photos even if one fails
          }

          if (!data?.success) {
            console.error('Photo validation failed:', data?.error);
            continue;
          }

          // Insert photo record - use primaryPhotoIndex for is_primary
          const { error: photoDbError } = await supabase.from('photos').insert({
            profile_id: profile.id,
            storage_path: data.path,
            is_primary: i === primaryPhotoIndex,
          });

          if (photoDbError) {
            console.error('Photo DB insert error:', photoDbError);
          }
        }
      }

      return profile;
    },
    onSuccess: (profile) => {
      toast({
        title: '✅ Profil erstellt!',
        description: `Profil "${profile.display_name}" wurde mit GPS-Koordinaten und ${photoPreviews.length} Foto(s) erstellt.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      resetForm();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      }
      if (prev.length >= 2) {
        toast({
          title: 'Maximum 2 Kategorien',
          description: 'Profile können maximal 2 Kategorien haben.',
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, catId];
    });
  };

  const toggleLanguage = (langValue: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langValue) 
        ? prev.filter(l => l !== langValue) 
        : [...prev, langValue]
    );
  };

  // Validation: require city selection with GPS AND AGB acceptance with customer email
  const isValid = displayName.trim() && city.trim() && canton.trim() && lat !== null && lng !== null && agbAccepted && customerEmail.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Profil erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Profil erstellen (Admin)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basis-Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Basis-Informationen</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Name *</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="z.B. Sophia"
                />
              </div>
              <div>
                <Label>Geschlecht</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">-- Wählen --</option>
                  <option value="female">Weiblich</option>
                  <option value="male">Männlich</option>
                  <option value="trans">Trans</option>
                  <option value="other">Andere</option>
                </select>
              </div>
            </div>
            
            {/* Location Section with Combobox */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Kanton *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={canton}
                  onChange={(e) => handleCantonChange(e.target.value)}
                >
                  <option value="">-- Wählen --</option>
                  {cantons?.map((c) => (
                    <option key={c.id} value={c.abbreviation}>
                      {c.name} ({c.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Stadt *</Label>
                <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cityPopoverOpen}
                      className="w-full justify-between h-10 font-normal"
                      disabled={!canton}
                    >
                      {city || (canton ? "Stadt wählen..." : "Erst Kanton wählen")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Stadt suchen..." />
                      <CommandList>
                        <CommandEmpty>
                          {citiesLoading ? 'Laden...' : 'Keine Stadt gefunden.'}
                        </CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {cities?.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.postal_code || ''}`}
                              onSelect={() => handleCitySelect(c)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  cityId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span>{c.name}</span>
                              {c.postal_code && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {c.postal_code}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>PLZ</Label>
                <Input
                  value={postalCode}
                  readOnly
                  placeholder="Auto"
                  className="bg-muted"
                />
              </div>
            </div>

            {/* GPS Indicator */}
            {lat && lng && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-md">
                <MapPin className="h-3 w-3" />
                GPS: {lat.toFixed(4)}, {lng.toFixed(4)} ✓
              </div>
            )}
            
            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Kurze Beschreibung..."
                rows={3}
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">📷 Fotos</h3>
            
            {/* Upload area */}
            <label
              htmlFor="admin-photo-upload"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Fotos auswählen (max. 5)
                </p>
              </div>
              <input
                id="admin-photo-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoSelect}
                disabled={photoPreviews.length >= 5}
              />
            </label>

            {/* Photo previews with star selection */}
            {photoPreviews.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      
                      {/* Star icon for primary selection */}
                      <button
                        type="button"
                        onClick={() => setPrimaryPhotoIndex(index)}
                        className={cn(
                          "absolute top-1 left-1 p-1 rounded-full transition-all",
                          index === primaryPhotoIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-black/50 text-white/70 hover:text-yellow-400"
                        )}
                        title={index === primaryPhotoIndex ? "Hauptfoto" : "Als Hauptfoto setzen"}
                      >
                        <Star 
                          className={cn(
                            "w-3 h-3",
                            index === primaryPhotoIndex && "fill-current"
                          )} 
                        />
                      </button>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Primary badge */}
                      {index === primaryPhotoIndex && (
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded">
                          Hauptfoto
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  ⭐ Klicke auf den Stern, um das Hauptfoto zu wählen
                </p>
              </div>
            )}

            {photoPreviews.length === 0 && (
              <div className="flex items-center justify-center h-16 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Keine Fotos ausgewählt</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Kategorien */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b pb-2">Kategorien (max. 2)</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${cat.id}`}
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer">
                    {cat.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sprachen */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm border-b pb-2">Sprachen</h3>
            <div className="grid grid-cols-3 gap-2">
              {languages?.map((lang) => (
                <div key={lang.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${lang.value}`}
                    checked={selectedLanguages.includes(lang.value)}
                    onCheckedChange={() => toggleLanguage(lang.value)}
                  />
                  <label htmlFor={`lang-${lang.value}`} className="text-sm cursor-pointer">
                    {lang.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Kontaktdaten */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Kontaktdaten</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+41 79 123 45 67"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+41 79 123 45 67"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontakt@example.com"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Telegram</Label>
                <Input
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@username"
                />
              </div>
            </div>
          </div>
          
          {/* Inserat-Paket */}
          <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm">💎 Inserat-Paket</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Inserat-Typ</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                >
                  <option value="basic">Basic</option>
                  <option value="premium">⭐ Premium</option>
                  <option value="top">🔥 TOP AD</option>
                </select>
              </div>
              <div>
                <Label>Laufzeit</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="7">7 Tage</option>
                  <option value="30">30 Tage</option>
                  <option value="90">90 Tage</option>
                  <option value="unlimited">Unbegrenzt</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Admin-erstellte Profile werden als "Gratis" markiert und sofort aktiviert.
            </p>
          </div>

          {/* AGB Bestätigung - WICHTIG für rechtliche Absicherung */}
          <div className="space-y-4 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              📜 AGB-Akzeptanz (Pflicht)
            </h3>
            
            <div>
              <Label>Kunden-E-Mail *</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="kunde@example.com"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                E-Mail des Kunden für rechtlichen Nachweis
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="admin-agb-acceptance"
                checked={agbAccepted}
                onCheckedChange={(checked) => setAgbAccepted(checked === true)}
                className="mt-0.5"
              />
              <div className="grid gap-1 leading-none">
                <label
                  htmlFor="admin-agb-acceptance"
                  className="text-sm font-medium leading-snug cursor-pointer"
                >
                  Kunde hat AGB akzeptiert *
                </label>
                <p className="text-xs text-muted-foreground">
                  Der Kunde hat die AGB telefonisch, per E-Mail oder persönlich bestätigt.
                  Dies wird als rechtlicher Nachweis mit Zeitstempel gespeichert.
                </p>
              </div>
            </div>
          </div>
          
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm">
            <p className="font-medium mb-1">ℹ️ Hinweis</p>
            <ul className="text-muted-foreground text-xs space-y-1">
              <li>• Das Profil wird ohne User-Account erstellt (für Agenturen/Promos)</li>
              <li>• <strong>GPS-Koordinaten werden direkt von der Stadt-Auswahl übernommen</strong></li>
              <li>• <strong>Fotos werden direkt hochgeladen - ⭐ Stern = Hauptfoto</strong></li>
              <li>• Das Profil ist sofort aktiv und sichtbar</li>
              <li>• <strong>AGB-Akzeptanz wird mit Kunden-E-Mail und Zeitstempel protokolliert</strong></li>
            </ul>
          </div>
          
          {/* Submit */}
          <Button
            className="w-full"
            onClick={() => createProfileMutation.mutate()}
            disabled={!isValid || createProfileMutation.isPending}
          >
            {createProfileMutation.isPending ? 'Erstelle Profil...' : '✅ Profil erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
