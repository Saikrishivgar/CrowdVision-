'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Search, Cpu, Zap,
  ArrowUpRight, ArrowDownRight, Clock, MapPin, AlertTriangle, Users,
  Grid as GridIcon, Map as MapIcon, Maximize2, Plus, Minus, Crosshair
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api';

type DashboardAlert = {
  id: number;
  type: string;
  location: string;
  severity: string;
  risk_score: number;
  time: string;
};

type DashboardData = {
  people_detected: number;
  crowd_risk: number;
  risk_level: string;
  active_zones: number;
  critical_areas: number;
  alerts: DashboardAlert[];
  trend: { time: string; people: number; density: number; risk: number }[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/crowd/dashboard'))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        // Load mock/fallback structured data if backend is offline or loading fails
        setDashboardData({
          people_detected: 2841,
          crowd_risk: 78,
          risk_level: "HIGH",
          active_zones: 12,
          critical_areas: 3,
          alerts: [
            { id: 1, type: "Critical crowd density", location: "Zone D", severity: "CRITICAL", risk_score: 92, time: "2 min ago" },
            { id: 2, type: "Rapid crowd formation", location: "North Gate", severity: "HIGH", risk_score: 71, time: "12 min ago" },
            { id: 3, type: "Moderate congestion", location: "Food Court", severity: "MODERATE", risk_score: 54, time: "25 min ago" }
          ],
          trend: [
            { time: "10:00", people: 1000, density: 33, risk: 20 },
            { time: "11:00", people: 1500, density: 50, risk: 32 },
            { time: "12:00", people: 2000, density: 66, risk: 55 },
            { time: "13:00", people: 2500, density: 83, risk: 78 },
            { time: "14:00", people: 2841, density: 92, risk: 78 }
          ]
        });
      });
  }, []);

  const stats = [
    { title: "PEOPLE DETECTED", value: dashboardData?.people_detected?.toLocaleString() || "2,841", icon: Users, trend: "↑ 12%", up: true, subtitle: "Total indexed" },
    { title: "CROWD RISK", value: dashboardData?.crowd_risk ? `${dashboardData.crowd_risk}%` : "78%", icon: ShieldAlert, trend: dashboardData?.risk_level || "HIGH", up: false, subtitle: "Safety index" },
    { title: "ACTIVE ZONES", value: dashboardData?.active_zones || "12", icon: GridIcon, trend: "8 monitored", up: true, subtitle: "Facility grid" },
    { title: "CRITICAL AREAS", value: dashboardData?.critical_areas || "3", icon: AlertTriangle, trend: "🔴 3 hotspots", up: false, subtitle: "Incident areas" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Search */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-2 rounded-2xl flex items-center gap-2 border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] focus-within:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-shadow"
      >
        <Search className="w-5 h-5 text-primary ml-3" />
        <Input 
          placeholder="Crowd Intelligence Search: e.g., 'Which exit is least crowded?'" 
          className="border-0 bg-transparent focus-visible:ring-0 text-base shadow-none h-12"
          onKeyDown={(e) => {
            if (e.key === 'Enter') router.push('/search');
          }}
        />
        <Button onClick={() => router.push('/search')} className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground mr-1 rounded-xl">
          Query AI
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass border-white/10 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-semibold px-2 py-1 rounded-full",
                    stat.up ? "bg-success/10 text-success" : 
                    stat.trend === 'CRITICAL' ? "bg-destructive/20 text-destructive animate-pulse" : "bg-warning/10 text-warning"
                  )}>
                    {stat.up ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {stat.trend}
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-1 tracking-tight">{stat.value}</h3>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{stat.title}</span>
                  <span>{stat.subtitle}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Crowd Map */}
          <Card className={cn("glass border-white/10 overflow-hidden relative", mapFullscreen && "fixed inset-4 z-50")}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-4 border-b border-white/5 relative z-20">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-glow"><MapIcon className="w-5 h-5 text-primary" />Live Crowd Map</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 flex gap-1.5 py-1 px-3"><span className="w-2 h-2 rounded-full bg-success animate-pulse" />Live Tracking Active</Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMapFullscreen((value) => !value)}><Maximize2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Top-down facility view • density, exits, camera feeds, and movement corridors</p>
            </CardHeader>
            <CardContent className={cn("p-4", mapFullscreen && "h-[calc(100vh-120px)]")}>
              <div className="relative w-full h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#071321] shadow-2xl">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(70,140,190,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(70,140,190,.18) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,110,160,.18),transparent_65%)]" />
                <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `scale(${mapZoom})` }}>
                  <div className="absolute left-0 right-0 top-[48%] h-10 bg-slate-700/40 border-y border-slate-400/20" />
                  <div className="absolute top-0 bottom-0 left-[46%] w-9 bg-slate-700/40 border-x border-slate-400/20" />
                  <div className="absolute left-[8%] right-[8%] top-[19%] h-px bg-cyan-300/30" /><div className="absolute left-[8%] right-[8%] bottom-[17%] h-px bg-cyan-300/30" />
                  <div className="absolute left-[13%] top-[12%] w-[27%] h-[29%] rounded-lg border border-cyan-200/25 bg-gradient-to-br from-slate-500/80 via-slate-700/90 to-slate-950 shadow-[10px_14px_0_rgba(0,0,0,.35),0_0_25px_rgba(20,160,210,.15)] skew-y-[-2deg]"><div className="p-3 text-[10px] text-slate-200 uppercase tracking-widest">North Hall</div><div className="absolute inset-3 top-10 grid grid-cols-4 gap-1 opacity-30">{Array.from({ length: 12 }).map((_, i) => <span key={i} className="rounded-sm bg-cyan-200/50" />)}</div></div>
                  <div className="absolute left-[53%] top-[10%] w-[31%] h-[31%] rounded-lg border border-cyan-200/25 bg-gradient-to-br from-slate-600/80 via-slate-800/90 to-slate-950 shadow-[10px_14px_0_rgba(0,0,0,.35),0_0_25px_rgba(20,160,210,.15)] skew-y-[2deg]"><div className="p-3 text-[10px] text-slate-200 uppercase tracking-widest">Food Court</div><div className="absolute inset-3 top-10 grid grid-cols-5 gap-1 opacity-30">{Array.from({ length: 15 }).map((_, i) => <span key={i} className="rounded-sm bg-orange-200/50" />)}</div></div>
                  <div className="absolute left-[18%] bottom-[14%] w-[28%] h-[24%] rounded-lg border border-cyan-200/25 bg-gradient-to-br from-slate-500/80 via-slate-700/90 to-slate-950 shadow-[10px_14px_0_rgba(0,0,0,.35),0_0_25px_rgba(20,160,210,.15)]"><div className="p-3 text-[10px] text-slate-200 uppercase tracking-widest">Main Entrance</div></div>
                  <div className="absolute right-[10%] bottom-[12%] w-[28%] h-[25%] rounded-lg border border-cyan-200/25 bg-gradient-to-br from-slate-600/80 via-slate-800/90 to-slate-950 shadow-[10px_14px_0_rgba(0,0,0,.35),0_0_25px_rgba(20,160,210,.15)]"><div className="p-3 text-[10px] text-slate-200 uppercase tracking-widest">East Wing</div></div>
                  <div className="absolute left-[26%] top-[31%] h-32 w-32 rounded-full bg-emerald-400/40 blur-2xl" /><div className="absolute left-[58%] top-[25%] h-36 w-40 rounded-full bg-red-500/70 blur-2xl animate-pulse" /><div className="absolute left-[31%] bottom-[25%] h-28 w-32 rounded-full bg-amber-400/60 blur-2xl" /><div className="absolute right-[20%] bottom-[25%] h-32 w-36 rounded-full bg-red-500/60 blur-2xl animate-pulse" />
                  <div className="absolute left-[21%] top-[39%] rounded-xl border border-emerald-300/40 bg-slate-950/90 px-3 py-2 shadow-xl"><p className="text-xs text-emerald-300">North Exit</p><strong className="text-xl text-white">32</strong><p className="text-[10px] text-emerald-300">NORMAL</p></div>
                  <div className="absolute left-[60%] top-[31%] rounded-xl border border-red-400/50 bg-slate-950/90 px-3 py-2 shadow-xl"><p className="text-xs text-red-300">Food Court</p><strong className="text-xl text-white">187</strong><p className="text-[10px] text-red-300">CRITICAL</p></div>
                  <div className="absolute left-[28%] bottom-[22%] rounded-xl border border-amber-300/50 bg-slate-950/90 px-3 py-2 shadow-xl"><p className="text-xs text-amber-300">Main Entrance</p><strong className="text-xl text-white">84</strong><p className="text-[10px] text-amber-300">MODERATE</p></div>
                  <div className="absolute right-[16%] bottom-[20%] rounded-xl border border-red-400/50 bg-slate-950/90 px-3 py-2 shadow-xl"><p className="text-xs text-red-300">East Exit</p><strong className="text-xl text-white">143</strong><p className="text-[10px] text-red-300">HIGH</p></div>
                  {[[18, 25], [48, 19], [78, 52], [51, 80], [88, 25]].map(([left, top], i) => <div key={i} style={{ left: `${left}%`, top: `${top}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary shadow-[0_0_16px_rgba(0,153,255,.8)] text-[10px] text-white">C{i + 1}</div>)}
                </div>
                <div className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/80 shadow-lg"><Button size="icon" variant="ghost" className="h-8 w-8 rounded-none" onClick={() => setMapZoom((value) => Math.min(1.25, value + .1))}><Plus className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 rounded-none" onClick={() => setMapZoom((value) => Math.max(.85, value - .1))}><Minus className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 rounded-none" onClick={() => setMapZoom(1)}><Crosshair className="w-4 h-4" /></Button></div>
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-[10px] text-muted-foreground"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />Low</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Moderate</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Critical</span></div>
                <div className="absolute right-3 bottom-3 z-10 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-[10px] text-cyan-200">TOP-DOWN • 3D FACILITY GRID</div>
              </div>
            </CardContent>
          </Card>

          {/* Crowd Trend */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Crowd Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData?.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" name="Crowd Count" dataKey="people" stroke="var(--primary)" fillOpacity={1} fill="url(#colorPeople)" strokeWidth={2} />
                    <Area type="monotone" name="Risk level" dataKey="risk" stroke="var(--destructive)" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Space */}
        <div className="space-y-6">
          {/* Risk Metrics */}
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4 text-accent animate-pulse" />
                Crowd Risk Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> Exit Congestion</div>
                  <span className="font-mono">82%</span>
                </div>
                <Progress value={82} className="h-1.5 bg-white/5 [&>div]:bg-destructive" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><GridIcon className="w-4 h-4" /> Zone Occupancy</div>
                  <span className="font-mono">68%</span>
                </div>
                <Progress value={68} className="h-1.5 bg-white/5 [&>div]:bg-warning" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Cpu className="w-4 h-4" /> Bottleneck Magnitude</div>
                  <span className="font-mono">51%</span>
                </div>
                <Progress value={51} className="h-1.5 bg-white/5 [&>div]:bg-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="glass border-white/10 flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Active Alerts</CardTitle>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => router.push('/incidents')}>View Alerts</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.alerts?.map((alert: DashboardAlert) => (
                  <div key={alert.id} className="group relative pl-4 border-l-2 border-white/10 hover:border-primary transition-colors py-1">
                    <div className={cn(
                      "absolute -left-[5px] top-2 w-2 h-2 rounded-full",
                      alert.severity === 'CRITICAL' ? 'bg-destructive shadow-[0_0_8px_var(--destructive)]' : 
                      alert.severity === 'HIGH' ? 'bg-warning shadow-[0_0_8px_var(--warning)]' : 'bg-primary'
                    )} />
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-foreground/90 leading-tight">{alert.type}</h4>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-semibold tracking-wide border px-1.5 py-0.5",
                        alert.severity === 'CRITICAL' ? "bg-destructive/20 text-destructive border-destructive/30" :
                        alert.severity === 'HIGH' ? "bg-warning/20 text-warning border-warning/30" : "bg-primary/20 text-primary border-primary/30"
                      )}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
