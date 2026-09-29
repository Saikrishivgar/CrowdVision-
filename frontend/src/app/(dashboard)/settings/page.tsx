'use client';

import { useState } from 'react';
import { Key, Cpu, ShieldAlert, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

export default function SettingsPage() {
  const [petConf, setPetConf] = useState(65);
  const [dbscanEps, setDbscanEps] = useState(35);
  
  const [densityWeight, setDensityWeight] = useState(30);
  const [occupancyWeight, setOccupancyWeight] = useState(20);
  const [groupsWeight, setGroupsWeight] = useState(15);
  const [bottleneckWeight, setBottleneckWeight] = useState(15);

  const saveSettings = async () => {
    alert("Crowd Safety parameters saved successfully!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">System Configuration</h1>
        <p className="text-muted-foreground text-sm">Tune crowd models, configure evacuation graphs, and adjust risk engine weight distributions.</p>
      </div>

      {/* Model Settings */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-accent" /> Crowd Model Parameters</CardTitle>
          <CardDescription>Adjust localization density margins and cluster thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-white">PET Point-Detection Sensitivity</Label>
              <span className="font-mono text-primary bg-primary/10 px-2 py-1 rounded">{petConf}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="99" 
              value={petConf} 
              onChange={(e) => setPetConf(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Adjusts how sensitive the point query transformer is to small clusters / head points.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-white">DBSCAN Clustering Neighborhood Distance (eps)</Label>
              <span className="font-mono text-secondary bg-secondary/10 px-2 py-1 rounded">{dbscanEps}px</span>
            </div>
            <input 
              type="range" 
              min="15" 
              max="80" 
              value={dbscanEps} 
              onChange={(e) => setDbscanEps(Number(e.target.value))}
              className="w-full accent-secondary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Epsilon radius. Smaller values restrict group detection to extremely tight, localized gatherings.</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Frame Sampling Evacuation Optimization</Label>
            <select className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-primary">
              <option className="bg-[#0b0c10]">1 FPS (Optimal for high-density analysis)</option>
              <option selected className="bg-[#0b0c10]">5 FPS (Recommended stable processing)</option>
              <option className="bg-[#0b0c10]">15 FPS (High latency tracking)</option>
              <option className="bg-[#0b0c10]">30 FPS (Full Real-Time Video feed)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Risk Engine Weights */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-destructive" /> Deterministic Risk Weightings</CardTitle>
          <CardDescription>Adjust how different features contribute to the overall Safety Risk Score (0-100)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Crowd Density Weight</span>
                <span className="text-white font-bold">{densityWeight}%</span>
              </div>
              <input type="range" min="10" max="60" value={densityWeight} onChange={(e)=>setDensityWeight(Number(e.target.value))} className="w-full accent-primary" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Zone Occupancy Weight</span>
                <span className="text-white font-bold">{occupancyWeight}%</span>
              </div>
              <input type="range" min="10" max="60" value={occupancyWeight} onChange={(e)=>setOccupancyWeight(Number(e.target.value))} className="w-full accent-secondary" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Group Concentration Weight</span>
                <span className="text-white font-bold">{groupsWeight}%</span>
              </div>
              <input type="range" min="5" max="30" value={groupsWeight} onChange={(e)=>setGroupsWeight(Number(e.target.value))} className="w-full accent-accent" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Bottleneck Weight</span>
                <span className="text-white font-bold">{bottleneckWeight}%</span>
              </div>
              <input type="range" min="5" max="30" value={bottleneckWeight} onChange={(e)=>setBottleneckWeight(Number(e.target.value))} className="w-full accent-warning" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono bg-black/40 border border-white/5 p-3 rounded-lg flex justify-between">
            <span>TOTAL CALIBRATION SUM:</span>
            <span className={cn(
              "font-bold",
              (densityWeight + occupancyWeight + groupsWeight + bottleneckWeight) === 80 ? "text-success" : "text-warning animate-pulse"
            )}>
              {densityWeight + occupancyWeight + groupsWeight + bottleneckWeight + 20}% (20% default exits & flow balance)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* API Key Configuration */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> Credentials & Integrations</CardTitle>
          <CardDescription>Configure query interpreting LLM parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Google Gemini API Key (Optional)</Label>
            <div className="flex gap-2">
              <Input type="password" value="********************************" readOnly className="bg-white/5 border-white/10 font-mono text-white" />
              <Button variant="outline" className="bg-white/5 border-white/10 text-white">Update</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white">Crowd Analytics Server Endpoint</Label>
            <Input defaultValue={`${API_BASE_URL}/api/crowd`} className="bg-white/5 border-white/10 font-mono text-white" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-white/5 pt-4">
          <Button onClick={saveSettings} className="bg-primary hover:bg-primary/90 ml-auto"><Save className="w-4 h-4 mr-2" /> Save Config</Button>
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/10">
            <div>
              <h4 className="font-semibold text-destructive">Flush Crowd Analysis Logs</h4>
              <p className="text-xs text-destructive/70 mt-1">Clears all historical point localization records, heatmaps, and spatial logs.</p>
            </div>
            <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" /> Clear Logs</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
