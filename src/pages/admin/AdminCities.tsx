import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { mockCities } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AdminCities = () => {
  const [cities, setCities] = useState(mockCities);

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Städte verwalten</h1>
            <Button>Neue Stadt</Button>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Name</th>
                    <th className="text-left p-3 text-sm font-medium">Kanton</th>
                    <th className="text-left p-3 text-sm font-medium">PLZ</th>
                    <th className="text-left p-3 text-sm font-medium">Lat</th>
                    <th className="text-left p-3 text-sm font-medium">Lng</th>
                    <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((city) => (
                    <tr key={city.id} className="border-t">
                      <td className="p-3">
                        <Input defaultValue={city.name} className="h-8" />
                      </td>
                      <td className="p-3">
                        <Input defaultValue={city.canton} className="h-8" />
                      </td>
                      <td className="p-3">
                        <Input defaultValue={city.postal_code} className="h-8" />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.000001"
                          defaultValue={city.lat}
                          className="h-8 w-32"
                          placeholder="Lat"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.000001"
                          defaultValue={city.lng}
                          className="h-8 w-32"
                          placeholder="Lng"
                        />
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
            // TODO geocoding für Lat/Lng via API · // TODO backend persist
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminCities;
