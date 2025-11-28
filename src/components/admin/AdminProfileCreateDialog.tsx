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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { useCantons } from '@/hooks/useCantons';
import { Plus } from 'lucide-react';

interface AdminProfileCreateDialogProps {
  onSuccess?: () => void;
}

export const AdminProfileCreateDialog = ({ onSuccess }: AdminProfileCreateDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [canton, setCanton] = useState('');
  const [postalCode, setPostalCode] = useState('');
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
  
  // Data hooks
  const { data: categories } = useCategories();
  const { data: languages } = useDropdownOptions('languages');
  const { data: cantons } = useCantons();

  const resetForm = () => {
    setDisplayName('');
    setCity('');
    setCanton('');
    setPostalCode('');
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
  };

  const createProfileMutation = useMutation({
    mutationFn: async () => {
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

      // 3. Create profile (without user_id for admin-created profiles)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: null, // Admin-created profile without user account
          display_name: displayName,
          city,
          canton,
          postal_code: postalCode || null,
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

      return profile;
    },
    onSuccess: (profile) => {
      toast({
        title: '✅ Profil erstellt!',
        description: `Profil "${profile.display_name}" wurde erfolgreich erstellt. GPS-Koordinaten werden automatisch gesetzt.`,
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

  const isValid = displayName.trim() && city.trim() && canton.trim();

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
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Stadt *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="z.B. Zürich"
                />
              </div>
              <div>
                <Label>Kanton *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={canton}
                  onChange={(e) => setCanton(e.target.value)}
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
                <Label>PLZ</Label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="z.B. 8001"
                />
              </div>
            </div>
            
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
          
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm">
            <p className="font-medium mb-1">ℹ️ Hinweis</p>
            <ul className="text-muted-foreground text-xs space-y-1">
              <li>• Das Profil wird ohne User-Account erstellt (für Agenturen/Promos)</li>
              <li>• GPS-Koordinaten werden automatisch von der Stadt übernommen</li>
              <li>• Fotos können nach Erstellung im Profil-Dialog hochgeladen werden</li>
              <li>• Das Profil ist sofort aktiv und sichtbar</li>
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
