import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllDropdownOptions, useCreateDropdownOption, useUpdateDropdownOption, useDeleteDropdownOption, DropdownOption } from '@/hooks/useDropdownOptions';
import { SEO } from '@/components/SEO';

const AdminDropdowns = () => {
  const { data: allOptions = [], isLoading } = useAllDropdownOptions();
  const createOption = useCreateDropdownOption();
  const updateOption = useUpdateDropdownOption();
  const deleteOption = useDeleteDropdownOption();

  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('languages');
  
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    sort_order: 0,
  });

  const categories = [
    { key: 'languages', label: 'Sprachen', description: 'Sprachen die in Profilen ausgewählt werden können' },
    { key: 'genders', label: 'Geschlechter', description: 'Geschlechtsoptionen für Profile' },
    { key: 'radius', label: 'Umkreis-Optionen', description: 'Umkreisoptionen für die Suche (in km)' },
    { key: 'report_reasons', label: 'Meldegründe', description: 'Gründe für Profil-Meldungen' },
  ];

  const handleOpenDialog = (category: string, option?: DropdownOption) => {
    setCurrentCategory(category);
    if (option) {
      setEditingOption(option);
      setFormData({
        value: option.value,
        label: option.label,
        sort_order: option.sort_order,
      });
    } else {
      setEditingOption(null);
      setFormData({
        value: '',
        label: '',
        sort_order: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingOption) {
      await updateOption.mutateAsync({
        id: editingOption.id,
        ...formData,
      });
    } else {
      await createOption.mutateAsync({
        category: currentCategory,
        ...formData,
        active: true,
      });
    }
    setDialogOpen(false);
    setFormData({ value: '', label: '', sort_order: 0 });
    setEditingOption(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Möchten Sie diese Option wirklich löschen?')) {
      await deleteOption.mutateAsync(id);
    }
  };

  const getOptionsForCategory = (category: string) => {
    return allOptions.filter(opt => opt.category === category).sort((a, b) => a.sort_order - b.sort_order);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Dropdown-Optionen verwalten"
        description="Verwalten Sie Dropdown-Optionen für Sprachen, Geschlechter, Umkreis und Meldegründe"
      />
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dropdown-Optionen</h1>
          <p className="text-muted-foreground">Verwalten Sie dynamische Auswahloptionen</p>
        </div>

        <Tabs defaultValue="languages" className="space-y-4">
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat.key} value={cat.key}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.key} value={cat.key}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{cat.label}</CardTitle>
                      <CardDescription>{cat.description}</CardDescription>
                    </div>
                    <Dialog open={dialogOpen && currentCategory === cat.key} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog(cat.key)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Neue Option
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingOption ? 'Option bearbeiten' : 'Neue Option erstellen'}
                          </DialogTitle>
                          <DialogDescription>
                            {editingOption ? 'Bearbeiten Sie die Option' : 'Erstellen Sie eine neue Option'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Wert (intern)</label>
                            <Input
                              value={formData.value}
                              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                              placeholder="z.B. deutsch, female, 5"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Anzeigetext</label>
                            <Input
                              value={formData.label}
                              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                              placeholder="z.B. Deutsch, Weiblich, 5 km"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Sortierung</label>
                            <Input
                              type="number"
                              value={formData.sort_order}
                              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                            />
                          </div>
                          <Button 
                            onClick={handleSave} 
                            className="w-full"
                            disabled={createOption.isPending || updateOption.isPending}
                          >
                            {createOption.isPending || updateOption.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Wird gespeichert...
                              </>
                            ) : (
                              'Speichern'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wert</TableHead>
                        <TableHead>Anzeigetext</TableHead>
                        <TableHead>Sortierung</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getOptionsForCategory(cat.key).map((option) => (
                        <TableRow key={option.id}>
                          <TableCell className="font-mono text-sm">{option.value}</TableCell>
                          <TableCell>{option.label}</TableCell>
                          <TableCell>{option.sort_order}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(cat.key, option)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(option.id)}
                              disabled={deleteOption.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {getOptionsForCategory(cat.key).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Keine Optionen vorhanden
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDropdowns;
