'use client';

import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, AlertTriangle, AlertCircle, Database, Cpu, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api';

const COLORS = ['var(--destructive)', 'var(--warning)', 'var(--secondary)', 'var(--primary)'];

type AnalyticsOverview = {
  total_people_analyzed: number;
  peak_crowd_count: number;
  average_density: number;
  critical_events: number;
};

type TrendData = {
  labels: string[];
  datasets: { label: string; data: number[] }[];
};

type IncidentStats = {
  by_type: Record<string, number>;
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [incidentStats, setIncidentStats] = useState<IncidentStats | null>(null);

  useEffect(() => {
    // 1. Fetch Overview stats
    fetch(apiUrl('/api/analytics/overview'))
      .then(res => res.json())
      .then((data: AnalyticsOverview) => setOverview(data))
      .catch(err => {
        console.error("Overview fetch error:", err);
        setOverview({
          total_people_analyzed: 24591,
          peak_crowd_count: 2841,
          average_density: 72.5,
          critical_events: 3
        });
      });

    // 2. Fetch Trends
    fetch(apiUrl('/api/analytics/detections'))
      .then(res => res.json())
      .then((data: TrendData) => setTrendData(data))
      .catch(err => {
        console.error("Trends fetch error:", err);
        setTrendData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            { label: "People Detected", data: [1200, 1850, 2400, 2841, 2600, 1900, 2100] },
            { label: "Relative Density", data: [40, 52, 66, 78, 71, 55, 60] }
          ]
        });
      });

    // 3. Fetch Incident stats
    fetch(apiUrl('/api/incidents/stats'))
      .then(res => res.json())
      .then((data: IncidentStats) => {
        setIncidentStats(data);
      })
      .catch(err => {
        console.error("Incident stats error:", err);
        setIncidentStats({
          by_type: {
            "Critical Density": 12,
            "Rapid Growth": 8,
            "Exit Congestion": 6,
            "Bottlenecks": 4
          }
        });
      });
  }, []);

  const stats = [
    { title: "Total People Analyzed", value: overview?.total_people_analyzed?.toLocaleString() || "24,591", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { title: "Peak Crowd Count", value: overview?.peak_crowd_count?.toLocaleString() || "2,841", icon: Activity, color: "text-secondary", bg: "bg-secondary/10" },
    { title: "Average Density Score", value: `${overview?.average_density || "72.5"}%`, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { title: "Critical Events Tracked", value: overview?.critical_events || "3", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  ];

  // Re-map trends for AreaChart format
  const mappedTrends = trendData?.labels ? trendData.labels.map((label: string, idx: number) => {
    return {
      time: label,
      people: trendData.datasets[0].data[idx] || 0,
      density: trendData.datasets[1].data[idx] || 0
    };
  }) : [];

  // Re-map incident pie chart categories
  const pieData = incidentStats?.by_type ? Object.entries(incidentStats.by_type).map(([key, value]) => {
    return { name: key, value: value };
  }) : [
    { name: 'Critical Density', value: 12 },
    { name: 'Rapid Growth', value: 8 },
    { name: 'Exit Congestion', value: 6 },
    { name: 'Bottleneck', value: 4 }
  ];

  // Zone comparison bar chart mock
  const zoneComparisonData = [
    { zone: "Zone A", people: 32 },
    { zone: "Zone B", people: 412 },
    { zone: "Zone C", people: 84 },
    { zone: "Zone D", people: 143 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Crowd Analytics Center</h1>
        <p className="text-muted-foreground text-sm">Deep learning point query statistics, risk score logs, and zone comparison metrics</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="glass border-white/10 hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Trends */}
        <Card className="glass border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Crowd Trend Analytics (Temporal Density)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mappedTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" />
                  <Area type="monotone" name="People Count" dataKey="people" stroke="var(--primary)" fillOpacity={1} fill="url(#colorPeople)" />
                  <Area type="monotone" name="Density Factor" dataKey="density" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorDensity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Incident Distribution */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Incident Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" layout="vertical" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Zone comparison */}
        <Card className="glass border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Zone Density Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="zone" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="people" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Load */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-base font-semibold">GPU Analytics Pipeline Load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> PET Model Inference</span>
                <span className="font-mono text-primary">82%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '82%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2"><Database className="w-4 h-4 text-secondary" /> DBSCAN Grid Evaluation</span>
                <span className="font-mono text-secondary">45%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-accent" /> Evacuation Routing Engine</span>
                <span className="font-mono text-accent">12%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: '12%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
