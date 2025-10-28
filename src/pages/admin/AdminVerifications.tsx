import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useVerifications } from '@/hooks/useVerifications';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle } from 'lucide-react';

const AdminVerifications = () => {
  const { verifications, isLoading, approve, reject, isApproving, isRejecting } = useVerifications();
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState('');

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

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Verifizierungen prüfen</h1>

          <div className="bg-card border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Lade Verifizierungen...</p>
              </div>
            ) : verifications && verifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Keine offenen Verifizierungen
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Vorschau</th>
                      <th className="text-left p-3 text-sm font-medium">Profil</th>
                      <th className="text-left p-3 text-sm font-medium">Stadt</th>
                      <th className="text-left p-3 text-sm font-medium">Eingereicht</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications?.map((verification, index) => (
                      <tr key={verification.id} className={`border-t hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
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
        </div>
      </main>
    </div>
  );
};

export default AdminVerifications;
