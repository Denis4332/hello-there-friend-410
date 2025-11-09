import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ShieldAlert, Unlock, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface RateLimitRecord {
  id: string;
  email: string;
  attempt_type: 'login' | 'signup' | 'password_reset';
  failed_attempts: number;
  last_attempt_at: string;
  locked_until: string | null;
  is_locked: boolean;
  minutes_remaining: number;
  created_at: string;
  updated_at: string;
}

const AdminRateLimits = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyLocked, setShowOnlyLocked] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [recordToUnlock, setRecordToUnlock] = useState<RateLimitRecord | null>(null);

  // Fetch rate limit data
  const { data: rateLimits, isLoading, refetch } = useQuery({
    queryKey: ['admin-rate-limits'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rate_limits_for_admin');
      if (error) throw error;
      return data as RateLimitRecord[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Unlock mutation
  const unlockMutation = useMutation({
    mutationFn: async ({ email, type }: { email: string; type: string }) => {
      const { data, error } = await supabase.rpc('admin_unlock_rate_limit', {
        _email: email,
        _type: type
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rate-limits'] });
      toast.success('Account erfolgreich entsperrt');
      setUnlockDialogOpen(false);
      setRecordToUnlock(null);
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Entsperren: ' + error.message);
    },
  });

  // Filter logic
  const filteredRecords = rateLimits?.filter(record => {
    if (showOnlyLocked && !record.is_locked) return false;
    if (filterType !== 'all' && record.attempt_type !== filterType) return false;
    if (searchEmail && !record.email.toLowerCase().includes(searchEmail.toLowerCase())) return false;
    return true;
  });

  // Calculate statistics
  const stats = {
    totalLocked: rateLimits?.filter(r => r.is_locked).length || 0,
    loginAttempts: rateLimits?.filter(r => r.attempt_type === 'login').length || 0,
    signupAttempts: rateLimits?.filter(r => r.attempt_type === 'signup').length || 0,
    passwordResetAttempts: rateLimits?.filter(r => r.attempt_type === 'password_reset').length || 0,
  };

  const handleUnlock = (record: RateLimitRecord) => {
    setRecordToUnlock(record);
    setUnlockDialogOpen(true);
  };

  const confirmUnlock = () => {
    if (recordToUnlock) {
      unlockMutation.mutate({
        email: recordToUnlock.email,
        type: recordToUnlock.attempt_type
      });
    }
  };

  const getAttemptTypeLabel = (type: string) => {
    switch (type) {
      case 'login': return 'Login';
      case 'signup': return 'Registrierung';
      case 'password_reset': return 'Passwort Reset';
      default: return type;
    }
  };

  const getRowClassName = (record: RateLimitRecord) => {
    if (record.is_locked) return 'bg-destructive/10';
    if (record.failed_attempts >= 4) return 'bg-yellow-50 dark:bg-yellow-950/20';
    return '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShieldAlert className="h-8 w-8" />
                Rate Limits
              </h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie gesperrte Accounts und fehlgeschlagene Anmeldeversuche
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Aktualisieren
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gesperrt</p>
                    <p className="text-2xl font-bold text-destructive">{stats.totalLocked}</p>
                  </div>
                  <ShieldAlert className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Login Versuche</p>
                    <p className="text-2xl font-bold">{stats.loginAttempts}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Registrierungen</p>
                    <p className="text-2xl font-bold">{stats.signupAttempts}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Passwort Resets</p>
                    <p className="text-2xl font-bold">{stats.passwordResetAttempts}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label>Typ filtern</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Typ filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Typen</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="signup">Registrierung</SelectItem>
                      <SelectItem value="password_reset">Passwort Reset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <div>
                    <Label>Nur gesperrte</Label>
                    <div className="flex items-center h-10 gap-2">
                      <Switch
                        checked={showOnlyLocked}
                        onCheckedChange={setShowOnlyLocked}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label>E-Mail suchen</Label>
                  <Input
                    placeholder="E-Mail suchen..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Lädt...</p>
                  </div>
                </div>
              ) : filteredRecords && filteredRecords.length > 0 ? (
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Fehlversuche</TableHead>
                        <TableHead>Letzter Versuch</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verbleibend</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id} className={getRowClassName(record)}>
                          <TableCell className="font-medium">{record.email}</TableCell>
                          <TableCell>{getAttemptTypeLabel(record.attempt_type)}</TableCell>
                          <TableCell>
                            <Badge variant={record.failed_attempts >= 4 ? "destructive" : "outline"}>
                              {record.failed_attempts}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(record.last_attempt_at), {
                              addSuffix: true,
                              locale: de
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.is_locked ? "destructive" : "outline"}>
                              {record.is_locked ? 'Gesperrt' : 'Aktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.is_locked ? `${record.minutes_remaining} Min` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.is_locked && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnlock(record)}
                                disabled={unlockMutation.isPending}
                                className="gap-2"
                              >
                                <Unlock className="h-3 w-3" />
                                Entsperren
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Keine Rate Limit Einträge gefunden
                </div>
              )}

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-3">
                {filteredRecords?.map((record) => (
                  <Card key={record.id} className={getRowClassName(record)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm break-all">{record.email}</span>
                        <Badge variant={record.is_locked ? "destructive" : "outline"}>
                          {record.is_locked ? "Gesperrt" : "Aktiv"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Typ: {getAttemptTypeLabel(record.attempt_type)}</p>
                        <p>Versuche: {record.failed_attempts}</p>
                        <p>
                          Letzter Versuch:{' '}
                          {formatDistanceToNow(new Date(record.last_attempt_at), {
                            addSuffix: true,
                            locale: de
                          })}
                        </p>
                        {record.is_locked && (
                          <p className="font-medium text-destructive">
                            Noch {record.minutes_remaining} Minuten gesperrt
                          </p>
                        )}
                      </div>
                      {record.is_locked && (
                        <Button
                          size="sm"
                          className="w-full mt-3 gap-2"
                          onClick={() => handleUnlock(record)}
                          disabled={unlockMutation.isPending}
                        >
                          <Unlock className="h-3 w-3" />
                          Entsperren
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account entsperren?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Account <strong>{recordToUnlock?.email}</strong> für{' '}
              {recordToUnlock && getAttemptTypeLabel(recordToUnlock.attempt_type)} entsperren?
              <br />
              <br />
              Dies erlaubt dem Benutzer sofort, erneut Versuche zu unternehmen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlock}>
              Entsperren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRateLimits;
