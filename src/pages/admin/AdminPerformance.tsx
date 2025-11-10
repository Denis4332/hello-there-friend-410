import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getWebVitalsData, clearWebVitalsData } from '@/utils/webVitals';
import { Activity, Smartphone, Monitor, Tablet, Trash2, TrendingUp } from 'lucide-react';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: string;
  timestamp: number;
}

const AdminPerformance = () => {
  const [mobileData, setMobileData] = useState<WebVitalMetric[]>([]);
  const [desktopData, setDesktopData] = useState<WebVitalMetric[]>([]);
  const [tabletData, setTabletData] = useState<WebVitalMetric[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMobileData(getWebVitalsData('mobile'));
    setDesktopData(getWebVitalsData('desktop'));
    setTabletData(getWebVitalsData('tablet'));
  };

  const handleClearData = () => {
    if (confirm('Möchten Sie wirklich alle Performance-Daten löschen?')) {
      clearWebVitalsData();
      loadData();
    }
  };

  // Aggregate metrics by name
  const getAggregatedMetrics = (data: WebVitalMetric[]) => {
    const grouped = data.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { values: [], ratings: [] };
      }
      acc[metric.name].values.push(metric.value);
      acc[metric.name].ratings.push(metric.rating);
      return acc;
    }, {} as Record<string, { values: number[]; ratings: string[] }>);

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      avg: Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length),
      min: Math.round(Math.min(...data.values)),
      max: Math.round(Math.max(...data.values)),
      count: data.values.length,
      goodCount: data.ratings.filter(r => r === 'good').length,
      needsImprovementCount: data.ratings.filter(r => r === 'needs-improvement').length,
      poorCount: data.ratings.filter(r => r === 'poor').length,
    }));
  };

  // Prepare trend data for charts
  const getTrendData = (deviceData: WebVitalMetric[], metricName: string) => {
    return deviceData
      .filter(m => m.name === metricName)
      .slice(-10) // Last 10 measurements
      .map((m, idx) => ({
        index: idx + 1,
        value: Math.round(m.value),
        rating: m.rating,
      }));
  };

  // Device distribution
  const deviceDistribution = [
    { name: 'Mobile', value: mobileData.length, icon: Smartphone },
    { name: 'Desktop', value: desktopData.length, icon: Monitor },
    { name: 'Tablet', value: tabletData.length, icon: Tablet },
  ].filter(d => d.value > 0);

  const COLORS = {
    mobile: 'hsl(var(--primary))',
    desktop: 'hsl(var(--accent))',
    tablet: 'hsl(var(--secondary))',
    good: '#22c55e',
    'needs-improvement': '#f59e0b',
    poor: '#ef4444',
  };

  const getRatingColor = (rating: string) => {
    return COLORS[rating as keyof typeof COLORS] || COLORS.good;
  };

  const getMetricThreshold = (metricName: string) => {
    const thresholds: Record<string, { good: number; poor: number; unit: string }> = {
      LCP: { good: 2500, poor: 4000, unit: 'ms' },
      FCP: { good: 1800, poor: 3000, unit: 'ms' },
      CLS: { good: 0.1, poor: 0.25, unit: '' },
      INP: { good: 200, poor: 500, unit: 'ms' },
      TTFB: { good: 800, poor: 1800, unit: 'ms' },
    };
    return thresholds[metricName] || { good: 100, poor: 300, unit: 'ms' };
  };

  const mobileMetrics = getAggregatedMetrics(mobileData);
  const desktopMetrics = getAggregatedMetrics(desktopData);
  const tabletMetrics = getAggregatedMetrics(tabletData);

  const allMetrics = [...mobileData, ...desktopData, ...tabletData];
  const hasData = allMetrics.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 p-6 bg-muted/50">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Dashboard</h1>
              <p className="text-muted-foreground">
                Web Vitals Monitoring & Analyse
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData}>
                <Activity className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
              {hasData && (
                <Button variant="destructive" onClick={handleClearData}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Daten löschen
                </Button>
              )}
            </div>
          </div>

          {!hasData ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Keine Performance-Daten verfügbar</h3>
                <p className="text-muted-foreground mb-4">
                  Besuchen Sie die Website im Browser, um Web Vitals Daten zu sammeln.
                </p>
                <p className="text-sm text-muted-foreground">
                  Die Daten werden automatisch im localStorage gespeichert und hier angezeigt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mobile Messungen</CardTitle>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mobileData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Letzte 10 Metriken pro Type
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Desktop Messungen</CardTitle>
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{desktopData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Letzte 10 Metriken pro Type
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tablet Messungen</CardTitle>
                    <Tablet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tabletData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Letzte 10 Metriken pro Type
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Device Distribution */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Device-Type Distribution</CardTitle>
                  <CardDescription>
                    Verteilung der Messungen nach Gerätetyp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deviceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tabs for different devices */}
              <Tabs defaultValue="mobile" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="mobile">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </TabsTrigger>
                  <TabsTrigger value="desktop">
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                  </TabsTrigger>
                  <TabsTrigger value="tablet">
                    <Tablet className="h-4 w-4 mr-2" />
                    Tablet
                  </TabsTrigger>
                </TabsList>

                {/* Mobile Tab */}
                <TabsContent value="mobile" className="space-y-4">
                  <MetricsOverview metrics={mobileMetrics} deviceType="Mobile" />
                  <MetricTrends data={mobileData} deviceType="Mobile" getTrendData={getTrendData} />
                </TabsContent>

                {/* Desktop Tab */}
                <TabsContent value="desktop" className="space-y-4">
                  <MetricsOverview metrics={desktopMetrics} deviceType="Desktop" />
                  <MetricTrends data={desktopData} deviceType="Desktop" getTrendData={getTrendData} />
                </TabsContent>

                {/* Tablet Tab */}
                <TabsContent value="tablet" className="space-y-4">
                  <MetricsOverview metrics={tabletMetrics} deviceType="Tablet" />
                  <MetricTrends data={tabletData} deviceType="Tablet" getTrendData={getTrendData} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Metrics Overview Component
const MetricsOverview = ({ metrics, deviceType }: { metrics: any[]; deviceType: string }) => {
  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Keine {deviceType}-Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{deviceType} Metrics Overview</CardTitle>
        <CardDescription>Durchschnittswerte und Verteilung der letzten Messungen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const threshold = getMetricThreshold(metric.name);
            const rating = metric.avg <= threshold.good ? 'good' : metric.avg <= threshold.poor ? 'needs-improvement' : 'poor';
            
            return (
              <div key={metric.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{metric.name}</h4>
                    <Badge variant={rating === 'good' ? 'default' : rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                      {rating === 'good' ? '✓ Gut' : rating === 'needs-improvement' ? '⚠ OK' : '✗ Schlecht'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {metric.avg}{threshold.unit}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Min</p>
                    <p className="font-medium">{metric.min}{threshold.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max</p>
                    <p className="font-medium">{metric.max}{threshold.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Messungen</p>
                    <p className="font-medium">{metric.count}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-green-600">
                    Gut: {metric.goodCount}
                  </Badge>
                  <Badge variant="outline" className="text-amber-600">
                    OK: {metric.needsImprovementCount}
                  </Badge>
                  <Badge variant="outline" className="text-red-600">
                    Schlecht: {metric.poorCount}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Metric Trends Component
const MetricTrends = ({ data, deviceType, getTrendData }: any) => {
  const metricNames = ['LCP', 'FCP', 'CLS', 'INP', 'TTFB'];
  const availableMetrics = metricNames.filter(name => data.some((m: any) => m.name === name));

  if (availableMetrics.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {deviceType} Performance Trends
        </CardTitle>
        <CardDescription>Verlauf der letzten 10 Messungen pro Metrik</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {availableMetrics.map((metricName) => {
            const trendData = getTrendData(data, metricName);
            const threshold = getMetricThreshold(metricName);

            if (trendData.length === 0) return null;

            return (
              <div key={metricName}>
                <h4 className="font-semibold mb-4">{metricName}</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: 'Messung', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: threshold.unit, angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value}${threshold.unit}`, metricName]}
                      labelFormatter={(label) => `Messung ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={COLORS.mobile}
                      strokeWidth={2}
                      dot={{ fill: COLORS.mobile, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const getMetricThreshold = (metricName: string) => {
  const thresholds: Record<string, { good: number; poor: number; unit: string }> = {
    LCP: { good: 2500, poor: 4000, unit: 'ms' },
    FCP: { good: 1800, poor: 3000, unit: 'ms' },
    CLS: { good: 0.1, poor: 0.25, unit: '' },
    INP: { good: 200, poor: 500, unit: 'ms' },
    TTFB: { good: 800, poor: 1800, unit: 'ms' },
  };
  return thresholds[metricName] || { good: 100, poor: 300, unit: 'ms' };
};

const COLORS = {
  mobile: 'hsl(var(--primary))',
  desktop: 'hsl(var(--accent))',
  tablet: 'hsl(var(--secondary))',
  good: '#22c55e',
  'needs-improvement': '#f59e0b',
  poor: '#ef4444',
};

export default AdminPerformance;
