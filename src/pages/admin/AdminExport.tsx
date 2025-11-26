import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useExportCSV } from '@/hooks/useExportCSV';
import { useExportJSON } from '@/hooks/useExportJSON';
import { Download, Database, FileJson, FileSpreadsheet, Archive, FileCode, Code, ImageIcon, Rocket, Users, ShieldAlert } from 'lucide-react';
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
    { name: 'user_favorites', label: 'Favoriten', icon: Database },
    { name: 'profile_views', label: 'Profilaufrufe', icon: Database },
    { name: 'profile_moderation_notes', label: 'Moderations-Notizen', icon: Database },
    { name: 'analytics_events', label: 'Analytics Events', icon: Database },
    { name: 'auth_rate_limits', label: 'Auth Rate Limits', icon: Database },
    { name: 'error_logs', label: 'Fehler-Logs', icon: Database },
    { name: 'search_queries', label: 'Suchanfragen', icon: Database },
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

  const exportStorage = async () => {
    setLoading('storage-export');
    toast.info('Storage Export wird vorbereitet...');
    try {
      const buckets = ['profile-photos', 'site-assets', 'advertisements', 'verification-photos'];
      const storageData: Record<string, any[]> = {};
      
      for (const bucket of buckets) {
        const { data: files, error } = await supabase.storage.from(bucket).list();
        if (error) {
          console.error(`Error listing ${bucket}:`, error);
          storageData[bucket] = [];
          continue;
        }
        storageData[bucket] = files || [];
      }

      exportToJSON({
        exported_at: new Date().toISOString(),
        buckets: storageData,
        note: 'Für vollständigen Export müssen Dateien manuell heruntergeladen werden. Diese JSON-Datei listet alle vorhandenen Dateien auf.',
        migration_hint: 'Siehe MIGRATION.md für Anleitung zum programmatischen Download & Upload'
      }, 'escoria_storage_index');
      
      toast.success('Storage-Index erfolgreich exportiert');
    } catch (error: any) {
      toast.error(`Fehler beim Storage-Export: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const exportSchema = async () => {
    setLoading('schema-export');
    toast.info('Datenbank-Schema wird vorbereitet...');
    try {
      const schemaDoc = `-- ESCORIA Database Schema Export
-- Generated: ${new Date().toISOString()}
-- 
-- WICHTIG: Dieses Schema-Export ist eine Referenz für die Datenbank-Struktur.
-- Für vollständige Migration müssen alle Supabase-Migrationen aus dem 
-- supabase/migrations/ Verzeichnis verwendet werden.

-- TABELLEN-ÜBERSICHT:
-- Diese Tabellen sind in der Datenbank vorhanden:
${tables.map(t => `-- - ${t.name} (${t.label})`).join('\n')}

-- MIGRATIONS-VERZEICHNIS:
-- Alle CREATE TABLE Statements, RLS Policies, Trigger und Functions
-- befinden sich in: supabase/migrations/

-- WICHTIGE HINWEISE FÜR MIGRATION:
-- 1. Führe alle Migrations in chronologischer Reihenfolge aus
-- 2. Nutze 'supabase db push' für automatisches Anwenden
-- 3. Oder führe SQL-Files manuell im Supabase SQL Editor aus
-- 4. RLS Policies MÜSSEN aktiviert sein für Sicherheit

-- STORAGE BUCKETS:
-- - profile-photos (public)
-- - site-assets (public)
-- - advertisements (public)
-- - verification-photos (private)

-- EDGE FUNCTIONS:
-- Alle Backend-Logik in: supabase/functions/
-- Deploy mit: supabase functions deploy FUNCTION_NAME

-- FÜR DETAILLIERTE MIGRATIONS-ANLEITUNG:
-- Siehe: MIGRATION.md im Projekt-Root

-- END OF SCHEMA REFERENCE
`;

      const blob = new Blob([schemaDoc], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `escoria_schema_reference_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Schema-Referenz erfolgreich exportiert');
    } catch (error: any) {
      toast.error(`Fehler beim Schema-Export: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const exportCompleteMigrations = async () => {
    setLoading('complete-migrations');
    toast.info('Exportiere vollständiges SQL-Schema...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nicht angemeldet');
        return;
      }

      const response = await supabase.functions.invoke('export-migrations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const blob = new Blob([response.data], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `escoria_complete_schema_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Komplettes SQL-Schema erfolgreich exportiert!');
    } catch (error: any) {
      toast.error(`Fehler beim SQL-Schema-Export: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const exportEdgeFunctions = async () => {
    setLoading('edge-functions');
    toast.info('Exportiere Edge Functions...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nicht angemeldet');
        return;
      }

      const response = await supabase.functions.invoke('export-edge-functions', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `escoria_edge_functions_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${response.data.total_functions} Edge Functions erfolgreich exportiert!`);
    } catch (error: any) {
      toast.error(`Fehler beim Edge Functions-Export: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const exportStorageUrls = async () => {
    setLoading('storage-urls');
    toast.info('Generiere Download-URLs für alle Dateien...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nicht angemeldet');
        return;
      }

      const response = await supabase.functions.invoke('export-storage-urls', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `escoria_storage_download_urls_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Download-URLs für ${response.data.total_files} Dateien generiert! (Gültig für 7 Tage)`);
    } catch (error: any) {
      toast.error(`Fehler beim Generieren der Download-URLs: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const exportAuthUsers = async () => {
    setLoading('auth-users');
    toast.info('Exportiere Auth-Users mit Passwort-Hashes...');
    toast.warning('⚠️ Sensible Daten! Sicher aufbewahren!', { duration: 5000 });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nicht angemeldet');
        return;
      }

      const response = await supabase.functions.invoke('export-auth-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `escoria_auth_users_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${response.data.metadata.total_users} User mit Passwörtern exportiert! Import-Script enthalten.`);
      toast.warning('Nach Import UNBEDINGT Datei löschen!', { duration: 10000 });
    } catch (error: any) {
      toast.error(`Fehler beim Auth-Export: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Daten exportieren</h1>
            <p className="text-sm text-muted-foreground">
              Exportiere einzelne Tabellen oder erstelle ein vollständiges Backup für Self-Hosting
            </p>
          </div>

          {/* Complete Migration Package */}
          <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Rocket className="h-6 w-6 text-primary" />
                🚀 Komplette Supabase-Migration
              </CardTitle>
              <CardDescription>
                Exportiere ALLES für eine vollständige Migration zu eigenem Supabase-Projekt - inkl. Auth Users mit Passwörtern!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <Button 
                  onClick={exportAuthUsers}
                  disabled={loading === 'auth-users'}
                  size="lg"
                  variant="destructive"
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <ShieldAlert className="h-5 w-5" />
                  <span className="text-sm font-bold">Auth Users + Passwörter</span>
                  <span className="text-xs opacity-70">⚠️ Sensible Daten!</span>
                </Button>
                <Button 
                  onClick={exportCompleteMigrations}
                  disabled={loading === 'complete-migrations'}
                  size="lg"
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <FileCode className="h-5 w-5" />
                  <span className="text-sm">Komplettes SQL-Schema</span>
                  <span className="text-xs opacity-70">88+ Migrations kombiniert</span>
                </Button>
                <Button 
                  onClick={exportEdgeFunctions}
                  disabled={loading === 'edge-functions'}
                  size="lg"
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <Code className="h-5 w-5" />
                  <span className="text-sm">Edge Functions Code</span>
                  <span className="text-xs opacity-70">15 Backend Functions</span>
                </Button>
                <Button 
                  onClick={exportStorageUrls}
                  disabled={loading === 'storage-urls'}
                  size="lg"
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">Storage Download-URLs</span>
                  <span className="text-xs opacity-70">7 Tage gültig</span>
                </Button>
                <Button 
                  onClick={exportAllData}
                  disabled={loading === 'all-backup'}
                  size="lg"
                  className="gap-2 h-auto py-4 flex-col"
                >
                  <Database className="h-5 w-5" />
                  <span className="text-sm">Alle Daten (JSON)</span>
                  <span className="text-xs opacity-70">{tables.length} Tabellen</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              onClick={exportStorage}
              disabled={loading === 'storage-export'}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              {loading === 'storage-export' ? 'Wird exportiert...' : 'Storage Index (JSON)'}
            </Button>
            <Button 
              onClick={exportSchema}
              disabled={loading === 'schema-export'}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <FileCode className="h-4 w-4" />
              {loading === 'schema-export' ? 'Wird exportiert...' : 'Schema Referenz (SQL)'}
            </Button>
          </div>

          {/* Individual Tables */}
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

          {/* Info Box */}
          <div className="mt-8 p-6 bg-card rounded-lg border">
            <h3 className="font-semibold mb-3 text-lg">📦 Export-Optionen Übersicht</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <strong className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  🔥 NEU: Auth Users + Passwörter:
                </strong>
                <p className="text-muted-foreground mt-1">
                  Exportiert ALLE User inkl. verschlüsselter Passwort-Hashes (encrypted_password). 
                  User müssen sich NICHT neu registrieren! Export enthält automatisch Import-Script für neues Supabase-Projekt. 
                  ⚠️ SEHR sensibel - nach Import SOFORT löschen!
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <strong className="text-primary flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Komplette Supabase-Migration:
                </strong>
                <p className="text-muted-foreground mt-1">
                  Exportiert ALLES für vollständige Unabhängigkeit: Auth Users mit Passwörtern, SQL-Schema (88+ Migrations kombiniert), 
                  15 Edge Functions mit Code, Download-URLs für alle Storage-Dateien (7 Tage gültig), 
                  und alle {tables.length} Tabellen als JSON. Nach dem Export kannst du komplett zu eigenem 
                  Supabase-Projekt wechseln - 100% unabhängig von Lovable Cloud ohne User-Neu-Registrierung!
                </p>
              </div>
              <div>
                <strong className="text-primary">Komplettes SQL-Schema:</strong>
                <p className="text-muted-foreground">Alle 88+ Migration-Files kombiniert in eine SQL-Datei. Enthält CREATE TABLE, RLS Policies, Triggers, Functions, Storage Buckets. Einfach im Supabase SQL-Editor ausführen.</p>
              </div>
              <div>
                <strong className="text-primary">Edge Functions Code:</strong>
                <p className="text-muted-foreground">Alle 14 Backend-Functions mit vollständigem TypeScript-Code als JSON. Inkl. Deployment-Anleitung für Supabase CLI.</p>
              </div>
              <div>
                <strong className="text-primary">Storage Download-URLs:</strong>
                <p className="text-muted-foreground">Signierte URLs (7 Tage gültig) für alle Dateien aus allen Buckets. Download mit Browser, wget, oder Skript möglich.</p>
              </div>
              <div>
                <strong className="text-primary">Alle Daten (JSON):</strong>
                <p className="text-muted-foreground">Alle {tables.length} Tabellen in einer Datei. Ideal für komplettes Backup.</p>
              </div>
              <div className="pt-2 border-t">
                <strong>💡 Hinweise:</strong>
                <ul className="text-muted-foreground space-y-1 ml-4 mt-1">
                  <li>• CSV-Exporte sind gut für Excel/Tabellenprogramme</li>
                  <li>• JSON-Exporte enthalten die vollständige Datenstruktur</li>
                  <li>• Exportdateien werden mit aktuellem Datum benannt</li>
                  <li>• Storage-URLs sind 7 Tage gültig, danach neu generieren</li>
                  <li>• Für Self-Hosting siehe <strong>MIGRATION.md</strong> im Projekt-Root</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminExport;
