import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Loader2, Save, Settings, Upload, X } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { data: contentSettings, isLoading: contentLoading } = useSiteSettings('content');
  const { data: seoSettings, isLoading: seoLoading } = useSiteSettings('seo');
  const { data: navigationSettings, isLoading: navigationLoading } = useSiteSettings('navigation');
  const { data: searchSettings, isLoading: searchLoading } = useSiteSettings('search');
  const { data: profileSettings, isLoading: profileLoading } = useSiteSettings('profile');
  const { data: listingsSettings, isLoading: listingsLoading } = useSiteSettings('listings');
  const { data: designSettings, isLoading: designLoading } = useSiteSettings('design');
  const { data: authSettings, isLoading: authLoading } = useSiteSettings('auth');
  const { data: dashboardSettings, isLoading: dashboardLoading } = useSiteSettings('dashboard');
  const { data: contactSettings, isLoading: contactLoading } = useSiteSettings('contact');
  const { data: configSettings, isLoading: configLoading } = useSiteSettings('config');
  const { data: advancedSettings, isLoading: advancedLoading } = useSiteSettings('advanced');
  const { data: trackingSettings, isLoading: trackingLoading } = useSiteSettings('tracking');
  const { data: schemaSettings, isLoading: schemaLoading } = useSiteSettings('schema');
  const { data: indexingSettings, isLoading: indexingLoading } = useSiteSettings('indexing');
  const { data: socialSettings, isLoading: socialLoading } = useSiteSettings('social');
  const { data: advancedSeoSettings, isLoading: advancedSeoLoading } = useSiteSettings('advanced_seo');
  const { data: legalSettings, isLoading: legalLoading } = useSiteSettings('legal');
  const { data: messagesSettings, isLoading: messagesLoading } = useSiteSettings('messages');
  const updateMutation = useUpdateSiteSetting();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleSave = (id: string, key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      updateMutation.mutate({ id, value });
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (setting: any, file: File) => {
    setUploadingImages(prev => ({ ...prev, [setting.key]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${setting.key}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      handleChange(setting.key, urlData.publicUrl);
      await handleSave(setting.id, setting.key);

      toast({
        title: 'Bild hochgeladen',
        description: 'Das Bild wurde erfolgreich gespeichert',
      });
    } catch (error: any) {
      toast({
        title: 'Upload-Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(prev => ({ ...prev, [setting.key]: false }));
    }
  };

  const handleImageDelete = async (setting: any) => {
    handleChange(setting.key, '');
    await handleSave(setting.id, setting.key);
    toast({
      title: 'Bild entfernt',
      description: 'Das Bild wurde aus den Einstellungen entfernt',
    });
  };

  const renderSettingField = (setting: any) => {
    const currentValue = editedValues[setting.key] ?? setting.value;
    const hasChanged = editedValues[setting.key] !== undefined && editedValues[setting.key] !== setting.value;
    const isUploading = uploadingImages[setting.key];

    // Boolean field (checkbox)
    if (setting.type === 'boolean') {
      return (
        <div key={setting.id} className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor={setting.key} className="text-sm font-medium">
                {setting.label}
              </Label>
              {setting.description && (
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={setting.key}
                checked={currentValue === 'true'}
                onChange={(e) => handleChange(setting.key, e.target.checked ? 'true' : 'false')}
                className="h-4 w-4 rounded border-gray-300"
              />
              {hasChanged && (
                <Button
                  size="sm"
                  onClick={() => handleSave(setting.id, setting.key)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Speichern
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Image upload field
    if (setting.type === 'image') {
      return (
        <div key={setting.id} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
          </div>

          {currentValue && (
            <div className="relative inline-block">
              <img
                src={currentValue}
                alt={setting.label}
                className="max-w-xs max-h-32 rounded-md border object-contain"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2"
                onClick={() => handleImageDelete(setting)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(setting, file);
              }}
              disabled={isUploading}
              className="hidden"
              id={`file-${setting.key}`}
            />
            <label htmlFor={`file-${setting.key}`}>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById(`file-${setting.key}`)?.click()}
                asChild
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {currentValue ? 'Bild ersetzen' : 'Bild hochladen'}
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>

          {!currentValue && (
            <Input
              id={setting.key}
              type="text"
              value={currentValue}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              placeholder="Oder URL direkt eingeben..."
            />
          )}

          {hasChanged && !currentValue && (
            <Button
              size="sm"
              onClick={() => handleSave(setting.id, setting.key)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Speichern
                </>
              )}
            </Button>
          )}
        </div>
      );
    }

    // Regular text/textarea/color fields
    return (
      <div key={setting.id} className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Label htmlFor={setting.key} className="text-sm font-medium">
              {setting.label}
            </Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
          </div>
          {hasChanged && (
            <Button
              size="sm"
              onClick={() => handleSave(setting.id, setting.key)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Speichern
                </>
              )}
            </Button>
          )}
        </div>
        
        {setting.type === 'textarea' ? (
          <Textarea
            id={setting.key}
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            rows={3}
            className="resize-none"
          />
        ) : (
          <Input
            id={setting.key}
            type={setting.type === 'color' ? 'color' : 'text'}
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <SEO
        title="Website-Einstellungen"
        description="Verwalte Inhalte, Design und SEO-Einstellungen"
      />
      
      <div className="min-h-screen bg-background">
        <AdminHeader />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Website-Einstellungen</h1>
            </div>
            <p className="text-muted-foreground">
              Verwalte Inhalte, Texte und SEO-Einstellungen deiner Website ohne Code
            </p>
          </div>

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto justify-start">
              <TabsTrigger value="content">Startseite</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="search">Suche</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="listings">Listen</TabsTrigger>
              <TabsTrigger value="auth">Auth</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="contact">Kontakt</TabsTrigger>
              <TabsTrigger value="config">Konfiguration</TabsTrigger>
              <TabsTrigger value="advanced">Erweitert</TabsTrigger>
              <TabsTrigger value="seo">SEO Basis</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="schema">Schema.org</TabsTrigger>
              <TabsTrigger value="indexing">Indexierung</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="advanced_seo">SEO Erweitert</TabsTrigger>
              <TabsTrigger value="legal">Rechtliches</TabsTrigger>
              <TabsTrigger value="messages">Meldungen</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Startseiten-Inhalte</CardTitle>
                  <CardDescription>
                    Passe die Texte auf der Startseite an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {contentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    contentSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Design-Einstellungen</CardTitle>
                  <CardDescription>
                    Logo, Farben und Hero-Image anpassen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-md">
                    <p className="text-sm font-medium text-accent-foreground">
                      ⚠️ Achtung: Änderungen an den Farben werden sofort auf der gesamten Website sichtbar!
                    </p>
                  </div>
                  {designLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    designSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="navigation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Navigation & Footer</CardTitle>
                  <CardDescription>
                    Passe Header und Footer-Texte an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {navigationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    navigationSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Suchseite</CardTitle>
                  <CardDescription>
                    Passe alle Texte der Suchseite an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    searchSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profil-Seiten</CardTitle>
                  <CardDescription>
                    Passe alle Texte der Profil-Ansicht an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profileLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    profileSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Listen (Kategorien & Städte)</CardTitle>
                  <CardDescription>
                    Passe Texte für Kategorien und Städte-Übersichten an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {listingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    listingsSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auth" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authentifizierung</CardTitle>
                  <CardDescription>
                    Passe Login- und Registrierungs-Texte an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {authLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    authSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard</CardTitle>
                  <CardDescription>
                    Passe Texte im User-Dashboard an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    dashboardSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktseite</CardTitle>
                  <CardDescription>
                    Passe Texte der Kontaktseite an
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {contactLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    contactSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Konfiguration</CardTitle>
                  <CardDescription>
                    Upload-Limits und technische Einstellungen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {configLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    configSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Erweiterte Einstellungen</CardTitle>
                  <CardDescription className="text-destructive">
                    ⚠️ Achtung: Diese Einstellungen können die Website-Funktion beeinträchtigen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {advancedLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    advancedSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Basis-Einstellungen</CardTitle>
                  <CardDescription>
                    Grundlegende SEO-Einstellungen für Meta Tags
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {seoLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    seoSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tracking & Analytics</CardTitle>
                  <CardDescription>
                    Google Analytics, Tag Manager, Facebook Pixel und Verifikations-Codes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {trackingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    trackingSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schema" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Schema.org Structured Data</CardTitle>
                  <CardDescription>
                    Konfiguriere strukturierte Daten für bessere Suchergebnisse
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {schemaLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    schemaSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="indexing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indexierung & Sitemap</CardTitle>
                  <CardDescription>
                    Sitemap-Konfiguration und NoIndex-Seiten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {indexingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    indexingSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Erweitert</CardTitle>
                  <CardDescription>
                    Open Graph, Twitter Cards und Social Media IDs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {socialLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    socialSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced_seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Erweiterte SEO Features</CardTitle>
                  <CardDescription>
                    Breadcrumbs, Hreflang, Rich Snippets und FAQ Schema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {advancedSeoLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    advancedSeoSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rechtliche Texte</CardTitle>
                  <CardDescription>
                    Datenschutz, AGB und rechtliche Hinweise bearbeiten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {legalLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    legalSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Toast-Meldungen</CardTitle>
                  <CardDescription>
                    Erfolgs- und Fehlermeldungen der Plattform anpassen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    messagesSettings?.map(renderSettingField)
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
