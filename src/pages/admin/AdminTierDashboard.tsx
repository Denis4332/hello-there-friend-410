import { useState, useEffect, useMemo } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Flame, Star, User, RefreshCw, Clock, ChevronLeft, ChevronRight, Layers, LayoutGrid, List, ExternalLink, CheckCircle, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface ProfileData {
  id: string;
  display_name: string;
  listing_type: string;
  city: string;
  canton: string;
  status: string;
  verified_at: string | null;
  created_at: string | null;
  slug: string | null;
}

interface PhotoData {
  profile_id: string;
  storage_path: string;
}

const AdminTierDashboard = () => {
  const [pageSize, setPageSize] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);
  const [customSeed, setCustomSeed] = useState<number | null>(null);
  const [tierFilter, setTierFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const getRotationKey = () => Math.floor(Date.now() / (30 * 60 * 1000));
  const [rotationKey, setRotationKey] = useState(getRotationKey);
  const [timeUntilRotation, setTimeUntilRotation] = useState('');
  
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const rotationInterval = 30 * 60 * 1000;
      const nextRotation = Math.ceil(now / rotationInterval) * rotationInterval;
      const remaining = nextRotation - now;
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeUntilRotation(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
      const newKey = getRotationKey();
      if (newKey !== rotationKey) {
        setRotationKey(newKey);
        setCustomSeed(null);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [rotationKey]);
  
  const effectiveSeed = customSeed ?? rotationKey;
  
  // Fetch tier counts
  const { data: tierCounts } = useQuery({
    queryKey: ['tier-counts'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('listing_type, status');
      
      const counts = { top: 0, premium: 0, basic: 0, total: 0, active: 0, pending: 0 };
      profiles?.forEach(p => {
        counts.total++;
        if (p.status === 'active') counts.active++;
        if (p.status === 'pending') counts.pending++;
        if (p.listing_type === 'top') counts.top++;
        else if (p.listing_type === 'premium') counts.premium++;
        else counts.basic++;
      });
      return counts;
    },
    refetchInterval: 30000,
  });
  
  // Fetch ALL profiles for admin (not using RPC, direct query for full control)
  const { data: allProfiles, isLoading, refetch } = useQuery({
    queryKey: ['tier-dashboard-all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, listing_type, city, canton, status, verified_at, created_at, slug')
        .order('listing_type', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as ProfileData[];
    },
    refetchInterval: 60000,
  });

  // Fetch primary photos for all profiles
  const { data: profilePhotos } = useQuery({
    queryKey: ['tier-dashboard-photos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('photos')
        .select('profile_id, storage_path')
        .eq('is_primary', true);
      return (data || []) as PhotoData[];
    },
    refetchInterval: 60000,
  });

  const photoMap = useMemo(() => {
    const map = new Map<string, string>();
    profilePhotos?.forEach(p => {
      if (!map.has(p.profile_id)) {
        map.set(p.profile_id, p.storage_path);
      }
    });
    return map;
  }, [profilePhotos]);

  const getPhotoUrl = (profileId: string) => {
    const path = photoMap.get(profileId);
    if (!path) return null;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data?.publicUrl || null;
  };
  
  // Filter profiles by tier
  const filteredProfiles = useMemo(() => {
    if (!allProfiles) return [];
    if (tierFilter === 'all') return allProfiles;
    return allProfiles.filter(p => p.listing_type === tierFilter);
  }, [allProfiles, tierFilter]);

  // Paginate
  const totalCount = filteredProfiles.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const paginatedProfiles = useMemo(() => {
    if (pageSize === 0) return filteredProfiles; // Show all
    const start = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(start, start + pageSize);
  }, [filteredProfiles, currentPage, pageSize]);

  // Paginated tier counts
  const pageTierCounts = useMemo(() => {
    const counts = { top: 0, premium: 0, basic: 0 };
    paginatedProfiles.forEach(p => {
      if (p.listing_type === 'top') counts.top++;
      else if (p.listing_type === 'premium') counts.premium++;
      else counts.basic++;
    });
    return counts;
  }, [paginatedProfiles]);
  
  const handleSeedChange = () => setCustomSeed(prev => (prev ?? rotationKey) + 1);
  const resetSeed = () => setCustomSeed(null);
  
  const getTierIcon = (type: string) => {
    switch (type) {
      case 'top': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'premium': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getTierBadge = (type: string) => {
    switch (type) {
      case 'top': return <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">TOP</Badge>;
      case 'premium': return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">Premium</Badge>;
      default: return <Badge variant="secondary">Basic</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Aktiv</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Ausstehend</Badge>;
      case 'draft': return <Badge className="bg-muted text-muted-foreground">Entwurf</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Layers className="h-8 w-8 text-primary" />
                Tier-Monitor
              </h1>
              <p className="text-muted-foreground mt-1">
                Alle Profile – Tier-Verteilung und Rotation
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Rotation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeUntilRotation}</div>
                <p className="text-xs text-muted-foreground">
                  Seed: {effectiveSeed}
                  {customSeed !== null && <span className="text-orange-500 ml-1">(manuell)</span>}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" /> TOP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{tierCounts?.top || 0}</div>
                <Progress value={tierCounts ? (tierCounts.top / tierCounts.total) * 100 : 0} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" /> Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{tierCounts?.premium || 0}</div>
                <Progress value={tierCounts ? (tierCounts.premium / tierCounts.total) * 100 : 0} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" /> Basic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tierCounts?.basic || 0}</div>
                <Progress value={tierCounts ? (tierCounts.basic / tierCounts.total) * 100 : 0} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tierCounts?.total || 0}</div>
                <p className="text-xs text-muted-foreground">{tierCounts?.active || 0} aktiv</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{tierCounts?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">warten auf Freigabe</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Tier Filter Tabs */}
                <Tabs value={tierFilter} onValueChange={(v) => { setTierFilter(v); setCurrentPage(1); }}>
                  <TabsList>
                    <TabsTrigger value="all">Alle</TabsTrigger>
                    <TabsTrigger value="top" className="gap-1">
                      <Flame className="h-3 w-3" /> TOP
                    </TabsTrigger>
                    <TabsTrigger value="premium" className="gap-1">
                      <Star className="h-3 w-3" /> Premium
                    </TabsTrigger>
                    <TabsTrigger value="basic" className="gap-1">
                      <User className="h-3 w-3" /> Basic
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* View Toggle */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Page Size */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Anzeigen:</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="0">Alle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Pagination */}
                {pageSize > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* Seed Controls */}
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="outline" size="sm" onClick={handleSeedChange}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Seed wechseln
                  </Button>
                  {customSeed !== null && (
                    <Button variant="ghost" size="sm" onClick={resetSeed}>Zurücksetzen</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Summary */}
          <div className="flex items-center gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-orange-500">{pageTierCounts.top}</span> TOP
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-yellow-500">{pageTierCounts.premium}</span> Premium
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">{pageTierCounts.basic}</span> Basic
            </div>
            <span className="text-muted-foreground ml-auto">
              {paginatedProfiles.length} von {totalCount} Profilen
            </span>
          </div>
          
          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : paginatedProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Keine Profile gefunden
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {paginatedProfiles.map((profile, index) => {
                const photoUrl = getPhotoUrl(profile.id);
                const position = pageSize === 0 ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                return (
                  <Link
                    key={profile.id}
                    to={`/admin/profile?id=${profile.id}`}
                    className={`
                      relative rounded-lg border-2 transition-all hover:shadow-md block overflow-hidden
                      ${profile.listing_type === 'top' ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/20' : ''}
                      ${profile.listing_type === 'premium' ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20' : ''}
                      ${profile.listing_type === 'basic' ? 'border-border bg-card' : ''}
                    `}
                  >
                    {/* Position */}
                    <div className="absolute top-1 left-1 z-10 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {position}
                    </div>
                    
                    {/* Verified Badge */}
                    {profile.verified_at && (
                      <div className="absolute top-1 right-1 z-10">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}

                    {/* Photo */}
                    <div className="w-full h-20 bg-muted flex items-center justify-center overflow-hidden">
                      {photoUrl ? (
                        <img src={photoUrl} alt={profile.display_name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <div className="text-sm font-medium truncate" title={profile.display_name}>
                        {profile.display_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {profile.city}, {profile.canton}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 gap-1">
                        {getTierBadge(profile.listing_type)}
                        {getStatusBadge(profile.status)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-12">Bild</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stadt</TableHead>
                      <TableHead>Kanton</TableHead>
                      <TableHead>Verifiziert</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProfiles.map((profile, index) => {
                      const photoUrl = getPhotoUrl(profile.id);
                      const position = pageSize === 0 ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                      return (
                        <TableRow key={profile.id}>
                          <TableCell className="font-bold text-muted-foreground">{position}</TableCell>
                          <TableCell>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                              {photoUrl ? (
                                <img src={photoUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <User className="h-4 w-4 text-muted-foreground/50" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{profile.display_name}</TableCell>
                          <TableCell>{getTierBadge(profile.listing_type)}</TableCell>
                          <TableCell>{getStatusBadge(profile.status)}</TableCell>
                          <TableCell>{profile.city}</TableCell>
                          <TableCell>{profile.canton}</TableCell>
                          <TableCell>
                            {profile.verified_at ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {profile.created_at ? new Date(profile.created_at).toLocaleDateString('de-CH') : '—'}
                          </TableCell>
                          <TableCell>
                            <Link to={`/admin/profile?id=${profile.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminTierDashboard;
