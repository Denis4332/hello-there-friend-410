import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AdminPendingPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch pending banner payments
  const { data: pendingBanners, isLoading: loadingBanners } = useQuery({
    queryKey: ['pending-banner-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending profile payments
  const { data: pendingProfiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['pending-profile-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Mark banner as paid
  const markBannerPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('advertisements')
        .update({
          payment_status: 'paid',
          active: true,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-banner-payments'] });
      toast({
        title: 'Banner aktiviert',
        description: 'Banner wurde als bezahlt markiert und aktiviert.',
      });
      setProcessingId(null);
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Aktivieren: ${error.message}`,
        variant: 'destructive',
      });
      setProcessingId(null);
    },
  });

  // Mark profile as paid
  const markProfilePaid = useMutation({
    mutationFn: async ({ id, listingType }: { id: string; listingType: string }) => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const updateData: any = {
        payment_status: 'paid',
        listing_type: listingType,
      };

      if (listingType === 'premium') {
        updateData.premium_until = expiryDate.toISOString();
      } else if (listingType === 'top') {
        updateData.top_ad_until = expiryDate.toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-profile-payments'] });
      toast({
        title: 'Profil aktiviert',
        description: 'Profile Upgrade wurde als bezahlt markiert und aktiviert.',
      });
      setProcessingId(null);
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Aktivieren: ${error.message}`,
        variant: 'destructive',
      });
      setProcessingId(null);
    },
  });

  // Cancel payment
  const cancelPayment = useMutation({
    mutationFn: async ({ type, id }: { type: 'banner' | 'profile'; id: string }) => {
      const table = type === 'banner' ? 'advertisements' : 'profiles';
      const { error } = await supabase
        .from(table)
        .update({ payment_status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.type === 'banner' ? ['pending-banner-payments'] : ['pending-profile-payments'];
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Zahlung storniert',
        description: 'Zahlung wurde erfolgreich storniert.',
      });
      setProcessingId(null);
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: `Fehler beim Stornieren: ${error.message}`,
        variant: 'destructive',
      });
      setProcessingId(null);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodBadge = (method: string | null) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      bank_transfer: { label: 'Banküberweisung', variant: 'default' },
      twint: { label: 'TWINT', variant: 'secondary' },
      manual: { label: 'Manuell', variant: 'outline' },
    };

    const config = variants[method || 'manual'] || variants.manual;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ausstehende Zahlungen</h1>
        <p className="text-muted-foreground">Verwalte ausstehende Banner- und Profil-Zahlungen</p>
      </div>

      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banners">
            Banner ({pendingBanners?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="profiles">
            Profile ({pendingProfiles?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-4">
          {loadingBanners ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingBanners?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine ausstehenden Banner-Zahlungen
              </CardContent>
            </Card>
          ) : (
            pendingBanners?.map((banner) => (
              <Card key={banner.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{banner.title}</span>
                    {getPaymentMethodBadge(banner.payment_method)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Position:</span>
                      <p className="font-medium capitalize">{banner.position}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Preis/Tag:</span>
                      <p className="font-medium">CHF {banner.price_per_day}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gewünschte Laufzeit:</span>
                      <p className="font-medium">
                        {banner.requested_duration === 'day' && '1 Tag'}
                        {banner.requested_duration === 'week' && '1 Woche'}
                        {banner.requested_duration === 'month' && '1 Monat'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">E-Mail:</span>
                      <p className="font-medium">
                        <a href={`mailto:${banner.contact_email}`} className="text-primary hover:underline">
                          {banner.contact_email}
                        </a>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telefon:</span>
                      <p className="font-medium">
                        <a href={`tel:${banner.contact_phone}`} className="text-primary hover:underline">
                          {banner.contact_phone}
                        </a>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Referenz:</span>
                      <p className="font-mono text-xs">{banner.payment_reference || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Erstellt:</span>
                      <p>{formatDate(banner.created_at)}</p>
                    </div>
                  </div>

                  {banner.image_url && (
                    <div>
                      <img 
                        src={banner.image_url} 
                        alt={banner.title}
                        className="w-full max-w-md rounded-lg border"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setProcessingId(banner.id);
                        markBannerPaid.mutate(banner.id);
                      }}
                      disabled={processingId === banner.id}
                      className="flex-1"
                    >
                      {processingId === banner.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Als bezahlt markieren
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setProcessingId(banner.id);
                        cancelPayment.mutate({ type: 'banner', id: banner.id });
                      }}
                      disabled={processingId === banner.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Stornieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          {loadingProfiles ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingProfiles?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine ausstehenden Profil-Zahlungen
              </CardContent>
            </Card>
          ) : (
            pendingProfiles?.map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{profile.display_name}</span>
                    {getPaymentMethodBadge(profile.payment_method)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stadt:</span>
                      <p className="font-medium">{profile.city}, {profile.canton}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gewünschtes Paket:</span>
                      <p className="font-medium capitalize">{profile.listing_type || 'basic'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Referenz:</span>
                      <p className="font-mono text-xs">{profile.payment_reference || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Erstellt:</span>
                      <p>{formatDate(profile.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setProcessingId(profile.id);
                        markProfilePaid.mutate({ 
                          id: profile.id, 
                          listingType: profile.listing_type || 'basic' 
                        });
                      }}
                      disabled={processingId === profile.id}
                      className="flex-1"
                    >
                      {processingId === profile.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Als bezahlt markieren
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setProcessingId(profile.id);
                        cancelPayment.mutate({ type: 'profile', id: profile.id });
                      }}
                      disabled={processingId === profile.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Stornieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
