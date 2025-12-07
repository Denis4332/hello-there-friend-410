import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Star, Grid3x3, Upload, Calendar, CheckCircle } from 'lucide-react';
import { BannerPackage } from '@/types/advertisement';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

const BANNER_PACKAGES: BannerPackage[] = [
  {
    position: 'popup',
    name: 'Pop-up Banner',
    price_per_day: 80,
    price_per_week: 504,
    price_per_month: 2040,
    description: 'Maximale Aufmerksamkeit garantiert!',
    features: [],
    badge: 'EXKLUSIV',
  },
  {
    position: 'top',
    name: 'Top-Banner',
    price_per_day: 50,
    price_per_week: 315,
    price_per_month: 1275,
    description: 'Erste Position auf der Startseite.',
    features: [],
    badge: 'EXKLUSIV',
  },
  {
    position: 'grid',
    name: 'Grid-Banner',
    price_per_day: 30,
    price_per_week: 189,
    price_per_month: 765,
    description: 'Natürliche Integration in die Suchergebnisse.',
    features: [],
    badge: 'EXKLUSIV',
  },
];

const formSchema = z.object({
  position: z.enum(['popup', 'top', 'grid'], { required_error: 'Bitte wählen Sie eine Position' }),
  duration: z.enum(['day', 'week', 'month'], { required_error: 'Bitte wählen Sie eine Laufzeit' }),
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein').max(100),
  link_url: z.string().url('Bitte geben Sie eine gültige URL ein'),
  contact_email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  contact_phone: z.string().min(10, 'Bitte geben Sie eine gültige Telefonnummer ein'),
  contact_name: z.string().min(2, 'Bitte geben Sie Ihren Namen ein'),
  image: z.instanceof(File, { message: 'Bitte laden Sie ein Bild hoch' }),
});

type FormValues = z.infer<typeof formSchema>;

const positionIcons = {
  popup: Zap,
  top: Star,
  grid: Grid3x3,
};

const durationLabels: Record<string, string> = {
  day: '1 Tag',
  week: '1 Woche',
  month: '1 Monat',
};

export default function BannerBuchen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getSetting } = useSiteSettingsContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const seoTitle = getSetting('seo_banner_title');
  const seoDescription = getSetting('seo_banner_description');
  const [imagePreview, setImagePreview] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const selectedPosition = form.watch('position');
  const selectedDuration = form.watch('duration');

  const calculatePrice = () => {
    if (!selectedPosition || !selectedDuration) return 0;
    
    const pkg = BANNER_PACKAGES.find(p => p.position === selectedPosition);
    if (!pkg) return 0;

    switch (selectedDuration) {
      case 'day': return pkg.price_per_day;
      case 'week': return pkg.price_per_week;
      case 'month': return pkg.price_per_month;
      default: return 0;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fehler',
          description: 'Bild darf maximal 5MB groß sein',
          variant: 'destructive',
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Fehler',
          description: 'Bitte wählen Sie ein gültiges Bild',
          variant: 'destructive',
        });
        return;
      }

      form.setValue('image', file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      let imageUrl = '';
      
      // Try to upload to storage first (may fail if not authenticated)
      try {
        const fileExt = data.image.name.split('.').pop();
        const fileName = `banner-request-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `banner-requests/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('advertisements')
          .upload(filePath, data.image);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('advertisements')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      } catch (storageError) {
        console.log('Storage upload failed, using base64 fallback');
      }

      // If storage failed, convert to base64 and store in metadata
      let imageBase64 = '';
      if (!imageUrl) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(data.image);
        });
      }

      const pkg = BANNER_PACKAGES.find(p => p.position === data.position);
      const calculatedPrice = calculatePrice();

      // Create contact message entry (NOT advertisements)
      const messageText = `📢 BANNER-ANFRAGE

Position: ${pkg?.name || data.position}
Laufzeit: ${durationLabels[data.duration]}
Preis: CHF ${calculatedPrice}

Titel: ${data.title}
Link: ${data.link_url}

Kontakt:
Name: ${data.contact_name}
E-Mail: ${data.contact_email}
Telefon: ${data.contact_phone}`;

      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          name: data.contact_name,
          email: data.contact_email,
          message: messageText,
          type: 'banner',
          attachment_url: imageUrl || null,
          metadata: {
            position: data.position,
            position_name: pkg?.name,
            duration: data.duration,
            duration_label: durationLabels[data.duration],
            title: data.title,
            link_url: data.link_url,
            contact_phone: data.contact_phone,
            calculated_price: calculatedPrice,
            image_base64: imageBase64 || null, // Fallback wenn Storage nicht verfügbar
          },
          status: 'unread',
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
      toast({
        title: 'Anfrage gesendet!',
        description: 'Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
      });

      // Redirect after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);

    } catch (error: any) {
      console.error('Banner request error:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <>
        <SEO title="Anfrage gesendet" description="Ihre Banner-Anfrage wurde erfolgreich gesendet." />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-12">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Anfrage gesendet!</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Vielen Dank für Ihre Banner-Anfrage. Wir werden uns innerhalb von 24 Stunden bei Ihnen melden.
              </p>
              <p className="text-sm text-muted-foreground">
                Sie werden in wenigen Sekunden weitergeleitet...
              </p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={seoTitle || 'Banner buchen'}
        description={seoDescription || 'Buchen Sie Ihre Banneranzeige und erreichen Sie tausende potenzielle Kunden.'}
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Banner-Anfrage</h1>
              <p className="text-lg text-muted-foreground">
                Füllen Sie das Formular aus und wir kontaktieren Sie zur Buchung
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Banner Position Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>1. Banner-Position wählen</CardTitle>
                    <CardDescription>Wählen Sie die Position für Ihr Banner</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid md:grid-cols-3 gap-4"
                            >
                              {BANNER_PACKAGES.map((pkg) => {
                                const Icon = positionIcons[pkg.position];
                                return (
                                  <div key={pkg.position}>
                                    <RadioGroupItem
                                      value={pkg.position}
                                      id={pkg.position}
                                      className="peer sr-only"
                                    />
                                    <Label
                                      htmlFor={pkg.position}
                                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                    >
                                      <Icon className="h-8 w-8 mb-2" />
                                      <div className="text-center">
                                        <div className="font-semibold">{pkg.name}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {pkg.description}
                                        </div>
                                        <div className="text-lg font-bold text-primary mt-2">
                                          ab CHF {pkg.price_per_day}/Tag
                                        </div>
                                      </div>
                                    </Label>
                                  </div>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Duration Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>2. Laufzeit wählen</CardTitle>
                    <CardDescription>Wie lange soll Ihr Banner geschaltet werden?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Laufzeit wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="day">1 Tag</SelectItem>
                              <SelectItem value="week">1 Woche</SelectItem>
                              <SelectItem value="month">1 Monat</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedPosition && selectedDuration && (
                      <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            <span className="font-semibold">Gesamtpreis:</span>
                          </div>
                          <span className="text-2xl font-bold">CHF {calculatePrice()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Banner Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>3. Banner-Details</CardTitle>
                    <CardDescription>Titel und Link für Ihr Banner</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banner-Titel</FormLabel>
                          <FormControl>
                            <Input placeholder="z.B. Meine tolle Dienstleistung" {...field} />
                          </FormControl>
                          <FormDescription>
                            Dieser Titel wird für interne Zwecke verwendet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="link_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ziel-URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://ihre-website.ch" {...field} />
                          </FormControl>
                          <FormDescription>
                            Wohin sollen Benutzer weitergeleitet werden?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>4. Ihre Kontaktdaten</CardTitle>
                    <CardDescription>Damit wir Sie bezüglich der Buchung kontaktieren können</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ihr Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Max Mustermann" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail-Adresse</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ihre@email.ch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefonnummer</FormLabel>
                          <FormControl>
                            <Input placeholder="+41 79 123 45 67" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Image Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>5. Banner-Bild hochladen</CardTitle>
                    <CardDescription>
                      Format: 16:9 Querformat empfohlen (z.B. 1920x1080px). Max. 5MB.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="image"
                      render={() => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                  id="banner-image"
                                />
                                <label
                                  htmlFor="banner-image"
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                  <span className="text-sm text-muted-foreground">
                                    Klicken Sie hier, um ein Bild hochzuladen
                                  </span>
                                </label>
                              </div>

                              {imagePreview && (
                                <div className="relative">
                                  <img
                                    src={imagePreview}
                                    alt="Banner preview"
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Anfrage wird gesendet...' : 'Anfrage absenden'}
                </Button>
              </form>
            </Form>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}