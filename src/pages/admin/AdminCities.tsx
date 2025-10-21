import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus, Pencil, Save, X } from 'lucide-react';

interface City {
  city: string;
  canton: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
  profileCount: number;
}

interface Canton {
  id: string;
  name: string;
  abbreviation: string;
}

const AdminCities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCantonName, setNewCantonName] = useState('');
  const [newCantonAbbr, setNewCantonAbbr] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAbbr, setEditAbbr] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cantonToDelete, setCantonToDelete] = useState<string | null>(null);

  // Query: Cities Overview (aggregated from profiles)
  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('city, canton, postal_code, lat, lng')
        .eq('status', 'active');

      if (error) throw error;

      const cityMap = new Map<string, City>();
      data?.forEach(profile => {
        const key = `${profile.city}-${profile.canton}`;
        if (!cityMap.has(key)) {
          cityMap.set(key, {
            city: profile.city,
            canton: profile.canton,
            postal_code: profile.postal_code || undefined,
            lat: profile.lat || undefined,
            lng: profile.lng || undefined,
            profileCount: 1
          });
        } else {
          const existing = cityMap.get(key)!;
          existing.profileCount++;
        }
      });

      return Array.from(cityMap.values()).sort((a, b) => b.profileCount - a.profileCount);
    }
  });

  // Query: Cantons
  const { data: cantons, isLoading: cantonsLoading } = useQuery({
    queryKey: ['admin-cantons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cantons')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Canton[];
    }
  });

  // Mutation: Create Canton
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
      toast({
        title: 'Erfolg',
        description: 'Kanton wurde erstellt',
      });
      setCreateDialogOpen(false);
      setNewCantonName('');
      setNewCantonAbbr('');
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Kanton konnte nicht erstellt werden',
        variant: 'destructive',
      });
      console.error(error);
    }
  });

  // Mutation: Update Canton
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
      toast({
        title: 'Erfolg',
        description: 'Kanton wurde aktualisiert',
      });
      setEditingId(null);
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Kanton konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
      console.error(error);
    }
  });

  // Mutation: Delete Canton
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
      toast({
        title: 'Erfolg',
        description: 'Kanton wurde gelöscht',
      });
      setDeleteDialogOpen(false);
      setCantonToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Kanton konnte nicht gelöscht werden',
        variant: 'destructive',
      });
      console.error(error);
    }
  });

  const handleCreateCanton = () => {
    if (!newCantonName || !newCantonAbbr) {
      toast({
        title: 'Fehler',
        description: 'Bitte alle Felder ausfüllen',
        variant: 'destructive',
      });
      return;
    }
    createCanton.mutate({ name: newCantonName, abbreviation: newCantonAbbr });
  };

  const startEditing = (canton: Canton) => {
    setEditingId(canton.id);
    setEditName(canton.name);
    setEditAbbr(canton.abbreviation);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditAbbr('');
  };

  const saveEditing = (id: string) => {
    if (!editName || !editAbbr) {
      toast({
        title: 'Fehler',
        description: 'Bitte alle Felder ausfüllen',
        variant: 'destructive',
      });
      return;
    }
    updateCanton.mutate({ id, name: editName, abbreviation: editAbbr });
  };

  const confirmDelete = (id: string) => {
    setCantonToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (cantonToDelete) {
      deleteCanton.mutate(cantonToDelete);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Städte & Kantone</h1>

          <Tabs defaultValue="cities" className="w-full">
            <TabsList>
              <TabsTrigger value="cities">Städte Übersicht</TabsTrigger>
              <TabsTrigger value="cantons">Kantone verwalten</TabsTrigger>
            </TabsList>

            {/* Tab 1: Cities Overview */}
            <TabsContent value="cities">
              <div className="bg-card border rounded-lg overflow-hidden">
                {citiesLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Stadt</th>
                          <th className="text-left p-3 text-sm font-medium">Kanton</th>
                          <th className="text-left p-3 text-sm font-medium">PLZ</th>
                          <th className="text-left p-3 text-sm font-medium">Profile</th>
                          <th className="text-left p-3 text-sm font-medium">Koordinaten</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cities?.map((city, idx) => (
                          <tr key={`${city.city}-${city.canton}-${idx}`} className="border-t">
                            <td className="p-3">{city.city}</td>
                            <td className="p-3">{city.canton}</td>
                            <td className="p-3">{city.postal_code || '-'}</td>
                            <td className="p-3 font-semibold">{city.profileCount}</td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {city.lat && city.lng 
                                ? `${city.lat.toFixed(6)}, ${city.lng.toFixed(6)}`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Städte werden automatisch aus aktiven Profilen aggregiert. Sortiert nach Anzahl Profile.
              </p>
            </TabsContent>

            {/* Tab 2: Cantons Management */}
            <TabsContent value="cantons">
              <div className="mb-4 flex justify-end">
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Neuer Kanton
                    </Button>
                  </DialogTrigger>
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
                          value={newCantonName}
                          onChange={(e) => setNewCantonName(e.target.value)}
                          placeholder="z.B. Zürich"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="abbreviation">Kürzel</Label>
                        <Input
                          id="abbreviation"
                          value={newCantonAbbr}
                          onChange={(e) => setNewCantonAbbr(e.target.value)}
                          placeholder="z.B. ZH"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleCreateCanton}
                        disabled={createCanton.isPending}
                      >
                        {createCanton.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Erstellen
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-card border rounded-lg overflow-hidden">
                {cantonsLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Name</th>
                          <th className="text-left p-3 text-sm font-medium">Kürzel</th>
                          <th className="text-left p-3 text-sm font-medium w-32">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cantons?.map((canton) => (
                          <tr key={canton.id} className="border-t">
                            {editingId === canton.id ? (
                              <>
                                <td className="p-3">
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-8"
                                  />
                                </td>
                                <td className="p-3">
                                  <Input
                                    value={editAbbr}
                                    onChange={(e) => setEditAbbr(e.target.value)}
                                    className="h-8"
                                    maxLength={2}
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => saveEditing(canton.id)}
                                      disabled={updateCanton.isPending}
                                    >
                                      {updateCanton.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEditing}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3">{canton.name}</td>
                                <td className="p-3">{canton.abbreviation}</td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEditing(canton)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => confirmDelete(canton.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteCanton.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
};

export default AdminCities;
