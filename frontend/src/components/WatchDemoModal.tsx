"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Activity, ShieldCheck, Flame, Route, Maximize2 } from "lucide-react";
import Link from "next/link";

interface WatchDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WatchDemoModal({ isOpen, onClose }: WatchDemoModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showFlowVectors, setShowFlowVectors] = useState(true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#030712]/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-cyan-300/25 bg-[#070f22]/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-400">
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  CrowdVision AI Engine Demo
                  <span className="rounded-full bg-emerald-400/15 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                    LIVE SIMULATION
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time spatial density estimation & dynamic Dijkstra egress routing
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Simulation Viewport */}
          <div className="relative my-5 h-80 sm:h-96 w-full overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-b from-[#08152c] to-[#040816]">
            {/* Background Stadium Grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(56,189,248,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.2) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Stadium Pitch outline */}
            <div className="absolute inset-x-12 inset-y-10 rounded-3xl border border-sky-400/30">
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-sky-400/25" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full border border-sky-400/30" />
            </div>

            {/* Dynamic Heatmap overlay */}
            {showHeatmap && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-[25%] top-[35%] h-36 w-36 rounded-full bg-rose-500/35 blur-3xl animate-pulse" />
                <div className="absolute right-[22%] top-[30%] h-44 w-44 rounded-full bg-amber-400/25 blur-3xl" />
                <div className="absolute bottom-[20%] left-[45%] h-32 w-32 rounded-full bg-emerald-400/25 blur-3xl" />
              </div>
            )}

            {/* Simulated Moving Crowd Agents */}
            <div className="absolute inset-0 pointer-events-none">
              {[
                { x: 30, y: 40, delay: 0 },
                { x: 34, y: 42, delay: 0.2 },
                { x: 28, y: 46, delay: 0.4 },
                { x: 32, y: 50, delay: 0.1 },
                { x: 65, y: 35, delay: 0.5 },
                { x: 70, y: 38, delay: 0.3 },
                { x: 68, y: 44, delay: 0.6 },
                { x: 48, y: 65, delay: 0.4 },
                { x: 52, y: 70, delay: 0.2 },
              ].map((pt, i) => (
                <motion.div
                  key={i}
                  animate={
                    isPlaying
                      ? {
                          x: [0, (i % 2 === 0 ? 15 : -15), 0],
                          y: [0, (i % 3 === 0 ? -10 : 10), 0],
                        }
                      : {}
                  }
                  transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                  className="absolute flex items-center justify-center"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white shadow-[0_0_8px_#38bdf8]" />
                  </span>
                  {/* Bounding box */}
                  <span className="absolute -inset-2 rounded border border-cyan-400/40" />
                </motion.div>
              ))}
            </div>

            {/* Evacuation Egress vectors */}
            {showFlowVectors && (
              <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100">
                <line x1="30" y1="45" x2="10" y2="20" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2 1" />
                <line x1="70" y1="40" x2="90" y2="20" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2 1" />
                <line x1="50" y1="70" x2="50" y2="90" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 1" />
              </svg>
            )}

            {/* HUD Status Bar in viewport */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-white/10 bg-[#061022]/80 px-4 py-2 text-xs backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  FPS: 60.0
                </span>
                <span className="text-slate-300 font-mono">DETECTED: 1,842</span>
                <span className="text-rose-400 font-mono">CRITICAL NODES: 2</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/20 px-2.5 py-1 text-sky-300 hover:bg-sky-500/30 text-[11px]"
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isPlaying ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] ${
                    showHeatmap
                      ? "border-amber-400/40 bg-amber-500/20 text-amber-300"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  <Flame className="h-3 w-3" /> Heatmap
                </button>
                <button
                  onClick={() => setShowFlowVectors(!showFlowVectors)}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] ${
                    showFlowVectors
                      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  <Route className="h-3 w-3" /> Routing
                </button>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4">
            <p className="text-xs text-slate-400">
              Ready to explore live cameras, historical incident replays, and spatial analytics?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
              >
                Close Demo
              </button>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:brightness-110"
              >
                Launch Live Dashboard →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
