import { useState, useEffect, useMemo } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Flame, Star, User, RefreshCw, Clock, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProfileData {
  id: string;
  display_name: string;
  listing_type: string;
  city: string;
  canton: string;
}

const AdminTierDashboard = () => {
  const [pageSize, setPageSize] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);
  const [customSeed, setCustomSeed] = useState<number | null>(null);
  
  // Calculate rotation key (same logic as useRotationKey)
  const getRotationKey = () => Math.floor(Date.now() / (30 * 60 * 1000));
  const [rotationKey, setRotationKey] = useState(getRotationKey);
  
  // Time until next rotation
  const [timeUntilRotation, setTimeUntilRotation] = useState('');
  
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const rotationInterval = 30 * 60 * 1000; // 30 minutes
      const nextRotation = Math.ceil(now / rotationInterval) * rotationInterval;
      const remaining = nextRotation - now;
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeUntilRotation(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
      // Check if rotation happened
      const newKey = getRotationKey();
      if (newKey !== rotationKey) {
        setRotationKey(newKey);
        setCustomSeed(null); // Reset custom seed on natural rotation
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
        .select('listing_type')
        .eq('status', 'active');
      
      const counts = { top: 0, premium: 0, basic: 0, total: 0 };
      profiles?.forEach(p => {
        counts.total++;
        if (p.listing_type === 'top') counts.top++;
        else if (p.listing_type === 'premium') counts.premium++;
        else counts.basic++;
      });
      return counts;
    },
    refetchInterval: 30000,
  });
  
  // Fetch paginated profiles
  const { data: paginatedData, isLoading, refetch } = useQuery({
    queryKey: ['tier-dashboard-profiles', currentPage, pageSize, effectiveSeed],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_paginated_profiles', {
        p_page: currentPage,
        p_page_size: pageSize,
        p_rotation_seed: effectiveSeed,
      });
      
      if (error) throw error;
      
      const result = data?.[0];
      const profilesArray = Array.isArray(result?.profiles) ? result.profiles : [];
      return {
        profiles: profilesArray as unknown as ProfileData[],
        totalCount: result?.total_count || 0,
      };
    },
  });
  
  const profiles = paginatedData?.profiles || [];
  const totalCount = paginatedData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Calculate tier distribution on current page
  const pageTierCounts = useMemo(() => {
    const counts = { top: 0, premium: 0, basic: 0 };
    profiles.forEach(p => {
      if (p.listing_type === 'top') counts.top++;
      else if (p.listing_type === 'premium') counts.premium++;
      else counts.basic++;
    });
    return counts;
  }, [profiles]);
  
  const handleSeedChange = () => {
    setCustomSeed(prev => (prev ?? rotationKey) + 1);
  };
  
  const resetSeed = () => {
    setCustomSeed(null);
  };
  
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

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Layers className="h-8 w-8 text-primary" />
                Tier-Monitor
              </h1>
              <p className="text-muted-foreground mt-1">
                Live-Überwachung der Tier-Verteilung und Rotation
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Rotation Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Rotation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeUntilRotation}</div>
                <p className="text-xs text-muted-foreground">
                  Seed: {effectiveSeed}
                  {customSeed !== null && (
                    <span className="text-orange-500 ml-1">(manuell)</span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            {/* TOP Count */}
            <Card className="border-orange-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  TOP Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{tierCounts?.top || 0}</div>
                <Progress 
                  value={tierCounts ? (tierCounts.top / tierCounts.total) * 100 : 0} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            {/* Premium Count */}
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Premium Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{tierCounts?.premium || 0}</div>
                <Progress 
                  value={tierCounts ? (tierCounts.premium / tierCounts.total) * 100 : 0} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
            
            {/* Basic Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tierCounts?.basic || 0}</div>
                <Progress 
                  value={tierCounts ? (tierCounts.basic / tierCounts.total) * 100 : 0} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Seitengrösse:</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-3">
                    Seite {currentPage} von {totalPages || 1}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="outline" size="sm" onClick={handleSeedChange}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Seed wechseln
                  </Button>
                  {customSeed !== null && (
                    <Button variant="ghost" size="sm" onClick={resetSeed}>
                      Zurücksetzen
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Page Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Seite {currentPage} Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-bold text-orange-500">{pageTierCounts.top}</span>
                  <span className="text-muted-foreground">TOP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold text-yellow-500">{pageTierCounts.premium}</span>
                  <span className="text-muted-foreground">Premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-bold">{pageTierCounts.basic}</span>
                  <span className="text-muted-foreground">Basic</span>
                </div>
                <div className="text-muted-foreground ml-auto">
                  {profiles.length} von {totalCount} Profilen
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile auf Seite {currentPage}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Keine Profile gefunden
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {profiles.map((profile, index) => (
                    <div 
                      key={profile.id}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${profile.listing_type === 'top' ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-950/20' : ''}
                        ${profile.listing_type === 'premium' ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20' : ''}
                        ${profile.listing_type === 'basic' ? 'border-border bg-card' : ''}
                      `}
                    >
                      {/* Position Number */}
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {(currentPage - 1) * pageSize + index + 1}
                      </div>
                      
                      {/* Tier Icon */}
                      <div className="flex justify-end mb-2">
                        {getTierIcon(profile.listing_type)}
                      </div>
                      
                      {/* Name */}
                      <div className="text-sm font-medium truncate" title={profile.display_name}>
                        {profile.display_name}
                      </div>
                      
                      {/* Location */}
                      <div className="text-xs text-muted-foreground truncate">
                        {profile.city}
                      </div>
                      
                      {/* Tier Badge */}
                      <div className="mt-2">
                        {getTierBadge(profile.listing_type)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTierDashboard;
