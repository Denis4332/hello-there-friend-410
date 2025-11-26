import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
  intro_text: string | null;
}

const validateSlug = (slug: string): string | null => {
  const trimmed = slug.trim();
  if (!trimmed) return 'Slug darf nicht leer sein';
  if (!/^[a-z0-9-]+$/.test(trimmed)) return 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten';
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) return 'Slug darf nicht mit Bindestrich beginnen oder enden';
  return null;
};

const AdminCategories = () => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    slug: '', 
    active: true, 
    sort_order: 0,
    intro_text: '',
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (category: Category) => {
      const slugError = validateSlug(category.slug);
      if (slugError) throw new Error(slugError);

      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          slug: category.slug,
          active: category.active,
          sort_order: category.sort_order,
          intro_text: category.intro_text || null,
        })
        .eq('id', category.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({ title: 'Kategorie aktualisiert', description: 'Die Änderungen wurden gespeichert.' });
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: typeof newCategory) => {
      const slugError = validateSlug(category.slug);
      if (slugError) throw new Error(slugError);
      if (!category.name.trim()) throw new Error('Name darf nicht leer sein');

      const { error } = await supabase
        .from('categories')
        .insert({
          name: category.name.trim(),
          slug: category.slug.trim(),
          active: category.active,
          sort_order: category.sort_order,
          intro_text: category.intro_text || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({ title: 'Kategorie erstellt', description: 'Die neue Kategorie wurde hinzugefügt.' });
      setNewCategory({ name: '', slug: '', active: true, sort_order: 0, intro_text: '' });
      setCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({ title: 'Kategorie gelöscht', description: 'Die Kategorie wurde entfernt.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = (category: Category) => {
    updateCategoryMutation.mutate(category);
  };

  const handleFieldChange = (id: string, field: keyof Category, value: string | boolean | number) => {
    if (!editingCategory || editingCategory.id !== id) {
      const category = categories?.find(c => c.id === id);
      if (category) {
        setEditingCategory({ ...category, [field]: value });
      }
    } else {
      setEditingCategory({ ...editingCategory, [field]: value });
    }
  };

  const getCurrentValue = (category: Category, field: keyof Category) => {
    if (editingCategory?.id === category.id) {
      return editingCategory[field];
    }
    return category[field];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Kategorien</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {categories?.length || 0} Kategorien
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Neue Kategorie</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Neue Kategorie erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie eine neue Kategorie für Profile.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Name</Label>
                    <Input
                      id="new-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="z.B. Begleitservice"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-slug">Slug</Label>
                    <Input
                      id="new-slug"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase() })}
                      placeholder="z.B. begleitservice"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nur Kleinbuchstaben, Zahlen und Bindestriche
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-sort">Sortierung</Label>
                    <Input
                      id="new-sort"
                      type="number"
                      value={newCategory.sort_order}
                      onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-intro">Intro-Text (SEO)</Label>
                    <Textarea
                      id="new-intro"
                      value={newCategory.intro_text}
                      onChange={(e) => setNewCategory({ ...newCategory, intro_text: e.target.value })}
                      placeholder="SEO-optimierter Intro-Text für die Kategorie-Seite..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="new-active"
                      checked={newCategory.active}
                      onCheckedChange={(checked) => setNewCategory({ ...newCategory, active: checked })}
                    />
                    <Label htmlFor="new-active">Aktiv</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createCategoryMutation.mutate(newCategory)}
                    disabled={createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Name</th>
                      <th className="text-left p-3 text-sm font-medium">Slug</th>
                      <th className="text-left p-3 text-sm font-medium">Intro-Text</th>
                      <th className="text-left p-3 text-sm font-medium">Aktiv</th>
                      <th className="text-left p-3 text-sm font-medium">Sortierung</th>
                      <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories?.map((category, index) => (
                      <tr key={category.id} className={`border-t hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="p-3">
                          <Input
                            value={getCurrentValue(category, 'name') as string}
                            onChange={(e) => handleFieldChange(category.id, 'name', e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            value={getCurrentValue(category, 'slug') as string}
                            onChange={(e) => handleFieldChange(category.id, 'slug', e.target.value.toLowerCase())}
                            className="h-8"
                          />
                        </td>
                        <td className="p-3">
                          <Textarea
                            value={getCurrentValue(category, 'intro_text') as string || ''}
                            onChange={(e) => handleFieldChange(category.id, 'intro_text', e.target.value)}
                            className="min-w-[200px]"
                            rows={2}
                            placeholder="SEO-optimierter Intro-Text..."
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={getCurrentValue(category, 'active') as boolean}
                              onCheckedChange={(checked) => handleFieldChange(category.id, 'active', checked)}
                            />
                            <Badge variant={getCurrentValue(category, 'active') ? 'default' : 'secondary'}>
                              {getCurrentValue(category, 'active') ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={getCurrentValue(category, 'sort_order') as number}
                            onChange={(e) => handleFieldChange(category.id, 'sort_order', parseInt(e.target.value) || 0)}
                            className="h-8 w-20"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSave(editingCategory?.id === category.id ? editingCategory : category)}
                              disabled={updateCategoryMutation.isPending}
                            >
                              {updateCategoryMutation.isPending && editingCategory?.id === category.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Speichern
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">Löschen</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Möchten Sie die Kategorie "{category.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Löschen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCategories;
