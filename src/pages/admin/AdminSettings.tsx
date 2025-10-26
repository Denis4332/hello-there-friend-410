import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Loader2, Save, Settings } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function AdminSettings() {
  const { data: contentSettings, isLoading: contentLoading } = useSiteSettings('content');
  const { data: seoSettings, isLoading: seoLoading } = useSiteSettings('seo');
  const { data: navigationSettings, isLoading: navigationLoading } = useSiteSettings('navigation');
  const { data: searchSettings, isLoading: searchLoading } = useSiteSettings('search');
  const { data: profileSettings, isLoading: profileLoading } = useSiteSettings('profile');
  const { data: listingsSettings, isLoading: listingsLoading } = useSiteSettings('listings');
  const { data: designSettings, isLoading: designLoading } = useSiteSettings('design');
  const updateMutation = useUpdateSiteSetting();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const handleSave = (id: string, key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      updateMutation.mutate({ id, value });
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const renderSettingField = (setting: any) => {
    const currentValue = editedValues[setting.key] ?? setting.value;
    const hasChanged = editedValues[setting.key] !== undefined && editedValues[setting.key] !== setting.value;

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
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              <TabsTrigger value="content">Startseite</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="search">Suche</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="listings">Listen</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
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

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO-Einstellungen</CardTitle>
                  <CardDescription>
                    Optimiere deine Website für Suchmaschinen
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
          </Tabs>
        </main>
      </div>
    </>
  );
}
