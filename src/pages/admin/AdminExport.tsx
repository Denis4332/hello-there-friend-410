import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useExportCSV } from '@/hooks/useExportCSV';
import { useExportJSON } from '@/hooks/useExportJSON';
import { Download, Database, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const AdminExport = () => {
  const { exportToCSV } = useExportCSV();
  const { exportToJSON } = useExportJSON();
  const [loading, setLoading] = useState<string | null>(null);

  const tables = [
    { name: 'profiles', label: 'Profile', icon: Database },
    { name: 'categories', label: 'Kategorien', icon: Database },
    { name: 'cities', label: 'Städte', icon: Database },
    { name: 'cantons', label: 'Kantone', icon: Database },
    { name: 'photos', label: 'Fotos', icon: Database },
    { name: 'profile_contacts', label: 'Kontaktdaten', icon: Database },
    { name: 'profile_categories', label: 'Profil-Kategorien', icon: Database },
    { name: 'user_roles', label: 'Nutzerrollen', icon: Database },
    { name: 'advertisements', label: 'Banner', icon: Database },
    { name: 'contact_messages', label: 'Nachrichten', icon: Database },
    { name: 'reports', label: 'Meldungen', icon: Database },
    { name: 'verification_submissions', label: 'Verifizierungen', icon: Database },
    { name: 'site_settings', label: 'Einstellungen', icon: Database },
    { name: 'dropdown_options', label: 'Dropdown-Optionen', icon: Database },
  ];

  const exportTable = async (tableName: string, format: 'csv' | 'json') => {
    setLoading(`${tableName}-${format}`);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning(`Keine Daten in Tabelle "${tableName}"`);
        return;
      }

      if (format === 'csv') {
        exportToCSV(data, tableName);
      } else {
        exportToJSON(data, tableName);
      }

      toast.success(`${tableName} erfolgreich exportiert`);
    } catch (error: any) {
      toast.error(`Fehler beim Exportieren: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const exportAllData = async () => {
    setLoading('all-backup');
    try {
      const allData: Record<string, any> = {};

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name as any)
          .select('*');

        if (error) {
          console.error(`Error fetching ${table.name}:`, error);
          continue;
        }

        allData[table.name] = data || [];
      }

      const backup = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        tables: allData,
      };

      exportToJSON(backup, 'escoria_full_backup');
      toast.success('Vollständiges Backup erstellt');
    } catch (error: any) {
      toast.error(`Fehler beim Backup: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Daten exportieren</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Exportiere einzelne Tabellen oder erstelle ein vollständiges Backup
              </p>
            </div>
            <Button 
              onClick={exportAllData}
              disabled={loading === 'all-backup'}
              size="lg"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Vollständiges Backup (JSON)
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => {
              const Icon = table.icon;
              return (
                <Card key={table.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5 text-primary" />
                      {table.label}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {table.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTable(table.name, 'csv')}
                      disabled={loading === `${table.name}-csv`}
                      className="flex-1 gap-1"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTable(table.name, 'json')}
                      disabled={loading === `${table.name}-json`}
                      className="flex-1 gap-1"
                    >
                      <FileJson className="h-4 w-4" />
                      JSON
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg border">
            <h3 className="font-semibold mb-2">💡 Hinweis</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• CSV-Exporte sind gut für Excel/Tabellenprogramme</li>
              <li>• JSON-Exporte enthalten die vollständige Datenstruktur</li>
              <li>• Das vollständige Backup enthält alle Tabellen in einer Datei</li>
              <li>• Exportdateien werden mit aktuellem Datum benannt</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminExport;
