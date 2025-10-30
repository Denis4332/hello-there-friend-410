import { useState, useMemo } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useVerifications } from '@/hooks/useVerifications';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Check, X } from 'lucide-react';

const AdminVerifications = () => {
  const { verifications, isLoading, approve, reject, isApproving, isRejecting } = useVerifications();
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [selectedVerifications, setSelectedVerifications] = useState<string[]>([]);
  const [filterNew, setFilterNew] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'profile'>('date');

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('verification-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleApprove = () => {
    if (!selectedVerification) return;
    approve({ 
      submissionId: selectedVerification.id, 
      profileId: selectedVerification.profile_id 
    });
    setSelectedVerification(null);
  };

  const handleReject = () => {
    if (!selectedVerification) return;
    reject({ 
      submissionId: selectedVerification.id, 
      note: rejectNote 
    });
    setSelectedVerification(null);
    setRejectNote('');
  };

  const handleSelectAll = () => {
    if (selectedVerifications.length === filteredVerifications.length) {
      setSelectedVerifications([]);
    } else {
      setSelectedVerifications(filteredVerifications.map(v => v.id));
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedVerifications(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    selectedVerifications.forEach(id => {
      const verification = verifications?.find(v => v.id === id);
      if (verification) {
        approve({ submissionId: id, profileId: verification.profile_id });
      }
    });
    setSelectedVerifications([]);
  };

  const handleBulkReject = () => {
    selectedVerifications.forEach(id => {
      reject({ submissionId: id });
    });
    setSelectedVerifications([]);
  };

  const filteredVerifications = useMemo(() => {
    let filtered = verifications || [];
    
    if (filterNew) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter(v => new Date(v.submitted_at) > yesterday);
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
      return (a.profiles?.display_name || '').localeCompare(b.profiles?.display_name || '');
    });
  }, [verifications, filterNew, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Verifizierungen prüfen</h1>
            <div className="flex gap-2">
              <Button
                variant={filterNew ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterNew(!filterNew)}
              >
                Nur neue (&lt;24h)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === 'date' ? 'profile' : 'date')}
              >
                Sort: {sortBy === 'date' ? 'Datum' : 'Profil'}
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Lade Verifizierungen...</p>
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {filterNew ? 'Keine neuen Verifizierungen' : 'Keine offenen Verifizierungen'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium w-12">
                        <Checkbox
                          checked={selectedVerifications.length === filteredVerifications.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left p-3 text-sm font-medium">Vorschau</th>
                      <th className="text-left p-3 text-sm font-medium">Profil</th>
                      <th className="text-left p-3 text-sm font-medium">Stadt</th>
                      <th className="text-left p-3 text-sm font-medium">Eingereicht</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVerifications.map((verification, index) => (
                      <tr key={verification.id} className={`border-t hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="p-3">
                          <Checkbox
                            checked={selectedVerifications.includes(verification.id)}
                            onCheckedChange={() => handleToggleSelection(verification.id)}
                          />
                        </td>
                        <td className="p-3">
                          <img
                            src={getPhotoUrl(verification.storage_path)}
                            alt="Verifizierung"
                            className="w-16 h-16 object-cover rounded"
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{verification.profiles?.display_name}</span>
                        </td>
                        <td className="p-3 text-sm">{verification.profiles?.city}</td>
                        <td className="p-3 text-sm">
                          {new Date(verification.submitted_at).toLocaleDateString('de-CH')}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{verification.status}</Badge>
                        </td>
                        <td className="p-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedVerification(verification)}
                              >
                                Prüfen
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Verifizierung prüfen: {selectedVerification?.profiles?.display_name}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedVerification && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Verifizierungsfoto</label>
                                    <img
                                      src={getPhotoUrl(selectedVerification.storage_path)}
                                      alt="Verifizierung"
                                      className="w-full rounded-lg"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Profil</label>
                                      <p>{selectedVerification.profiles?.display_name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Stadt</label>
                                      <p>{selectedVerification.profiles?.city}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-1">Ablehnungsgrund (optional)</label>
                                    <Textarea
                                      rows={3}
                                      placeholder="Warum wird diese Verifizierung abgelehnt?"
                                      value={rejectNote}
                                      onChange={(e) => setRejectNote(e.target.value)}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="destructive"
                                      className="flex-1"
                                      onClick={handleReject}
                                      disabled={isRejecting || isApproving}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Ablehnen
                                    </Button>
                                    <Button
                                      className="flex-1"
                                      onClick={handleApprove}
                                      disabled={isRejecting || isApproving}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Verifizieren
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedVerifications.length > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border rounded-lg shadow-lg p-4 z-50 flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedVerifications.length} ausgewählt
              </span>
              <Button
                onClick={handleBulkApprove}
                disabled={isApproving}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Alle genehmigen
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={isRejecting}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Alle ablehnen
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedVerifications([])}
              >
                Abbrechen
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminVerifications;
