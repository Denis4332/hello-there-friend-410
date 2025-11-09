import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/analytics/KPICard';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { ProfileViewsTable } from '@/components/analytics/ProfileViewsTable';
import { RealtimeEventFeed } from '@/components/analytics/RealtimeEventFeed';
import { useAnalyticsStats } from '@/hooks/useAnalyticsStats';
import { useProfileViewStats } from '@/hooks/useProfileViewStats';
import { useSearchQueries } from '@/hooks/useSearchQueries';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { useExportCSV } from '@/hooks/useExportCSV';
import {
  Eye,
  Search,
  Users,
  Activity,
  Download,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stats, isLoading: statsLoading } = useAnalyticsStats();
  const { data: profileViews, isLoading: profileViewsLoading } = useProfileViewStats(20);
  const { data: searchData, isLoading: searchLoading } = useSearchQueries(100);
  const { recentEvents, activeUsersCount } = useRealtimeAnalytics();
  const { exportToCSV } = useExportCSV();

  const handleExportProfileViews = () => {
    if (profileViews) {
      exportToCSV(profileViews, 'profile_views');
      toast.success('Profile Views exportiert');
    }
  };

  const handleExportSearchQueries = () => {
    if (searchData) {
      exportToCSV(searchData.recentQueries, 'search_queries');
      toast.success('Search Queries exportiert');
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Lade Analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="profiles">Profile Analytics</TabsTrigger>
            <TabsTrigger value="search">Search Analytics</TabsTrigger>
            <TabsTrigger value="realtime">Real-Time</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Page Views (24h)"
                value={stats?.totalViews24h || 0}
                icon={Eye}
                description="Letzte 24 Stunden"
              />
              <KPICard
                title="Suchen (24h)"
                value={stats?.totalSearches24h || 0}
                icon={Search}
                description="Letzte 24 Stunden"
              />
              <KPICard
                title="Aktive Profile"
                value={stats?.activeProfiles || 0}
                icon={Users}
                description={`von ${stats?.totalProfiles || 0} gesamt`}
              />
              <KPICard
                title="Events (24h)"
                value={stats?.totalEvents24h || 0}
                icon={Activity}
                description="Alle Events"
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Page Views Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart
                    data={[
                      { name: '24h', views: stats?.totalViews24h || 0 },
                      { name: '7d', views: stats?.totalViews7d || 0 },
                      { name: '30d', views: stats?.totalViews30d || 0 },
                    ]}
                    type="line"
                    dataKey="views"
                    xKey="name"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suchen Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsChart
                    data={[
                      { name: '24h', searches: stats?.totalSearches24h || 0 },
                      { name: '7d', searches: stats?.totalSearches7d || 0 },
                      { name: '30d', searches: stats?.totalSearches30d || 0 },
                    ]}
                    type="bar"
                    dataKey="searches"
                    xKey="name"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Top Profile nach Views</h2>
              <Button
                onClick={handleExportProfileViews}
                variant="outline"
                size="sm"
                disabled={profileViewsLoading || !profileViews}
                aria-label="Export profile views as CSV"
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Export CSV
              </Button>
            </div>

            {profileViewsLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Lade Profil-Statistiken...</p>
              </div>
            ) : (
              <ProfileViewsTable data={profileViews || []} />
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Such-Analysen</h2>
              <Button
                onClick={handleExportSearchQueries}
                variant="outline"
                size="sm"
                disabled={searchLoading || !searchData}
                aria-label="Export search queries as CSV"
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Export CSV
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <KPICard
                title="Durchschnitt Resultate"
                value={searchData?.avgResultsCount || 0}
                icon={TrendingUp}
                description="Pro Suche"
              />
              <KPICard
                title="Top Keywords"
                value={searchData?.topKeywords.length || 0}
                icon={Search}
                description="Einzigartige Begriffe"
              />
              <KPICard
                title="Top Kantone"
                value={searchData?.topCantons.length || 0}
                icon={Users}
                description="Gesuchte Regionen"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Suchbegriffe</CardTitle>
                </CardHeader>
                <CardContent>
                  {searchLoading ? (
                    <p className="text-muted-foreground">Lädt...</p>
                  ) : (
                    <AnalyticsChart
                      data={searchData?.topKeywords || []}
                      type="bar"
                      dataKey="count"
                      xKey="keyword"
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Kantone</CardTitle>
                </CardHeader>
                <CardContent>
                  {searchLoading ? (
                    <p className="text-muted-foreground">Lädt...</p>
                  ) : (
                    <AnalyticsChart
                      data={searchData?.topCantons || []}
                      type="pie"
                      dataKey="count"
                      xKey="canton"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <h2 className="text-2xl font-bold">Real-Time Monitoring</h2>
            <RealtimeEventFeed events={recentEvents} activeUsersCount={activeUsersCount} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminAnalytics;
