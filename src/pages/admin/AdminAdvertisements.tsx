import { useState } from 'react';
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
import { useAllAdvertisements, useCreateAdvertisement, useUpdateAdvertisement, useDeleteAdvertisement } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';
import { Plus, Pencil, Trash2, Eye, MousePointerClick } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminAdvertisements() {
  const { data: ads, isLoading } = useAllAdvertisements();
  const createAd = useCreateAdvertisement();
  const updateAd = useUpdateAdvertisement();
  const deleteAd = useDeleteAdvertisement();
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
  });

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
    });
    setEditingAd(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAd) {
        await updateAd.mutateAsync({ id: editingAd.id, ...formData });
        toast({ title: 'Banner aktualisiert' });
      } else {
        await createAd.mutateAsync(formData);
        toast({ title: 'Banner erstellt' });
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

  const positionLabels = {
    popup: 'Pop-up (CHF 50/Tag)',
    top: 'Top-Banner (CHF 30/Tag)',
    grid: 'Grid-Banner (CHF 20/Tag)',
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
                  <Label htmlFor="image_url">Bild-URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                  />
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
                      <SelectItem value="popup">Pop-up (CHF 50/Tag)</SelectItem>
                      <SelectItem value="top">Top-Banner (CHF 30/Tag)</SelectItem>
                      <SelectItem value="grid">Grid-Banner (CHF 20/Tag)</SelectItem>
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

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität (höher = wichtiger)</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                </div>

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
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{positionLabels[ad.position]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ad.active ? 'default' : 'secondary'}>
                          {ad.active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
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
    </div>
  );
}
