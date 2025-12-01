import { useState, useRef } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAllAdvertisements, useCreateAdvertisement, useUpdateAdvertisement, useDeleteAdvertisement, useExtendAdvertisement } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';
import { Plus, Pencil, Trash2, Eye, MousePointerClick, Clock, ImageIcon, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageCropper } from '@/components/admin/ImageCropper';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAdvertisements() {
  const { data: ads, isLoading } = useAllAdvertisements();
  const createAd = useCreateAdvertisement();
  const updateAd = useUpdateAdvertisement();
  const deleteAd = useDeleteAdvertisement();
  const extendAd = useExtendAdvertisement();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'top' as Advertisement['position'],
    priority: 0,
    active: true,
    start_date: '',
    end_date: '',
    popup_delay_seconds: 5,
    popup_frequency: 'once_per_session' as Advertisement['popup_frequency'],
    price_per_day: 0,
    stripe_payment_id: null as string | null,
    payment_required: false,
  });
  
  // Gratis Promo Banner State
  const [isPromo, setIsPromo] = useState(false);
  const [promoDuration, setPromoDuration] = useState<'7' | '30' | '90' | 'unlimited'>('30');
  
  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const calculatePromoEndDate = (duration: string) => {
    if (duration === 'unlimited') return '';
    const days = parseInt(duration);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate.toISOString().split('T')[0];
  };

  // Handle file selection for cropping
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Fehler', description: 'Nur JPEG, PNG oder WebP erlaubt', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Fehler', description: 'Maximale Dateigröße: 5MB', variant: 'destructive' });
      return;
    }

    // Create object URL for cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setIsCropperOpen(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle cropped image upload
  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    setIsUploading(true);

    try {
      // Session-Check vor Upload (soft warning)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No session found, attempting upload anyway...');
      }

      // Generate unique filename
      const filename = `banner_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('advertisements')
        .upload(filename, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('advertisements')
        .getPublicUrl(filename);

      // Set the image URL in form
      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast({ title: 'Bild hochgeladen', description: 'Das Bild wurde erfolgreich zugeschnitten und hochgeladen' });
    } catch (error: any) {
      console.error('Upload error details:', error);
      const errorMessage = error?.message || error?.error || 'Unbekannter Fehler beim Upload';
      toast({ 
        title: 'Upload fehlgeschlagen', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
      // Clean up object URL
      if (cropperImage) {
        URL.revokeObjectURL(cropperImage);
        setCropperImage(null);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      position: 'top',
      priority: 0,
      active: true,
      start_date: '',
      end_date: '',
      popup_delay_seconds: 5,
      popup_frequency: 'once_per_session',
      price_per_day: 0,
      stripe_payment_id: null,
      payment_required: false,
    });
    setEditingAd(null);
    setIsPromo(false);
    setPromoDuration('30');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Build submission data
      const submitData = { ...formData };
      
      // If promo banner, set dates and payment_required = false
      if (isPromo) {
        const today = new Date().toISOString().split('T')[0];
        submitData.start_date = today;
        submitData.end_date = calculatePromoEndDate(promoDuration);
        submitData.payment_required = false;
        submitData.price_per_day = 0;
      }
      
      if (editingAd) {
        await updateAd.mutateAsync({ id: editingAd.id, ...submitData });
        toast({ title: 'Banner aktualisiert' });
      } else {
        await createAd.mutateAsync(submitData);
        toast({ 
          title: isPromo ? '🎁 Gratis Promo-Banner erstellt' : 'Banner erstellt',
          description: isPromo ? `Läuft ${promoDuration === 'unlimited' ? 'unbegrenzt' : promoDuration + ' Tage'}` : undefined
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Banner konnte nicht gespeichert werden', variant: 'destructive' });
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url,
      position: ad.position,
      priority: ad.priority,
      active: ad.active,
      start_date: ad.start_date || '',
      end_date: ad.end_date || '',
      popup_delay_seconds: ad.popup_delay_seconds,
      popup_frequency: ad.popup_frequency,
      price_per_day: ad.price_per_day || 0,
      stripe_payment_id: ad.stripe_payment_id,
      payment_required: ad.payment_required,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Banner wirklich löschen?')) return;
    
    try {
      await deleteAd.mutateAsync(id);
      toast({ title: 'Banner gelöscht' });
    } catch (error) {
      toast({ title: 'Fehler', description: 'Banner konnte nicht gelöscht werden', variant: 'destructive' });
    }
  };

  const handleExtend = async (id: string, days: number) => {
    try {
      await extendAd.mutateAsync({ id, days });
      toast({ title: 'Banner verlängert', description: `Banner um ${days} Tage verlängert` });
    } catch (error) {
      toast({ title: 'Fehler', description: 'Banner konnte nicht verlängert werden', variant: 'destructive' });
    }
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const positionLabels = {
    popup: 'Pop-up (CHF 80/Tag)',
    top: 'Top-Banner (CHF 50/Tag)',
    grid: 'Grid-Banner (CHF 30/Tag)',
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Banner-Verwaltung</h1>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neues Banner
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAd ? 'Banner bearbeiten' : 'Neues Banner erstellen'}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Banner-Bild</Label>
                  
                  {/* Upload Section */}
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Klicken zum Hochladen</p>
                        <p className="text-xs text-muted-foreground">
                          JPEG, PNG, WebP • Max 5MB • Wird automatisch auf 16:9 Querformat zugeschnitten
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">oder URL eingeben</span>
                    </div>
                  </div>

                  {/* URL Input */}
                  <Input
                    id="image_url"
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                  />

                  {/* Preview */}
                  {formData.image_url && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Vorschau:</p>
                      <img 
                        src={formData.image_url} 
                        alt="Vorschau"
                        className="max-w-full max-h-[200px] rounded border object-contain mx-auto"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_url">Link-URL</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: Advertisement['position']) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popup">Pop-up (CHF 80/Tag)</SelectItem>
                      <SelectItem value="top">Top-Banner (CHF 50/Tag)</SelectItem>
                      <SelectItem value="grid">Grid-Banner (CHF 30/Tag)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.position === 'popup' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="popup_delay">Verzögerung (Sekunden)</Label>
                      <Input
                        id="popup_delay"
                        type="number"
                        min="0"
                        value={formData.popup_delay_seconds}
                        onChange={(e) => setFormData({ ...formData, popup_delay_seconds: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="popup_frequency">Häufigkeit</Label>
                      <Select
                        value={formData.popup_frequency}
                        onValueChange={(value: Advertisement['popup_frequency']) => setFormData({ ...formData, popup_frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once_per_session">Einmal pro Session</SelectItem>
                          <SelectItem value="once_per_day">Einmal pro Tag</SelectItem>
                          <SelectItem value="always">Immer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Gratis Promo Banner Section */}
                <div className="border border-dashed border-primary/50 rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch
                      id="isPromo"
                      checked={isPromo}
                      onCheckedChange={setIsPromo}
                    />
                    <Label htmlFor="isPromo" className="font-semibold text-primary">
                      🎁 Gratis Promo-Banner (Admin)
                    </Label>
                  </div>
                  
                  {isPromo && (
                    <div className="space-y-2">
                      <Label>Laufzeit wählen</Label>
                      <Select
                        value={promoDuration}
                        onValueChange={(value: '7' | '30' | '90' | 'unlimited') => setPromoDuration(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 Tage</SelectItem>
                          <SelectItem value="30">30 Tage</SelectItem>
                          <SelectItem value="90">90 Tage</SelectItem>
                          <SelectItem value="unlimited">Unbegrenzt</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Startet sofort, endet {promoDuration === 'unlimited' ? 'nie' : `nach ${promoDuration} Tagen`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Manual date selection (hidden when promo is active) */}
                {!isPromo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Startdatum</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">Enddatum</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Aktiv</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    {editingAd ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alle Banner</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Lädt...</p>
            ) : !ads || ads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Noch keine Banner vorhanden</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Bild</TableHead>
                    <TableHead>Titel</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead className="text-right">
                      <Eye className="h-4 w-4 inline mr-1" />
                      Impressions
                    </TableHead>
                    <TableHead className="text-right">
                      <MousePointerClick className="h-4 w-4 inline mr-1" />
                      Clicks
                    </TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="w-16 h-12 rounded overflow-hidden bg-muted">
                          {ad.image_url ? (
                            <img 
                              src={ad.image_url} 
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{positionLabels[ad.position]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant={ad.active ? 'default' : 'secondary'}>
                            {ad.active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                          {!ad.payment_required && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                              🎁 GRATIS
                            </Badge>
                          )}
                          {isExpired(ad.end_date) && (
                            <Badge variant="destructive">ABGELAUFEN</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ad.start_date || 'Sofort'} - {ad.end_date || 'Unbegrenzt'}
                      </TableCell>
                      <TableCell className="text-right">{ad.impressions}</TableCell>
                      <TableCell className="text-right">{ad.clicks}</TableCell>
                      <TableCell className="text-right">
                        {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0'}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isExpired(ad.end_date) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleExtend(ad.id, 30)}
                              title="Banner um 30 Tage verlängern"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              +30 Tage
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(ad)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(ad.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Image Cropper Dialog */}
      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          open={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            if (cropperImage) {
              URL.revokeObjectURL(cropperImage);
              setCropperImage(null);
            }
          }}
          onCropComplete={handleCropComplete}
          position={formData.position}
        />
      )}
    </div>
  );
}
