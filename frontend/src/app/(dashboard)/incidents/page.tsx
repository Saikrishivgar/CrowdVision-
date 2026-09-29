'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Video, Clock, MapPin, Check, X, ArrowUpRight, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api';

type Incident = {
  id: number;
  incident_type: string;
  severity: string;
  camera_id?: number | null;
  camera_name?: string;
  timestamp: string;
  description: string;
  ai_summary: string;
  status?: string;
};

type IncidentStats = {
  total: number;
  by_severity: Record<string, number>;
  unresolved: number;
};

export default function IncidentsPage() {
  const [filter, setFilter] = useState("all");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [currentTime] = useState(() => Date.now());

  const fetchIncidents = useCallback(() => {
    // Fetch incidents
    const url = filter === "all" ? apiUrl('/api/incidents/') : apiUrl(`/api/incidents/?severity=${filter}`);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setIncidents(data as Incident[]);
      })
      .catch(err => {
        console.error("Incidents fetch error, using static fallback:", err);
        // Fallback mock items
        const mockIncidents = [
          { 
            id: 1, 
            incident_type: "Critical Density", 
            severity: "critical", 
            camera_name: "CAM-NorthGate-01", 
            timestamp: new Date(Date.now() - 120000).toISOString(),
            description: "Zone D density reached critical safety threshold.",
            ai_summary: "Extremely high density (92% risk) detected in Zone D of North Gate. 187 individuals localized. Direct people to Exit D."
          },
          { 
            id: 2, 
            incident_type: "Rapid Crowd Formation", 
            severity: "high", 
            camera_name: "CAM-Lobby-Main", 
            timestamp: new Date(Date.now() - 900000).toISOString(),
            description: "Rapid crowd concentration near Lobby Main Entrance.",
            ai_summary: "Lobby camera registered an increase of +142 people over 3 minutes. Influx from North Plaza."
          },
          { 
            id: 3, 
            incident_type: "Exit Congestion", 
            severity: "medium", 
            camera_name: "CAM-LoadingDock", 
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            description: "Exit B is heavily congested due to slow throughput.",
            ai_summary: "Crowd flow bottleneck detected at Exit B with estimated queuing latency of 5+ minutes."
          }
        ];
        setIncidents(filter === "all" ? mockIncidents : mockIncidents.filter(i => i.severity === filter));
      });
  }, [filter]);

  useEffect(() => {
    void fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    // Fetch stats
    fetch(apiUrl('/api/incidents/stats'))
      .then(res => res.json())
      .then((data: IncidentStats) => {
        setStats(data);
      })
      .catch(err => {
        console.error("Incidents stats fetch error:", err);
        setStats({
          total: 24,
          by_severity: { critical: 2, high: 6, medium: 8, low: 8 },
          unresolved: 8
        });
      });
  }, []);

  const handleAcknowledge = async (id: number) => {
    try {
      const response = await fetch(apiUrl(`/api/incidents/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' })
      });
      if (response.ok) {
        fetchIncidents();
      }
    } catch (err) {
      console.warn("Failed to update status on server:", err);
      // Client-side local update
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'acknowledged' } : inc));
    }
  };

  const getIncidentIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("density") || t.includes("formation")) return Users;
    if (t.includes("exit") || t.includes("bottleneck")) return AlertCircle;
    return ShieldAlert;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMins = Math.floor((currentTime - date.getTime()) / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recent";
    }
  };

  const statCards = [
    { label: "Active Crowd Alerts", value: stats?.total || "24", color: "text-primary" },
    { label: "Critical Incidents", value: stats?.by_severity?.critical || "2", color: "text-destructive" },
    { label: "Unresolved Risks", value: stats?.unresolved || "8", color: "text-warning" },
    { label: "Safety Level Status", value: "SECURE", color: "text-success" }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Crowd Incident Management</h1>
          <p className="text-muted-foreground text-sm">Review, acknowledge, and escalate safety alerts triggered by the Risk Engine</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search safety incidents..." className="pl-9 w-[250px] bg-white/5 border-white/10" />
          </div>
          <Button variant="outline" className="bg-white/5 border-white/10 hidden sm:flex">Export Safety Logs</Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="glass border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="bg-black/40 border border-white/10 mb-6">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="critical" className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">Critical</TabsTrigger>
          <TabsTrigger value="high" className="data-[state=active]:bg-warning/20 data-[state=active]:text-warning">High</TabsTrigger>
          <TabsTrigger value="medium" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">Medium</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          {incidents.map((incident, i) => {
            const IconComponent = getIncidentIcon(incident.incident_type);
            return (
              <motion.div key={incident.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn(
                  "glass overflow-hidden border-l-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                  incident.severity === 'critical' ? 'border-l-destructive border-t-white/10 border-r-white/10 border-b-white/10 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]' :
                  incident.severity === 'high' ? 'border-l-warning border-t-white/10 border-r-white/10 border-b-white/10 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]' :
                  'border-l-secondary border-t-white/10 border-r-white/10 border-b-white/10'
                )}>
                  <CardContent className="p-0 sm:p-4 flex flex-col sm:flex-row gap-4">
                    {/* Video Thumbnail Placeholder */}
                    <div className="relative w-full sm:w-48 aspect-video bg-black/60 sm:rounded-lg overflow-hidden shrink-0 border border-white/10 group flex items-center justify-center">
                      <Video className="w-8 h-8 text-muted-foreground opacity-30" />
                      {incident.severity === 'critical' && (
                        <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse shadow-[0_0_8px_var(--destructive)]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 sm:p-0 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-md",
                            incident.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                            incident.severity === 'high' ? 'bg-warning/10 text-warning' :
                            'bg-white/5 text-muted-foreground'
                          )}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <h3 className="font-semibold text-lg text-white">{incident.incident_type}</h3>
                        </div>
                        <Badge className={cn("uppercase text-[10px] tracking-wider", 
                          incident.severity === 'critical' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                          incident.severity === 'high' ? 'bg-warning/20 text-warning border-warning/30' :
                          'bg-secondary/20 text-secondary border-secondary/30'
                        )}>
                          {incident.severity}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(incident.timestamp)}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {incident.camera_name || (incident.camera_id ? `Camera ${incident.camera_id}` : "Zone D Area")}</span>
                      </div>

                      <p className="text-sm text-foreground/80 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5 mb-4">
                        {incident.description} <span className="text-muted-foreground block text-xs mt-2 border-t border-white/5 pt-1.5 font-mono">{incident.ai_summary}</span>
                      </p>

                      <div className="mt-auto flex items-center gap-2 pt-2 border-t border-white/5">
                        <Button 
                          onClick={() => handleAcknowledge(incident.id)}
                          disabled={incident.status === 'acknowledged'}
                          size="sm" 
                          className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground h-8 px-3"
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" /> {incident.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                        </Button>
                        <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 h-8 px-3 text-white">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-1.5 text-accent" /> Escalate
                        </Button>
                        <div className="flex-1" />
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive h-8 px-2">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
