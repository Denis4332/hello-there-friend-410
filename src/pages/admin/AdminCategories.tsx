import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { mockCategories } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AdminCategories = () => {
  const [categories, setCategories] = useState(mockCategories);

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Kategorien verwalten</h1>
            <Button>Neue Kategorie</Button>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Name</th>
                    <th className="text-left p-3 text-sm font-medium">Slug</th>
                    <th className="text-left p-3 text-sm font-medium">Aktiv</th>
                    <th className="text-left p-3 text-sm font-medium">Sortierung</th>
                    <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t">
                      <td className="p-3">
                        <Input defaultValue={category.name} className="h-8" />
                      </td>
                      <td className="p-3">
                        <Input defaultValue={category.slug} className="h-8" />
                      </td>
                      <td className="p-3">
                        <Badge className={category.active ? 'bg-success text-success-foreground' : 'bg-muted'}>
                          {category.active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Input type="number" defaultValue={category.sort_order} className="h-8 w-20" />
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Speichern</Button>
                          <Button size="sm" variant="destructive">Löschen</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            // TODO backend persist · Slug validieren (kleinbuchstaben-bindestrich)
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminCategories;
