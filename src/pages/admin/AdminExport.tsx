import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useExportCSV } from '@/hooks/useExportCSV';
import { useExportJSON } from '@/hooks/useExportJSON';
import { Download, Database, FileJson, FileSpreadsheet, Archive, FileCode, Code, ImageIcon, Rocket, Users, ShieldAlert, Github, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminExport = () => {
  const { exportToCSV } = useExportCSV();
  const { exportToJSON } = useExportJSON();
  const [loading, setLoading] = useState<string | null>(null);
  const [copiedGithub, setCopiedGithub] = useState(false);

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

  // List of edge functions in the project (for reference display)
  const edgeFunctions = [
    'admin-delete-user',
    'check-auth-rate-limit',
    'check-leaked-password',
    'check-subscription-expiry',
    'cleanup-orphaned-photos',
    'delete-user-account',
    'export-auth-users',
    'export-storage-urls',
    'export-user-data',
    'generate-sitemap',
    'geocode-all-profiles',
    'log-error',
    'record-auth-attempt',
    'track-ad-event',
    'track-event',
    'track-profile-view',
    'validate-image',
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
-- GitHub Repository geklont werden: supabase/migrations/

-- TABELLEN-ÜBERSICHT:
-- Diese Tabellen sind in der Datenbank vorhanden:
${tables.map(t => `-- - ${t.name} (${t.label})`).join('\n')}

-- MIGRATIONS-VERZEICHNIS (GitHub Repository):
-- Alle CREATE TABLE Statements, RLS Policies, Trigger und Functions
-- befinden sich in: supabase/migrations/
-- 
-- Klone das Repository und führe aus:
-- $ supabase link --project-ref YOUR_PROJECT_REF
-- $ supabase db push

-- EDGE FUNCTIONS (GitHub Repository):
-- Alle Backend-Logik in: supabase/functions/
-- Deploy mit: supabase functions deploy --all
--
-- Funktionen: ${edgeFunctions.join(', ')}

-- STORAGE BUCKETS:
-- - profile-photos (public)
-- - site-assets (public)
-- - advertisements (public)
-- - verification-photos (private)

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

  const copyGitCloneCommand = () => {
    // This is a placeholder - actual repo URL should be configured
    const command = 'git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git';
    navigator.clipboard.writeText(command);
    setCopiedGithub(true);
    toast.success('Git Clone Befehl kopiert!');
    setTimeout(() => setCopiedGithub(false), 2000);
  };

  const openGitHub = () => {
    toast.info('Öffne dein GitHub Repository in den Projekteinstellungen');
    // In a real scenario, this would link to the actual repository
    window.open('https://github.com', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Daten exportieren</h1>
            <p className="text-sm text-muted-foreground">
              Exportiere Daten für Self-Hosting. Code (Migrations + Edge Functions) kommt aus dem GitHub Repository.
            </p>
          </div>

          {/* GitHub Info Alert */}
          <Alert className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <Github className="h-5 w-5" />
            <AlertTitle className="flex items-center gap-2">
              📂 Code-Export via GitHub Repository
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                <strong>SQL-Migrationen</strong> und <strong>Edge Functions Code</strong> werden direkt aus dem 
                GitHub Repository bezogen. Diese Dateien ändern sich selten und sind immer aktuell im Repository verfügbar.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openGitHub} className="gap-2">
                  <Github className="h-4 w-4" />
                  GitHub öffnen
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={copyGitCloneCommand} className="gap-2">
                  {copiedGithub ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  git clone kopieren
                </Button>
              </div>
              <div className="mt-3 p-3 bg-background/50 rounded-md font-mono text-xs">
                <p className="text-muted-foreground mb-1"># Repository klonen und Supabase einrichten:</p>
                <p>git clone [DEIN_REPO_URL]</p>
                <p>cd [PROJEKT_NAME]</p>
                <p>supabase link --project-ref [DEIN_PROJECT_REF]</p>
                <p>supabase db push</p>
                <p>supabase functions deploy --all</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Complete Migration Package - Data Only */}
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Rocket className="h-6 w-6 text-primary" />
                🚀 Daten-Export für Migration
              </CardTitle>
              <CardDescription>
                Exportiere alle Daten (Users, Tabellen, Storage) - Code kommt aus GitHub!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

          {/* Code Reference Card */}
          <Card className="mb-6 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Github className="h-5 w-5" />
                📁 Code aus GitHub Repository
              </CardTitle>
              <CardDescription>
                Diese Dateien befinden sich im GitHub Repository und müssen nicht separat exportiert werden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode className="h-4 w-4 text-primary" />
                    <strong>SQL-Migrationen</strong>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    97 Migration-Dateien in <code className="bg-background px-1 rounded">supabase/migrations/</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enthält: CREATE TABLE, RLS Policies, Triggers, Functions, Storage Buckets
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4 text-primary" />
                    <strong>Edge Functions</strong>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {edgeFunctions.length} Functions in <code className="bg-background px-1 rounded">supabase/functions/</code>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {edgeFunctions.slice(0, 6).map(fn => (
                      <span key={fn} className="text-xs bg-background px-1.5 py-0.5 rounded">{fn}</span>
                    ))}
                    <span className="text-xs bg-background px-1.5 py-0.5 rounded">+{edgeFunctions.length - 6} mehr</span>
                  </div>
                </div>
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
            <h3 className="font-semibold mb-3 text-lg">📦 Migration Übersicht</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <strong className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  🔥 Auth Users + Passwörter:
                </strong>
                <p className="text-muted-foreground mt-1">
                  Exportiert ALLE User inkl. verschlüsselter Passwort-Hashes. 
                  User müssen sich NICHT neu registrieren! Export enthält automatisch Import-Script. 
                  ⚠️ SEHR sensibel - nach Import SOFORT löschen!
                </p>
              </div>
              
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <strong className="text-primary flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub Repository = Code-Quelle:
                </strong>
                <p className="text-muted-foreground mt-1">
                  SQL-Migrationen und Edge Functions Code befinden sich im GitHub Repository und werden 
                  mit <code className="bg-background px-1 rounded">supabase db push</code> und 
                  <code className="bg-background px-1 rounded">supabase functions deploy</code> deployed.
                </p>
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
                <strong>💡 Migration-Schritte:</strong>
                <ol className="text-muted-foreground space-y-1 ml-4 mt-1 list-decimal">
                  <li>GitHub Repository klonen</li>
                  <li>Neues Supabase-Projekt erstellen</li>
                  <li><code className="bg-background px-1 rounded">supabase link</code> + <code className="bg-background px-1 rounded">supabase db push</code></li>
                  <li>Auth Users importieren (mit Import-Script)</li>
                  <li>Tabellen-Daten importieren</li>
                  <li>Storage-Dateien herunterladen & hochladen</li>
                  <li>Edge Functions deployen</li>
                  <li>Frontend auf Netlify/Vercel deployen</li>
                </ol>
              </div>
              <div className="pt-2 border-t">
                <strong>📚 Dokumentation:</strong>
                <p className="text-muted-foreground">
                  Ausführliche Anleitung: <strong>MIGRATION.md</strong> im Projekt-Root
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminExport;
