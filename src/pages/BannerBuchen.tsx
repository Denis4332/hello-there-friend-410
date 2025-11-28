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
import { Zap, Star, Grid3x3, Upload, Calendar, CreditCard } from 'lucide-react';
import { BannerPackage } from '@/types/advertisement';
import { useSiteSetting } from '@/hooks/useSiteSettings';

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
  payment_method: z.enum(['bank', 'twint', 'later'], { required_error: 'Bitte wählen Sie eine Zahlungsmethode' }),
  image: z.instanceof(File, { message: 'Bitte laden Sie ein Bild hoch' }),
});

type FormValues = z.infer<typeof formSchema>;

const positionIcons = {
  popup: Zap,
  top: Star,
  grid: Grid3x3,
};

export default function BannerBuchen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: seoTitle } = useSiteSetting('seo_banner_title');
  const { data: seoDescription } = useSiteSetting('seo_banner_description');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fehler',
          description: 'Bild darf maximal 5MB groß sein',
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Fehler',
          description: 'Bitte wählen Sie ein gültiges Bild',
          variant: 'destructive',
        });
        return;
      }

      setSelectedImage(file);
      form.setValue('image', file);
      
      // Create preview
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
      // Upload image to storage
      const fileExt = data.image.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `banner-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('advertisements')
        .upload(filePath, data.image);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('advertisements')
        .getPublicUrl(filePath);

      // Create advertisement entry
      const { error: insertError } = await supabase
        .from('advertisements')
        .insert({
          title: data.title,
          image_url: publicUrl,
          link_url: data.link_url,
          position: data.position,
          start_date: null,
          end_date: null,
          requested_duration: data.duration,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          price_per_day: BANNER_PACKAGES.find(p => p.position === data.position)?.price_per_day,
          payment_status: 'pending',
          payment_method: data.payment_method,
          active: false,
          priority: data.position === 'popup' ? 100 : data.position === 'top' ? 50 : 10,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Vielen Dank für Ihre Anfrage!',
        description: 'Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <h1 className="text-4xl font-bold mb-4">Banner buchen</h1>
              <p className="text-lg text-muted-foreground">
                Füllen Sie das Formular aus und buchen Sie Ihre Banneranzeige
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
                    <CardTitle>3.5. Ihre Kontaktdaten</CardTitle>
                    <CardDescription>Damit wir Sie bezüglich der Buchung kontaktieren können</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                            <Input type="tel" placeholder="+41 79 123 45 67" {...field} />
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
                    <CardTitle>4. Banner-Bild hochladen</CardTitle>
                    <CardDescription>
                      Empfohlene Größe: 1200x628px (max. 5MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-4">
                              <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                  {imagePreview ? (
                                    <img 
                                      src={imagePreview} 
                                      alt="Preview" 
                                      className="w-full h-full object-contain rounded-lg"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Klicken zum Hochladen</span> oder Drag & Drop
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        PNG, JPG oder WebP (max. 5MB)
                                      </p>
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    {...field}
                                  />
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>5. Zahlungsmethode</CardTitle>
                    <CardDescription>Wie möchten Sie bezahlen?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid gap-4"
                            >
                              <div>
                                <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                                <Label
                                  htmlFor="bank"
                                  className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5" />
                                    <div>
                                      <div className="font-semibold">Banküberweisung</div>
                                      <div className="text-sm text-muted-foreground">
                                        Sie erhalten die Bankdaten per E-Mail
                                      </div>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div>
                                <RadioGroupItem value="twint" id="twint" className="peer sr-only" />
                                <Label
                                  htmlFor="twint"
                                  className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5" />
                                    <div>
                                      <div className="font-semibold">TWINT</div>
                                      <div className="text-sm text-muted-foreground">
                                        Zahlung via TWINT
                                      </div>
                                    </div>
                                  </div>
                                </Label>
                              </div>

                              <div>
                                <RadioGroupItem value="later" id="later" className="peer sr-only" />
                                <Label
                                  htmlFor="later"
                                  className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-5 w-5" />
                                    <div>
                                      <div className="font-semibold">Später zahlen</div>
                                      <div className="text-sm text-muted-foreground">
                                        Wir kontaktieren Sie mit den Zahlungsdetails
                                      </div>
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Wird gesendet...' : 'Jetzt anfragen'}
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
