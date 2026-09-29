'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, Plus, Settings2, Maximize, AlertCircle,
  Map as MapIcon, Grid as GridIcon, AlertTriangle, Upload
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api';

type CameraMetric = {
  id: number;
  name: string;
  status: string;
  resolution: string;
  fps: number;
  location: string;
  people_count: number;
  risk_score: number;
  risk_level: string;
  groups_count: number;
  flow_direction: string;
  trend: string;
};

export default function CamerasPage() {
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [cameras, setCameras] = useState<CameraMetric[]>([]);
  const [demoTick, setDemoTick] = useState(0);
  const [uploadedFeeds, setUploadedFeeds] = useState<Record<number, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem("crowdvision-demo-feeds");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [uploadingCamera, setUploadingCamera] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setDemoTick((tick) => tick + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch(apiUrl('/api/cameras/'))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch camera metrics");
        return res.json();
      })
      .then((data: CameraMetric[]) => {
        setCameras(data);
      })
      .catch((err) => {
        console.error("Cameras fetch error, using static fallback:", err);
        setCameras([
          { id: 1, name: "CAM-NorthGate-01", status: "online", resolution: "4K", fps: 30, location: "North Perimeter", people_count: 428, risk_score: 74, risk_level: "HIGH", groups_count: 6, flow_direction: "→ → →", trend: "+18%" },
          { id: 2, name: "CAM-Lobby-Main", status: "online", resolution: "1080p", fps: 60, location: "Building A", people_count: 115, risk_score: 32, risk_level: "LOW", groups_count: 2, flow_direction: "← ←", trend: "-5%" },
          { id: 3, name: "CAM-Parking-L1", status: "offline", resolution: "1080p", fps: 30, location: "Underground", people_count: 0, risk_score: 0, risk_level: "LOW", groups_count: 0, flow_direction: "None", trend: "0%" },
          { id: 4, name: "CAM-LoadingDock", status: "online", resolution: "4K", fps: 30, location: "South Perimeter", people_count: 84, risk_score: 22, risk_level: "LOW", groups_count: 1, flow_direction: "→", trend: "+2%" },
          { id: 5, name: "CAM-Corridor-East", status: "online", resolution: "1080p", fps: 30, location: "Building B", people_count: 45, risk_score: 18, risk_level: "LOW", groups_count: 1, flow_direction: "←", trend: "+1%" },
          { id: 6, name: "CAM-DataCenter", status: "maintenance", resolution: "4K", fps: 60, location: "Secure Zone", people_count: 0, risk_score: 0, risk_level: "LOW", groups_count: 0, flow_direction: "None", trend: "0%" },
        ]);
      });
  }, []);

  const uploadDemoFeed = async (cameraId: number, file: File) => {
    setUploadingCamera(cameraId);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("camera_id", String(cameraId));
      const response = await fetch(apiUrl("/api/crowd/analyze/video"), {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.detail || `Video upload failed (${response.status})`);
      }
      const data = await response.json();
      const feedUrl = apiUrl("/uploads/" + data.filename);
      setUploadedFeeds((current) => {
        const next = { ...current, [cameraId]: feedUrl };
        window.localStorage.setItem("crowdvision-demo-feeds", JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error("Demo feed upload failed", error);
      const message = error instanceof Error ? error.message : "Unknown upload error";
      window.alert(`Could not upload this video: ${message}`);
    } finally {
      setUploadingCamera(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Live Crowd Monitoring</h1>
          <p className="text-muted-foreground text-sm">Monitor and configure crowd thresholds on camera feeds ({cameras.length} Monitored, {cameras.filter(c => c.status === 'online').length} Online)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("px-3 h-8", view === 'grid' && "bg-white/10 text-white")}
              onClick={() => setView('grid')}
            >
              <GridIcon className="w-4 h-4 mr-2" /> Grid
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("px-3 h-8", view === 'map' && "bg-white/10 text-white")}
              onClick={() => setView('map')}
            >
              <MapIcon className="w-4 h-4 mr-2" /> Map
            </Button>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Configure Camera
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((cam, i) => {
            const demoVideo = uploadedFeeds[cam.id] || (cam.id === 1 ? '/demo-feeds/north-gate.mp4' : cam.id === 2 ? '/demo-feeds/lobby.mp4' : '/demo-feeds/loading-dock.mp4');
            const demoPeople = cam.status === 'online' ? Math.max(0, cam.people_count + Math.round(Math.sin(demoTick / 2 + cam.id) * 8)) : 0;
            return (
            <motion.div key={cam.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass border-white/10 overflow-hidden group hover:border-primary/40 transition-all duration-300">
                <div className="relative aspect-video bg-black/80 overflow-hidden border-b border-white/10">
                  {/* Offline/Maintenance State */}
                  {cam.status !== 'online' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                      <AlertCircle className={cn("w-10 h-10 mb-2", cam.status === 'offline' ? "text-destructive" : "text-warning")} />
                      <span className="font-mono text-sm tracking-widest uppercase">{cam.status}</span>
                    </div>
                  )}

                  {cam.status === 'online' ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                      src={demoVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      aria-label={"Demo live feed for " + cam.name}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Video className="w-16 h-16" />
                    </div>
                  )}
                  {cam.status === 'online' && (
                    <Badge className="absolute bottom-2 left-2 z-20 bg-black/70 text-cyan-300 border border-cyan-400/30 text-[9px] tracking-wider">
                      {uploadedFeeds[cam.id] ? "UPLOADED FEED • LIVE" : "DEMO FEED • LIVE SIMULATION"}
                    </Badge>
                  )}
                  
                  {cam.status === 'online' && (
                    <>
                      {/* Bounding Box indicators */}
                      <div className="absolute top-1/4 left-1/4 w-1/4 h-1/2 border border-success/60 bg-success/5 flex items-start p-1 text-[8px] text-success font-mono">Person ID_210</div>
                      <div className="absolute top-1/3 right-1/4 w-1/5 h-1/3 border border-primary/60 bg-primary/5 flex items-start p-1 text-[8px] text-primary font-mono">Person ID_214</div>
                      <div className="absolute top-10 right-10 w-8 h-12 border border-warning/60 bg-warning/5 flex items-start p-1 text-[8px] text-warning font-mono">ID_199</div>
                      {/* Scanning visual effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent h-[8%] animate-scan-line opacity-40" />
                    </>
                  )}

                  {/* Top Left Status Badge */}
                  <div className="absolute top-2 left-2 flex gap-2 z-20">
                    <Badge className={cn(
                      "text-[10px] font-semibold backdrop-blur-md border px-2 py-0.5",
                      cam.status === 'online' ? "bg-success/20 text-success border-success/30" : 
                      cam.status === 'offline' ? "bg-destructive/20 text-destructive border-destructive/30" :
                      "bg-warning/20 text-warning border-warning/30"
                    )}>
                      {cam.status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-1.5 inline-block" />}
                      {cam.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {/* Top Right Maximize option */}
                  <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="w-8 h-8 bg-black/60 hover:bg-primary/20 border border-white/10">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Bottom details overlay */}
                  <div className="absolute bottom-2 right-2 flex gap-2 z-20">
                    <Badge variant="outline" className="bg-black/60 text-[10px] font-mono border-white/10 text-white">
                      {cam.resolution} • {cam.fps} FPS
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-primary transition-colors">{cam.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{cam.location}</p>
                    </div>
                    {cam.people_count > 0 && (
                      <Badge className={cn(
                        "border-none flex items-center gap-1 font-semibold",
                        cam.risk_level === 'HIGH' ? "bg-warning text-black" : 
                        cam.risk_level === 'CRITICAL' ? "bg-destructive text-white animate-pulse" : "bg-primary text-white"
                      )}>
                        <AlertTriangle className="w-3.5 h-3.5" /> Risk {cam.risk_score}%
                      </Badge>
                    )}
                  </div>

                  {/* Grid details for crowd metrics */}
                  {cam.status === 'online' ? (
                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
                      <div className="bg-white/5 rounded p-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">People</span>
                        <span className="font-mono text-sm font-bold text-white">{demoPeople}</span>
                      </div>
                      <div className="bg-white/5 rounded p-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Groups</span>
                        <span className="font-mono text-sm font-bold text-white">{cam.groups_count}</span>
                      </div>
                      <div className="bg-white/5 rounded p-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Flow</span>
                        <span className="font-mono text-sm font-bold text-primary block truncate">{cam.flow_direction}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 flex items-center justify-center border-t border-white/5 pt-3 text-xs text-muted-foreground">
                      No feed active to parse crowd dynamics
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between">
                    <div className="flex items-center gap-1">
                      <input
                        id={"camera-video-" + cam.id}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadDemoFeed(cam.id, file);
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary hover:text-primary-foreground hover:bg-primary px-2"
                        onClick={() => document.getElementById("camera-video-" + cam.id)?.click()}
                        disabled={uploadingCamera === cam.id}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        {uploadingCamera === cam.id ? "Uploading..." : "Upload Video"}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white px-2">
                      <Settings2 className="w-4 h-4 mr-1.5" /> Calibration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="glass border-white/10 h-[600px] relative overflow-hidden flex flex-col items-center justify-center bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/blueprint.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />
          
          <MapIcon className="w-16 h-16 text-muted-foreground opacity-20 mb-4 z-10" />
          <h3 className="text-xl font-medium text-white z-10">Facility Map View</h3>
          <p className="text-muted-foreground z-10 mb-6 text-sm">Interactive routing and risk level overlay</p>
          
          <div className="relative w-full max-w-3xl aspect-[2/1] border border-white/10 rounded-xl bg-white/5 z-10 flex items-center justify-center p-8">
            <div className="absolute top-[20%] left-[30%] group">
              <div className="w-4 h-4 bg-success rounded-full animate-pulse shadow-[0_0_10px_var(--success)] cursor-pointer" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 p-2 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white">
                CAM-NorthGate-01 (428 people)
              </div>
            </div>
            <div className="absolute top-[50%] left-[60%] group">
              <div className="w-4 h-4 bg-success rounded-full animate-pulse shadow-[0_0_10px_var(--success)] cursor-pointer" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 p-2 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white">
                CAM-Lobby-Main (115 people)
              </div>
            </div>
            <div className="absolute top-[70%] left-[40%] group">
              <div className="w-4 h-4 bg-destructive rounded-full shadow-[0_0_10px_var(--destructive)] cursor-pointer animate-ping" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 p-2 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white">
                CAM-LoadingDock (84 people)
              </div>
            </div>
            
            <p className="text-muted-foreground/50 font-mono text-sm border border-dashed border-white/20 p-4 rounded-xl">
              [ Evacuation Plan Mapping Overlay ]
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
