import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { applyChangesToProfile, parseDescription } from '@/lib/changeRequestUtils';

interface ChangeRequest {
  id: string;
  profile_id: string;
  user_id: string | null;
  request_type: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string;
    city: string;
    canton: string;
    slug: string | null;
  } | null;
}

interface RequestMedia {
  id: string;
  request_id: string;
  storage_path: string;
  created_at: string;
  signedUrl?: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  text: 'Texte ändern',
  photos: 'Fotos ändern',
  contact: 'Kontaktdaten',
  categories: 'Kategorien',
  location: 'Standort ändern',
  other: 'Sonstiges',
  combined: 'Mehrere Bereiche',
};

// Note: parseDescription is now imported from changeRequestUtils

const FIELD_LABELS: Record<string, string> = {
  display_name: 'Name',
  about_me: 'Über mich',
  note: 'Anmerkung',
  canton: 'Kanton',
  city: 'Stadt',
  postal_code: 'PLZ',
  coordinates: 'Koordinaten',
  categories: 'Kategorien',
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  email: 'E-Mail',
  website: 'Website',
  telegram: 'Telegram',
  instagram: 'Instagram',
  delete_photos: 'Fotos löschen',
  reorder_photos: 'Reihenfolge',
  primary_photo: 'Hauptfoto',
  new_photos: 'Neue Fotos',
  photo_note: 'Foto-Anmerkung',
};

const AdminChangeRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [mediaUrls, setMediaUrls] = useState<Record<string, RequestMedia[]>>({});
  const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({});

  // Fetch change requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-change-requests', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('profile_change_requests')
        .select(`
          *,
          profiles:profile_id (
            display_name,
            city,
            canton,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ChangeRequest[];
    },
  });

  // Load media for photo requests
  const loadMediaForRequest = async (requestId: string) => {
    if (mediaUrls[requestId] || loadingMedia[requestId]) return;
    
    setLoadingMedia(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const { data: mediaData, error } = await supabase
        .from('change_request_media')
        .select('*')
        .eq('request_id', requestId);

      if (error) throw error;

      if (mediaData && mediaData.length > 0) {
        // Get signed URLs for each media
        const mediaWithUrls = await Promise.all(
          mediaData.map(async (media) => {
            const { data: signedData } = await supabase.storage
              .from('change-request-media')
              .createSignedUrl(media.storage_path, 3600);
            return {
              ...media,
              signedUrl: signedData?.signedUrl,
            };
          })
        );
        setMediaUrls(prev => ({ ...prev, [requestId]: mediaWithUrls }));
      } else {
        setMediaUrls(prev => ({ ...prev, [requestId]: [] }));
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoadingMedia(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Load media for photo requests when they appear
  useEffect(() => {
    if (requests) {
      requests
        .filter(r => r.request_type === 'photos')
        .forEach(r => loadMediaForRequest(r.id));
    }
  }, [requests]);

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      adminNote 
    }: { 
      requestId: string; 
      status: 'approved' | 'rejected'; 
      adminNote: string;
    }) => {
      // Find the request data
      const request = requests?.find(r => r.id === requestId);
      
      // Bei Genehmigung: Änderungen auf das Profil anwenden!
      if (status === 'approved' && request) {
        const result = await applyChangesToProfile(
          {
            id: request.id,
            profile_id: request.profile_id,
            description: request.description,
            request_type: request.request_type
          },
          mediaUrls
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Fehler beim Anwenden der Änderungen');
        }
      }

      // Update request status
      const { error } = await supabase
        .from('profile_change_requests')
        .update({ 
          status, 
          admin_note: adminNote || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries for immediate UI refresh
      queryClient.invalidateQueries({ queryKey: ['admin-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      
      toast({
        title: variables.status === 'approved' ? '✅ Genehmigt & Angewandt' : '❌ Abgelehnt',
        description: variables.status === 'approved' 
          ? 'Die Änderungen wurden auf das Profil übertragen.'
          : 'Die Anfrage wurde abgelehnt.',
      });
      
      // Clear the admin note for this request
      setAdminNotes(prev => {
        const updated = { ...prev };
        delete updated[variables.requestId];
        return updated;
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Aktualisieren',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Ausstehend
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            Genehmigt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Abgelehnt
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Änderungsanfragen</h1>
          <p className="text-muted-foreground mb-6">
            Prüfe und bearbeite Änderungsanfragen von aktiven Profilen
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="pending">Ausstehend</TabsTrigger>
              <TabsTrigger value="approved">Genehmigt</TabsTrigger>
              <TabsTrigger value="rejected">Abgelehnt</TabsTrigger>
              <TabsTrigger value="all">Alle</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !requests || requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Keine Anfragen in dieser Kategorie
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {REQUEST_TYPE_LABELS[request.request_type] || request.request_type}
                          {getStatusBadge(request.status)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {request.profiles ? (
                            <span className="flex items-center gap-2">
                              <strong>{request.profiles.display_name}</strong>
                              <span className="text-muted-foreground">
                                ({request.profiles.city}, {request.profiles.canton})
                              </span>
                              {request.profiles.slug && (
                                <Link 
                                  to={`/profil/${request.profiles.slug}`}
                                  target="_blank"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Profil
                                </Link>
                              )}
                            </span>
                          ) : (
                            'Profil nicht gefunden'
                          )}
                        </CardDescription>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {new Date(request.created_at).toLocaleDateString('de-CH', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* User description - handle combined format */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Anfrage des Users:
                      </p>
                      {(() => {
                        const changeGroups = parseDescription(request.description);
                        if (changeGroups) {
                          // New combined format
                          return (
                            <div className="space-y-3">
                              {changeGroups.map((group, groupIdx) => (
                                <div key={groupIdx} className="border-l-2 border-primary/30 pl-3">
                                  <p className="text-xs font-semibold text-primary mb-1">
                                    {REQUEST_TYPE_LABELS[group.type] || group.type}
                                  </p>
                                  <ul className="space-y-1">
                                    {group.changes.map((change, changeIdx) => (
                                      <li key={changeIdx} className="text-sm">
                                        <span className="font-medium">{FIELD_LABELS[change.field] || change.field}:</span>{' '}
                                        {change.old_value && (
                                          <>
                                            <span className="line-through text-muted-foreground">{change.old_value}</span>
                                            {' → '}
                                          </>
                                        )}
                                        <span className="text-primary">{change.new_value}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          // Legacy format or plain text
                          try {
                            const legacyChanges = JSON.parse(request.description);
                            if (Array.isArray(legacyChanges)) {
                              return (
                                <ul className="space-y-1">
                                  {legacyChanges.map((change: { field: string; old_value: string; new_value: string }, idx: number) => (
                                    <li key={idx} className="text-sm">
                                      <span className="font-medium">{FIELD_LABELS[change.field] || change.field}:</span>{' '}
                                      {change.old_value && (
                                        <>
                                          <span className="line-through text-muted-foreground">{change.old_value}</span>
                                          {' → '}
                                        </>
                                      )}
                                      <span className="text-primary">{change.new_value}</span>
                                    </li>
                                  ))}
                                </ul>
                              );
                            }
                          } catch {
                            // Not JSON, show as plain text
                          }
                          return <p className="text-sm whitespace-pre-wrap">{request.description}</p>;
                        }
                      })()}
                    </div>

                    {/* Media images for photo requests */}
                    {request.request_type === 'photos' && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Hochgeladene Bilder:
                        </p>
                        {loadingMedia[request.id] ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Lade Bilder...
                          </div>
                        ) : mediaUrls[request.id]?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {mediaUrls[request.id].map((media) => (
                              <a
                                key={media.id}
                                href={media.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={media.signedUrl}
                                  alt="Hochgeladenes Bild"
                                  className="h-24 w-24 object-cover rounded-lg border hover:border-primary transition-colors"
                                />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Keine Bilder hochgeladen
                          </p>
                        )}
                      </div>
                    )}

                    {/* Existing admin note (for already processed requests) */}
                    {request.admin_note && request.status !== 'pending' && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm font-medium mb-1">Admin-Antwort:</p>
                        <p className="text-sm">{request.admin_note}</p>
                      </div>
                    )}

                    {/* Admin response input for pending requests */}
                    {request.status === 'pending' && (
                      <div className="space-y-3 pt-2 border-t">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Antwort an User (optional):
                          </label>
                          <Textarea
                            placeholder="z.B. 'Änderung wurde übernommen' oder 'Abgelehnt weil...'"
                            value={adminNotes[request.id] || ''}
                            onChange={(e) => 
                              setAdminNotes(prev => ({ 
                                ...prev, 
                                [request.id]: e.target.value 
                              }))
                            }
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => 
                              updateStatusMutation.mutate({
                                requestId: request.id,
                                status: 'approved',
                                adminNote: adminNotes[request.id] || '',
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {updateStatusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Genehmigen
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => 
                              updateStatusMutation.mutate({
                                requestId: request.id,
                                status: 'rejected',
                                adminNote: adminNotes[request.id] || '',
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            {updateStatusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Ablehnen
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminChangeRequests;

