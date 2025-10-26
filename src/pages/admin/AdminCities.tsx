import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface City {
  id: string;
  name: string;
  slug: string;
  canton_id: string;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  intro_text: string | null;
  canton?: {
    id: string;
    name: string;
    abbreviation: string;
  };
}

interface Canton {
  id: string;
  name: string;
  abbreviation: string;
}

const AdminCities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for City management
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityForm, setCityForm] = useState({
    name: '',
    canton_id: '',
    postal_code: '',
    lat: '',
    lng: '',
    intro_text: '',
  });
  const [showDeleteCityDialog, setShowDeleteCityDialog] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  
  // State for Canton management
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cantonToDelete, setCantonToDelete] = useState<Canton | null>(null);
  const [editingCantonId, setEditingCantonId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ name: string; abbreviation: string }>({ name: '', abbreviation: '' });
  const [newCanton, setNewCanton] = useState({ name: '', abbreviation: '' });

  // Fetch cities from database
  const { data: cities = [], isLoading: loadingCities } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          canton:cantons(id, name, abbreviation)
        `)
        .order('name');

      if (error) throw error;
      return data as City[];
    },
  });

  // Fetch cantons
  const { data: cantons = [], isLoading: loadingCantons } = useQuery({
    queryKey: ['admin-cantons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cantons')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Canton[];
    },
  });

  // Create city mutation
  const createCityMutation = useMutation({
    mutationFn: async (cityData: typeof cityForm) => {
      const { data, error } = await supabase
        .from('cities')
        .insert([{
          name: cityData.name,
          canton_id: cityData.canton_id,
          postal_code: cityData.postal_code || null,
          lat: cityData.lat ? parseFloat(cityData.lat) : null,
          lng: cityData.lng ? parseFloat(cityData.lng) : null,
          intro_text: cityData.intro_text || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      toast({ title: 'Stadt erfolgreich erstellt' });
      setShowCityDialog(false);
      resetCityForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Erstellen', description: error.message, variant: 'destructive' });
    },
  });

  // Update city mutation
  const updateCityMutation = useMutation({
    mutationFn: async ({ id, cityData }: { id: string; cityData: typeof cityForm }) => {
      const { data, error } = await supabase
        .from('cities')
        .update({
          name: cityData.name,
          canton_id: cityData.canton_id,
          postal_code: cityData.postal_code || null,
          lat: cityData.lat ? parseFloat(cityData.lat) : null,
          lng: cityData.lng ? parseFloat(cityData.lng) : null,
          intro_text: cityData.intro_text || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      toast({ title: 'Stadt erfolgreich aktualisiert' });
      setShowCityDialog(false);
      resetCityForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Aktualisieren', description: error.message, variant: 'destructive' });
    },
  });

  // Delete city mutation
  const deleteCityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      toast({ title: 'Stadt erfolgreich gelöscht' });
      setShowDeleteCityDialog(false);
      setCityToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler beim Löschen', description: error.message, variant: 'destructive' });
    },
  });

  // Create canton mutation
  const createCanton = useMutation({
    mutationFn: async (newCanton: { name: string; abbreviation: string }) => {
      const { data, error } = await supabase
        .from('cantons')
        .insert([newCanton])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cantons'] });
      toast({ title: 'Kanton erstellt' });
      setShowCreateDialog(false);
      setNewCanton({ name: '', abbreviation: '' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  });

  // Update canton mutation
  const updateCanton = useMutation({
    mutationFn: async ({ id, name, abbreviation }: { id: string; name: string; abbreviation: string }) => {
      const { data, error } = await supabase
        .from('cantons')
        .update({ name, abbreviation })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cantons'] });
      toast({ title: 'Kanton aktualisiert' });
      setEditingCantonId(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  });

  // Delete canton mutation
  const deleteCanton = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cantons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cantons'] });
      toast({ title: 'Kanton gelöscht' });
      setShowDeleteDialog(false);
      setCantonToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  });

  // Canton handlers
  const handleCreateCanton = () => {
    if (!newCanton.name || !newCanton.abbreviation) {
      toast({ title: 'Bitte alle Felder ausfüllen', variant: 'destructive' });
      return;
    }
    createCanton.mutate({ name: newCanton.name, abbreviation: newCanton.abbreviation });
  };

  const startEditing = (canton: Canton) => {
    setEditingCantonId(canton.id);
    setEditingValues({ name: canton.name, abbreviation: canton.abbreviation });
  };

  const cancelEditing = () => {
    setEditingCantonId(null);
    setEditingValues({ name: '', abbreviation: '' });
  };

  const saveEditing = (id: string) => {
    if (!editingValues.name || !editingValues.abbreviation) {
      toast({ title: 'Bitte alle Felder ausfüllen', variant: 'destructive' });
      return;
    }
    updateCanton.mutate({ id, name: editingValues.name, abbreviation: editingValues.abbreviation });
  };

  const confirmDelete = (canton: Canton) => {
    setCantonToDelete(canton);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (cantonToDelete) {
      deleteCanton.mutate(cantonToDelete.id);
    }
  };

  // City handlers
  const resetCityForm = () => {
    setCityForm({
      name: '',
      canton_id: '',
      postal_code: '',
      lat: '',
      lng: '',
      intro_text: '',
    });
    setEditingCity(null);
  };

  const handleCreateCity = () => {
    resetCityForm();
    setShowCityDialog(true);
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityForm({
      name: city.name,
      canton_id: city.canton_id,
      postal_code: city.postal_code || '',
      lat: city.lat?.toString() || '',
      lng: city.lng?.toString() || '',
      intro_text: city.intro_text || '',
    });
    setShowCityDialog(true);
  };

  const handleSaveCity = () => {
    if (!cityForm.name || !cityForm.canton_id) {
      toast({ title: 'Bitte Name und Kanton ausfüllen', variant: 'destructive' });
      return;
    }

    if (editingCity) {
      updateCityMutation.mutate({ id: editingCity.id, cityData: cityForm });
    } else {
      createCityMutation.mutate(cityForm);
    }
  };

  const confirmDeleteCity = (city: City) => {
    setCityToDelete(city);
    setShowDeleteCityDialog(true);
  };

  const handleDeleteCity = () => {
    if (cityToDelete) {
      deleteCityMutation.mutate(cityToDelete.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Städte & Kantone</h1>

          <Tabs defaultValue="cities" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cities">Städte verwalten</TabsTrigger>
              <TabsTrigger value="cantons">Kantone verwalten</TabsTrigger>
            </TabsList>

            <TabsContent value="cities" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Städte verwalten</h2>
                <Button onClick={handleCreateCity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Stadt erstellen
                </Button>
              </div>

              {loadingCities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Kanton</TableHead>
                          <TableHead>PLZ</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cities.map((city) => (
                          <TableRow key={city.id}>
                            <TableCell className="font-medium">{city.name}</TableCell>
                            <TableCell>{city.canton?.name || '-'}</TableCell>
                            <TableCell>{city.postal_code || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{city.slug}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCity(city)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => confirmDeleteCity(city)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cantons" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Kantone verwalten</h2>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Kanton
                </Button>
              </div>

              {loadingCantons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Kürzel</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cantons.map((canton) => (
                          <TableRow key={canton.id}>
                            {editingCantonId === canton.id ? (
                              <>
                                <TableCell>
                                  <Input
                                    value={editingValues.name}
                                    onChange={(e) => setEditingValues({ ...editingValues, name: e.target.value })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editingValues.abbreviation}
                                    onChange={(e) => setEditingValues({ ...editingValues, abbreviation: e.target.value })}
                                    maxLength={2}
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={() => saveEditing(canton.id)}>
                                      Speichern
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                                      Abbrechen
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>{canton.name}</TableCell>
                                <TableCell>{canton.abbreviation}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditing(canton)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => confirmDelete(canton)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create/Edit City Dialog */}
      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCity ? 'Stadt bearbeiten' : 'Neue Stadt erstellen'}</DialogTitle>
            <DialogDescription>
              {editingCity ? 'Bearbeiten Sie die Stadt-Informationen.' : 'Erstellen Sie eine neue Stadt mit allen Details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="city-name">Name *</Label>
              <Input
                id="city-name"
                value={cityForm.name}
                onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                placeholder="z.B. Zürich"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city-canton">Kanton *</Label>
              <Select
                value={cityForm.canton_id}
                onValueChange={(value) => setCityForm({ ...cityForm, canton_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kanton wählen" />
                </SelectTrigger>
                <SelectContent>
                  {cantons.map((canton) => (
                    <SelectItem key={canton.id} value={canton.id}>
                      {canton.name} ({canton.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city-postal">Postleitzahl</Label>
              <Input
                id="city-postal"
                value={cityForm.postal_code}
                onChange={(e) => setCityForm({ ...cityForm, postal_code: e.target.value })}
                placeholder="z.B. 8000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city-lat">Breitengrad</Label>
                <Input
                  id="city-lat"
                  value={cityForm.lat}
                  onChange={(e) => setCityForm({ ...cityForm, lat: e.target.value })}
                  placeholder="z.B. 47.3769"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city-lng">Längengrad</Label>
                <Input
                  id="city-lng"
                  value={cityForm.lng}
                  onChange={(e) => setCityForm({ ...cityForm, lng: e.target.value })}
                  placeholder="z.B. 8.5417"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city-intro">Intro-Text</Label>
              <Textarea
                id="city-intro"
                value={cityForm.intro_text}
                onChange={(e) => setCityForm({ ...cityForm, intro_text: e.target.value })}
                placeholder="SEO-optimierter Intro-Text für die Stadt-Seite..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCityDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCity}>
              {editingCity ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete City Confirmation */}
      <AlertDialog open={showDeleteCityDialog} onOpenChange={setShowDeleteCityDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stadt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Stadt "{cityToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCity}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Canton Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Kanton</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Kanton.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCanton.name}
                onChange={(e) => setNewCanton({ ...newCanton, name: e.target.value })}
                placeholder="z.B. Zürich"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="abbreviation">Kürzel</Label>
              <Input
                id="abbreviation"
                value={newCanton.abbreviation}
                onChange={(e) => setNewCanton({ ...newCanton, abbreviation: e.target.value })}
                placeholder="z.B. ZH"
                maxLength={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCanton} disabled={createCanton.isPending}>
              {createCanton.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Canton Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kanton löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Kanton wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCantonToDelete(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteCanton.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCities;
