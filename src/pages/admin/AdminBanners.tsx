import { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useAllAdvertisements, useCreateAdvertisement, useUpdateAdvertisement, useDeleteAdvertisement, useExtendAdvertisement, useBannerSlotCounts } from '@/hooks/useAdvertisements';
import { Advertisement, BannerPosition, BANNER_CONFIG } from '@/types/advertisement';
import { Plus, Pencil, Trash2, Eye, MousePointerClick, Clock, Upload, Loader2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const POSITION_OPTIONS: BannerPosition[] = ['header_banner', 'in_content', 'in_grid', 'footer_banner', 'popup'];

export default function AdminBanners() {
  const { data: ads, isLoading } = useAllAdvertisements();
  const slotCounts = useBannerSlotCounts();
  const createAd = useCreateAdvertisement();
  const updateAd = useUpdateAdvertisement();
  const deleteAd = useDeleteAdvertisement();
  const extendAd = useExtendAdvertisement();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'header_banner' as BannerPosition,
    priority: 50,
    active: true,
    start_date: '',
    end_date: '',
    popup_delay_seconds: 5,
    popup_frequency: 'once_per_session' as Advertisement['popup_frequency'],
    price_per_day: 0,
    stripe_payment_id: null as string | null,
    payment_required: false,
  });
  
  // Promo banner state
  const [isPromo, setIsPromo] = useState(false);
  const [promoDuration, setPromoDuration] = useState<'7' | '30' | '90' | 'unlimited'>('30');
  
  // Image upload and cropper state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const getAspectRatio = () => {
    const config = BANNER_CONFIG[formData.position];
    return config.desktop.width / config.desktop.height;
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const calculatePromoEndDate = (duration: string) => {
    if (duration === 'unlimited') return '';
    const days = parseInt(duration);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return endDate.toISOString().split('T')[0];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Fehler', description: 'Nur JPEG, PNG oder WebP erlaubt', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Fehler', description: 'Maximale Dateigrösse: 5MB', variant: 'destructive' });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setIsCropperOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createCroppedImage = async (): Promise<Blob> => {
    if (!cropperImage || !croppedAreaPixels) {
      throw new Error('No image or crop area');
    }

    const image = new Image();
    image.src = cropperImage;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('No canvas context');

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/jpeg',
        0.9
      );
    });
  };

  const handleCropSave = async () => {
    setIsUploading(true);

    try {
      const croppedBlob = await createCroppedImage();
      const filename = `banner_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('advertisements')
        .upload(filename, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('advertisements')
        .getPublicUrl(filename);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      setIsCropperOpen(false);
      toast({ title: 'Bild hochgeladen' });
    } catch (error: any) {
      toast({ 
        title: 'Upload fehlgeschlagen', 
        description: error?.message || 'Unbekannter Fehler', 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
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
      position: 'header_banner',
      priority: 50,
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
    
    // Check slot availability for new banners
    if (!editingAd) {
      const slot = slotCounts[formData.position];
      if (slot.used >= slot.max) {
        toast({ 
          title: 'Position voll', 
          description: `Maximum ${slot.max} Banner für ${BANNER_CONFIG[formData.position].name} erreicht`, 
          variant: 'destructive' 
        });
        return;
      }
    }
    
    try {
      const submitData = { ...formData };
      
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
      position: ad.position as BannerPosition,
      priority: ad.priority || 50,
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
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  const handleExtend = async (id: string, days: number) => {
    try {
      await extendAd.mutateAsync({ id, days });
      toast({ title: `Banner um ${days} Tage verlängert` });
    } catch (error) {
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const filteredAds = activeTab === 'all' 
    ? ads 
    : ads?.filter(ad => ad.position === activeTab);

  const config = BANNER_CONFIG[formData.position];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Banner-Verwaltung v2.0</h1>
          
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
                {/* Title */}
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Position with slot info */}
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: BannerPosition) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map((pos) => {
                        const cfg = BANNER_CONFIG[pos];
                        const slot = slotCounts[pos];
                        const isFull = slot.used >= slot.max;
                        return (
                          <SelectItem key={pos} value={pos} disabled={isFull && !editingAd}>
                            {cfg.name} ({slot.used}/{slot.max}) - CHF {cfg.pricePerDay}/Tag
                            {isFull && <span className="text-destructive ml-2">(voll)</span>}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {/* Position info box */}
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="font-medium">{config.name}</div>
                    <div className="text-muted-foreground">
                      Desktop: {config.desktop.width}×{config.desktop.height}px | 
                      Mobile: {config.mobile.width}×{config.mobile.height}px
                    </div>
                    <div className="text-muted-foreground">
                      Max. {config.maxSlots} Slots | CHF {config.pricePerDay}/Tag
                    </div>
                  </div>
                </div>

                {/* Priority Slider */}
                <div className="space-y-2">
                  <Label>Priority (Rotations-Gewichtung): {formData.priority}</Label>
                  <Slider
                    value={[formData.priority]}
                    onValueChange={([value]) => setFormData({ ...formData, priority: value })}
                    min={1}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Höhere Werte = höhere Chance bei Rotation angezeigt zu werden
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Banner-Bild</Label>
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
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm mt-2">Klicken zum Hochladen</p>
                    <p className="text-xs text-muted-foreground">
                      Wird auf {config.desktop.width}×{config.desktop.height}px zugeschnitten
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">oder URL</span>
                    </div>
                  </div>

                  <Input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                  />

                  {formData.image_url && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <img 
                        src={formData.image_url} 
                        alt="Vorschau"
                        className="max-w-full max-h-[200px] rounded mx-auto object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                {/* Link URL */}
                <div className="space-y-2">
                  <Label>Link-URL</Label>
                  <Input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    required
                  />
                </div>

                {/* Popup specific */}
                {formData.position === 'popup' && (
                  <div className="space-y-2">
                    <Label>Verzögerung (Sekunden)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.popup_delay_seconds}
                      onChange={(e) => setFormData({ ...formData, popup_delay_seconds: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                {/* Promo toggle */}
                <div className="border border-dashed border-primary/50 rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch
                      checked={isPromo}
                      onCheckedChange={setIsPromo}
                    />
                    <Label className="font-semibold text-primary">
                      🎁 Gratis Promo-Banner
                    </Label>
                  </div>
                  
                  {isPromo && (
                    <Select
                      value={promoDuration}
                      onValueChange={(v: '7' | '30' | '90' | 'unlimited') => setPromoDuration(v)}
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
                  )}
                </div>

                {/* Dates (when not promo) */}
                {!isPromo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Startdatum</Label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Enddatum</Label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Active toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>Aktiv</Label>
                </div>

                <Button type="submit" className="w-full" disabled={createAd.isPending || updateAd.isPending}>
                  {(createAd.isPending || updateAd.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAd ? 'Speichern' : 'Erstellen'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Slot Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {POSITION_OPTIONS.map((pos) => {
            const cfg = BANNER_CONFIG[pos];
            const slot = slotCounts[pos];
            const isFull = slot.used >= slot.max;
            return (
              <Card key={pos} className={isFull ? 'border-destructive' : ''}>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{cfg.name}</CardTitle>
                  <CardDescription>
                    <span className={isFull ? 'text-destructive font-bold' : ''}>
                      {slot.used}/{slot.max}
                    </span>
                    {isFull && <AlertCircle className="inline h-4 w-4 ml-1 text-destructive" />}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            {POSITION_OPTIONS.map((pos) => (
              <TabsTrigger key={pos} value={pos}>
                {BANNER_CONFIG[pos].name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vorschau</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>
                    <Eye className="h-4 w-4 inline mr-1" />
                    Impressions
                  </TableHead>
                  <TableHead>
                    <MousePointerClick className="h-4 w-4 inline mr-1" />
                    Klicks
                  </TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredAds?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Keine Banner gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds?.map((ad) => {
                    const ctr = ad.impressions > 0 
                      ? ((ad.clicks / ad.impressions) * 100).toFixed(2) 
                      : '0.00';
                    const expired = isExpired(ad.end_date);
                    
                    return (
                      <TableRow key={ad.id} className={expired ? 'opacity-50' : ''}>
                        <TableCell>
                          <img 
                            src={ad.image_url} 
                            alt={ad.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{ad.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {BANNER_CONFIG[ad.position as BannerPosition]?.name || ad.position}
                          </Badge>
                        </TableCell>
                        <TableCell>{ad.priority}</TableCell>
                        <TableCell>
                          {ad.active && !expired ? (
                            <Badge className="bg-green-500">Aktiv</Badge>
                          ) : expired ? (
                            <Badge variant="destructive">Abgelaufen</Badge>
                          ) : (
                            <Badge variant="secondary">Inaktiv</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ad.start_date && ad.end_date ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ad.start_date).toLocaleDateString('de-CH')} - {new Date(ad.end_date).toLocaleDateString('de-CH')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unbegrenzt</span>
                          )}
                        </TableCell>
                        <TableCell>{ad.impressions?.toLocaleString() || 0}</TableCell>
                        <TableCell>{ad.clicks?.toLocaleString() || 0}</TableCell>
                        <TableCell>{ctr}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(ad)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(ad.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            {expired && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExtend(ad.id, 30)}
                              >
                                +30 Tage
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Image Cropper Dialog */}
        <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Bild zuschneiden</DialogTitle>
            </DialogHeader>
            
            <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">
              {cropperImage && (
                <Cropper
                  image={cropperImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={getAspectRatio()}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Zoom: {zoom.toFixed(1)}x</Label>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={1}
                max={3}
                step={0.1}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCropperOpen(false);
                if (cropperImage) URL.revokeObjectURL(cropperImage);
                setCropperImage(null);
              }}>
                Abbrechen
              </Button>
              <Button onClick={handleCropSave} disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Zuschneiden & Hochladen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
