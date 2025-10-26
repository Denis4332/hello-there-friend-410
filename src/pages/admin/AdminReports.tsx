import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Ban, X, Check } from 'lucide-react';

interface ReportWithProfile {
  id: string;
  profile_id: string;
  reason: string;
  message: string | null;
  created_at: string;
  status: string;
  reporter_user_id: string | null;
  profile: {
    display_name: string;
    status: string;
    city: string;
    canton: string;
    age: number;
  };
}

const AdminReports = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportWithProfile | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToAction, setReportToAction] = useState<ReportWithProfile | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select(`
          *,
          profile:profiles(display_name, status, city, canton, age)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReportWithProfile[];
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast({ title: 'Meldung aktualisiert' });
    },
    onError: () => {
      toast({ title: 'Fehler', description: 'Meldung konnte nicht aktualisiert werden', variant: 'destructive' });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast({ title: 'Meldung gelöscht' });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Fehler', description: 'Meldung konnte nicht gelöscht werden', variant: 'destructive' });
    },
  });

  const suspendProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast({ title: 'Profil gesperrt', description: 'Das Profil wurde erfolgreich gesperrt' });
      setSuspendDialogOpen(false);
      if (reportToAction) {
        updateReportMutation.mutate({ id: reportToAction.id, status: 'closed' });
      }
    },
    onError: () => {
      toast({ title: 'Fehler', description: 'Profil konnte nicht gesperrt werden', variant: 'destructive' });
    },
  });

  const handleViewDetails = (report: ReportWithProfile) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };

  const handleSuspendProfile = (report: ReportWithProfile) => {
    setReportToAction(report);
    setSuspendDialogOpen(true);
  };

  const handleRejectReport = (report: ReportWithProfile) => {
    updateReportMutation.mutate({ id: report.id, status: 'closed' });
  };

  const handleMarkDone = (report: ReportWithProfile) => {
    updateReportMutation.mutate({ id: report.id, status: 'closed' });
  };

  const handleDeleteReport = (report: ReportWithProfile) => {
    setReportToAction(report);
    setDeleteDialogOpen(true);
  };

  const confirmSuspend = () => {
    if (reportToAction) {
      suspendProfileMutation.mutate(reportToAction.profile_id);
    }
  };

  const confirmDelete = () => {
    if (reportToAction) {
      deleteReportMutation.mutate(reportToAction.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">
              Meldungen {reports && `(${reports.length})`}
            </h1>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="open">Offen</SelectItem>
                <SelectItem value="closed">Erledigt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Profil</th>
                      <th className="text-left p-3 text-sm font-medium">Grund</th>
                      <th className="text-left p-3 text-sm font-medium">Kommentar</th>
                      <th className="text-left p-3 text-sm font-medium">Datum</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr key={report.id} className={`border-t hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="p-3">
                          <div className="font-medium">{report.profile.display_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {report.profile.city}, {report.profile.canton}
                          </div>
                        </td>
                        <td className="p-3 text-sm">{report.reason}</td>
                        <td className="p-3 text-sm max-w-xs truncate">
                          {report.message || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(report.created_at).toLocaleDateString('de-CH')}
                        </td>
                        <td className="p-3">
                          <Badge variant={report.status === 'open' ? 'destructive' : 'outline'}>
                            {report.status === 'open' ? 'Offen' : 'Erledigt'}
                          </Badge>
                          {report.profile.status === 'suspended' && (
                            <Badge variant="secondary" className="ml-2">Gesperrt</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.status === 'open' && report.profile.status !== 'suspended' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSuspendProfile(report)}
                                disabled={suspendProfileMutation.isPending}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Sperren
                              </Button>
                            )}
                            {report.status === 'open' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectReport(report)}
                                  disabled={updateReportMutation.isPending}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Ablehnen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkDone(report)}
                                  disabled={updateReportMutation.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Erledigt
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReport(report)}
                              disabled={deleteReportMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Keine Meldungen vorhanden
              </div>
            )}
          </div>

          <div className="bg-card border rounded-lg p-4 mt-4">
            <p className="text-sm">
              <strong>Hinweis:</strong> Hinweisen wird unverzüglich nachgegangen (Notice-&-Takedown). 
              Bei begründetem Verdacht werden Profile sofort gesperrt und geprüft.
            </p>
          </div>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Meldungs-Details</DialogTitle>
            <DialogDescription>
              Vollständige Informationen zur Meldung
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Gemeldetes Profil</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Name:</strong> {selectedReport.profile.display_name}</p>
                  <p><strong>Alter:</strong> {selectedReport.profile.age}</p>
                  <p><strong>Stadt:</strong> {selectedReport.profile.city}, {selectedReport.profile.canton}</p>
                  <p><strong>Status:</strong> {selectedReport.profile.status}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Meldung</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Grund:</strong> {selectedReport.reason}</p>
                  <p className="mt-2"><strong>Nachricht:</strong></p>
                  <p className="whitespace-pre-wrap">{selectedReport.message || 'Keine Nachricht'}</p>
                  <p className="mt-2"><strong>Datum:</strong> {new Date(selectedReport.created_at).toLocaleString('de-CH')}</p>
                  <p><strong>Status:</strong> {selectedReport.status === 'open' ? 'Offen' : 'Erledigt'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profil sperren?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Profil "{reportToAction?.profile.display_name}" wird gesperrt und ist nicht mehr öffentlich sichtbar. 
              Die Meldung wird automatisch als erledigt markiert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={suspendProfileMutation.isPending}
            >
              {suspendProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Profil sperren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Meldung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Meldung wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteReportMutation.isPending}
            >
              {deleteReportMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReports;
