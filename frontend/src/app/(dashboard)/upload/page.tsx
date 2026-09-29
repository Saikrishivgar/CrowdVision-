'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { 
  UploadCloud, CheckCircle2, Loader2, ShieldAlert, ArrowRight, Eye, RefreshCw, Layers, Video
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { apiUrl, assetUrl } from '@/lib/api';

type AnalysisZone = {
  zone_name: string;
  people_count: number;
  capacity: number;
  occupancy_percentage: number;
  risk_score: number;
  risk_level: string;
};

type AnalysisResult = {
  analysis_id: number;
  people_count: number;
  model_confidence: number;
  density: { relative: number; physical: number | null; level: string };
  groups: number;
  hotspots: number;
  risk: { score: number; level: string };
  zones: AnalysisZone[];
  recommendation: { preferred_exit: string; avoid_exit: string; reason: string };
  visualizations: { points: string; heatmap: string; zones?: string; tracked_video?: string };
};

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const stages = [
    "Uploading File...", 
    "Running PET Point Localization...", 
    "Evaluating DBSCAN Grouping...", 
    "Computing KDE Density Mapping...", 
    "Evaluating Safety Risk Engine..."
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setAnalysisResult(null);
    setUploadError(null);
    setProgress(0);
    setStage(0);

    // Simulate progress ticks for aesthetic feel
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8;
      if (p >= 98) {
        clearInterval(interval);
      }
      setProgress(Math.min(98, p));
      setStage(Math.min(4, Math.floor(p / 20)));
    }, 150);

    const formData = new FormData();
    formData.append("file", file);

    const lowerName = file.name.toLowerCase();
    const isVideo = [".mp4", ".avi", ".mkv", ".mov", ".webm", ".m4v"].some((extension) => lowerName.endsWith(extension));
    const endpoint = isVideo ? "video" : "image";

    try {
      const response = await fetch(apiUrl(`/api/crowd/analyze/${endpoint}`), {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(details?.detail || `Upload processing failed (${response.status})`);
      }
      let result = await response.json();

      if (isVideo) {
        setStage(1);
        // Video analysis runs in the backend so YOLO can sample frames without blocking the upload request.
        for (let attempt = 0; attempt < 600; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const resultResponse = await fetch(apiUrl(`/api/crowd/videos/${result.id}/result`));
          if (resultResponse.status === 202) {
            setProgress(Math.min(96, 8 + attempt * 0.7));
            setStage(Math.min(4, 1 + Math.floor(attempt / 12)));
            continue;
          }
          if (!resultResponse.ok) {
            const details = await resultResponse.json().catch(() => null);
            throw new Error(details?.detail || "Video analysis failed");
          }
          result = await resultResponse.json();
          break;
        }
        if (!result.analysis_id) throw new Error("Video analysis timed out");
      }
      
      clearInterval(interval);
      setProgress(100);
      setStage(4);
      
      setTimeout(() => {
        setIsProcessing(false);
        setAnalysisResult(result);
      }, 500);

    } catch (err) {
      clearInterval(interval);
      setIsProcessing(false);
      setProgress(0);
      setUploadError(err instanceof Error ? err.message : "Upload analysis failed. Check that the backend is running on port 8001.");
    }
  };

  const triggerReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {uploadError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <strong>Real upload failed:</strong> {uploadError}
          <div className="mt-1 text-xs text-muted-foreground">The upload was not replaced with demo data. Check the backend terminal for the detailed YOLO/OpenCV error.</div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Crowd Analysis Studio</h1>
          <p className="text-muted-foreground text-sm">Upload crowd imagery or video streams to run localized point-counting, spatial grouping, and evacuation route planning.</p>
        </div>
        {analysisResult && (
          <Button onClick={triggerReset} variant="outline" className="bg-white/5 border-white/10 gap-2">
            <RefreshCw className="w-4 h-4" /> Reset Studio
          </Button>
        )}
      </div>

      {!analysisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Zone */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-white/10 h-96 flex flex-col justify-center">
              <CardContent className="p-6">
                {!isProcessing ? (
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center transition-all duration-300 cursor-pointer h-80",
                      isDragging 
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.02]" 
                        : "border-white/20 hover:border-primary/50 hover:bg-white/5"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                  >
                    <input 
                      id="file-upload-input"
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                      <UploadCloud className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">Upload Footage</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      Drag and drop crowd images (JPG, PNG, WEBP) or videos (MP4, AVI, MKV, MOV, WEBM) to run safety pipeline
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground font-mono">
                      <Badge variant="outline" className="bg-white/5">IMG</Badge>
                      <Badge variant="outline" className="bg-white/5">VIDEO</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 space-y-6 h-80 flex flex-col justify-center max-w-md mx-auto">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg text-primary mb-1 animate-pulse">{stages[stage]}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{Math.round(progress)}% Complete</p>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
                    <div className="space-y-2 pt-4">
                      {stages.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          {stage > i ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : stage === i ? (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-white/20" />
                          )}
                          <span className={cn(stage === i ? "text-white" : stage > i ? "text-muted-foreground" : "text-muted-foreground/30")}>
                            {s}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Model information panels */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Analysis pipeline</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-4">
                <p>CrowdVision operates a dense point query mapping system:</p>
                <div className="space-y-3 font-mono text-xs border border-white/5 bg-black/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">🟢 <span className="text-foreground">YOLO11x Person Detection</span></div>
                  <div className="flex items-center gap-2">🟢 <span className="text-foreground">DBSCAN Grouping</span></div>
                  <div className="flex items-center gap-2">🟢 <span className="text-foreground">Gaussian KDE Heatmap</span></div>
                  <div className="flex items-center gap-2">🟢 <span className="text-foreground">Zone & Exit Dijkstra Planner</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Results Section */
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {analysisResult.visualizations.tracked_video && (
            <Card className="glass border-white/10 overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> YOLO11x Tracked Video</CardTitle>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">PLAYBACK • TRACK IDS</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-black/30">
                <video
                  src={assetUrl(analysisResult.visualizations.tracked_video)}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full max-h-[560px] object-contain"
                  aria-label="YOLO tracked crowd video"
                />
              </CardContent>
            </Card>
          )}

          {/* Top Panel - Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Points localization visualizer */}
            <Card className="glass border-white/10 overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Localization Point Overlay</CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">YOLO11x Person Detections</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-black/30 flex items-center justify-center min-h-[300px] relative aspect-video">
                <img 
                  src={assetUrl(analysisResult.visualizations.points)}
                  alt="Original points localization"
                  className="w-full h-full object-cover max-h-[400px]"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=640";
                  }}
                />
              </CardContent>
            </Card>

            {/* Density mapping visualizer */}
            <Card className="glass border-white/10 overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-accent" /> Continuous Density Map</CardTitle>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Gaussian KDE</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-black/30 flex items-center justify-center min-h-[300px] relative aspect-video">
                <img 
                  src={assetUrl(analysisResult.visualizations.heatmap)}
                  alt="Crowd Density Heatmap"
                  className="w-full h-full object-cover max-h-[400px]"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=640";
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Stats and safety findings grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details panel */}
            <Card className="glass border-white/10 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Spatial metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm text-muted-foreground">People Count</span>
                    <span className="font-mono text-lg font-bold text-white">{analysisResult.people_count}</span>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm text-muted-foreground">Average Density</span>
                    <span className={cn(
                      "font-mono text-sm font-semibold px-2 py-0.5 rounded",
                      analysisResult.density.level === 'CRITICAL' ? 'bg-destructive/20 text-destructive' :
                      analysisResult.density.level === 'HIGH' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                    )}>{analysisResult.density.level}</span>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm text-muted-foreground">Crowd Groups</span>
                    <span className="font-mono text-sm font-bold text-white">{analysisResult.groups} clusters</span>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm text-muted-foreground">Active Hotspots</span>
                    <span className="font-mono text-sm font-bold text-white">{analysisResult.hotspots} zones</span>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm text-muted-foreground">Overall Safety Risk</span>
                    <Badge variant="outline" className={cn(
                      "font-mono text-xs font-semibold px-2 py-0.5",
                      analysisResult.risk.level === 'CRITICAL' ? 'bg-destructive/20 text-destructive border-destructive/30 animate-pulse' :
                      analysisResult.risk.level === 'HIGH' ? 'bg-warning/20 text-warning border-warning/30' : 'bg-success/20 text-success border-success/30'
                    )}>
                      {analysisResult.risk.score}% - {analysisResult.risk.level}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <span className="text-sm text-muted-foreground">Model Confidence</span>
                    <span className="font-mono text-xs text-muted-foreground">{(analysisResult.model_confidence * 100).toFixed(0)}% accuracy</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI operator actions panel */}
            <Card className="glass border-white/10 lg:col-span-2 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-destructive" /> Operator Command Directives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1">
                {/* Safe evacuation route recommendation banner */}
                <div className="border border-white/5 bg-black/40 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive px-2 py-1 rounded text-xs font-bold">AVOID</div>
                    <span className="font-semibold text-white">{analysisResult.recommendation.avoid_exit}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="bg-success/10 border border-success/30 text-success px-2 py-1 rounded text-xs font-bold">PREFERRED</div>
                    <span className="font-semibold text-white">{analysisResult.recommendation.preferred_exit}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{analysisResult.recommendation.reason}</p>
                </div>

                {/* Grid zone details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {analysisResult.zones.map((zone: AnalysisZone, i: number) => (
                    <div key={i} className="border border-white/5 bg-black/20 p-3 rounded-lg text-center">
                      <p className="text-[10px] text-muted-foreground font-mono">{zone.zone_name}</p>
                      <h4 className="text-xl font-bold mt-1">{zone.people_count}</h4>
                      <Badge variant="outline" className={cn(
                        "text-[9px] mt-2",
                        zone.risk_level === 'CRITICAL' ? 'bg-destructive/15 text-destructive border-destructive/20' :
                        zone.risk_level === 'HIGH' ? 'bg-warning/15 text-warning border-warning/20' : 'bg-success/15 text-success border-success/20'
                      )}>{zone.risk_level}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
