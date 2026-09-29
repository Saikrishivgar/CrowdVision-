"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Eye, Network, ArrowUpRight, Compass, ShieldAlert, Route } from "lucide-react";
import Link from "next/link";

export function FeatureCards() {
  const [activeQuery, setActiveQuery] = useState("");

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 w-full">
      {/* CARD 1: Crowd Intel Search */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.05 }}
        whileHover={{ y: -5, borderColor: "rgba(56, 189, 248, 0.45)" }}
        className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-white/10 bg-[#070f22]/75 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300"
      >
        {/* Top visual graphic with 3D isometric grid & magnifying lens */}
        <div className="relative mb-5 h-44 w-full overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-b from-[#0a1836] to-[#040915] p-3">
          {/* Mini search input pill */}
          <div className="relative z-20 flex items-center gap-2 rounded-full border border-sky-400/25 bg-[#0a1b38]/90 px-3 py-1.5 text-xs text-sky-200 shadow-lg backdrop-blur-md">
            <Search className="h-3.5 w-3.5 text-sky-400" />
            <input
              type="text"
              placeholder="live query..."
              value={activeQuery}
              onChange={(e) => setActiveQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* 3D Isometric grid & Pin with Magnifying Lens */}
          <div className="absolute inset-0 flex items-center justify-center pt-5">
            {/* Isometric terrain plane */}
            <div
              className="relative h-28 w-44 rounded-xl border border-sky-500/25 bg-sky-950/20 shadow-inner"
              style={{
                transform: "rotateX(55deg) rotateZ(-25deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Grid lines */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              />

              {/* Glowing node point & pulsing waves */}
              <div className="absolute left-[45%] top-[40%] flex items-center justify-center">
                <span className="relative flex h-5 w-5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                  <span className="relative inline-flex h-5 w-5 rounded-full bg-sky-500 shadow-[0_0_12px_#38bdf8]" />
                </span>
              </div>
            </div>

            {/* Floating Magnifying Glass Lens Graphic */}
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute z-10 flex h-24 w-24 items-center justify-center"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-sky-300/80 bg-sky-400/10 shadow-[0_0_24px_rgba(56,189,248,0.6)] backdrop-blur-md">
                <div className="h-9 w-9 rounded-full border border-sky-200/40 bg-sky-500/20 flex items-center justify-center">
                  <Compass className="h-5 w-5 text-sky-200 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                {/* Lens handle */}
                <div className="absolute bottom-[-10px] right-[-10px] h-6 w-2.5 rotate-[-45deg] rounded-full border border-sky-300/60 bg-gradient-to-b from-sky-400 to-sky-700 shadow-md" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/15 text-sky-400">
                <Search className="h-4 w-4" />
              </span>
              <h3 className="font-semibold text-white tracking-tight text-base">Crowd Intel Search</h3>
            </div>
            <Link href="/search" className="text-slate-400 hover:text-sky-300 transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-slate-300/90 italic border-l-2 border-sky-400/40 pl-2.5 mt-2">
            &ldquo;Which exit is currently the least crowded and safe to use?&rdquo;
          </p>
        </div>
      </motion.div>

      {/* CARD 2: Density Heatmapping */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.12 }}
        whileHover={{ y: -5, borderColor: "rgba(56, 189, 248, 0.45)" }}
        className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-white/10 bg-[#070f22]/75 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300"
      >
        {/* Top 3D Topographic Gaussian Heatmap visual */}
        <div className="relative mb-5 h-44 w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-[#08172d] to-[#040816] flex items-center justify-center p-3">
          {/* Subtle Grid floor */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(rgba(52,211,153,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.2) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* 3D Gaussian topographic elevation mesh representation */}
          <div
            className="relative flex items-center justify-center w-full h-full"
            style={{ transform: "perspective(300px) rotateX(40deg)" }}
          >
            {/* Multi-tier Gaussian Contour Rings */}
            <div className="relative flex items-center justify-center">
              {/* Base blue level */}
              <div className="h-28 w-44 rounded-[40px] border border-blue-500/40 bg-blue-600/10 shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center justify-center">
                {/* Cyan level */}
                <div className="h-22 w-34 rounded-[32px] border border-cyan-400/50 bg-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center">
                  {/* Green level */}
                  <div className="h-16 w-24 rounded-[24px] border border-emerald-400/60 bg-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center">
                    {/* Yellow/Orange level */}
                    <div className="h-11 w-15 rounded-[18px] border border-amber-400/80 bg-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center">
                      {/* Critical Red Peak */}
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-6 w-8 rounded-full border border-rose-300 bg-rose-500 shadow-[0_0_15px_#f43f5e]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sparkle particle points floating above the heatmap */}
            <div className="absolute inset-0 pointer-events-none">
              <span className="absolute top-[20%] left-[30%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-ping" />
              <span className="absolute top-[25%] right-[25%] h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-pulse" />
              <span className="absolute bottom-[20%] right-[35%] h-1 w-1 rounded-full bg-emerald-300 shadow-[0_0_6px_#34d399]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/15 text-emerald-400">
                <Zap className="h-4 w-4" />
              </span>
              <h3 className="font-semibold text-white tracking-tight text-base">Density Heatmapping</h3>
            </div>
            <Link href="/analytics" className="text-slate-400 hover:text-emerald-300 transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-slate-400 mt-2">
            Generate real-time point-density maps with Gaussian KDE evaluation.
          </p>
        </div>
      </motion.div>

      {/* CARD 3: Safe Exit Routing */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.18 }}
        whileHover={{ y: -5, borderColor: "rgba(56, 189, 248, 0.45)" }}
        className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-white/10 bg-[#070f22]/75 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300"
      >
        {/* Top Safe Exit Routing Isometric Graph */}
        <div className="relative mb-5 h-44 w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-[#081a2f] to-[#040816] flex items-center justify-center p-3">
          {/* Isometric Routing SVG Map */}
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{ transform: "perspective(400px) rotateX(45deg) rotateZ(-18deg)" }}
          >
            {/* Grid Floor */}
            <div
              className="absolute h-36 w-44 rounded-xl border border-emerald-500/20 bg-[#061426]/60 shadow-inner"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(16,185,129,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.2) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />

            {/* Evacuation Routing Vector Lines */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 120">
              {/* Primary Green Escape Route */}
              <polyline
                points="20,95 65,70 100,70 140,25"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                className="animate-pulse"
              />
              <polyline
                points="65,70 65,30 95,15"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* Congested Path (Red) */}
              <polyline
                points="100,70 115,85 140,85"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />

              {/* Safe Exit Nodes */}
              <circle cx="140" cy="25" r="4" fill="#34d399" />
              <circle cx="95" cy="15" r="3.5" fill="#34d399" />

              {/* Congestion Hotspot Node */}
              <circle cx="115" cy="85" r="5" fill="#f43f5e" className="animate-ping" />
              <circle cx="115" cy="85" r="3" fill="#f43f5e" />
            </svg>

            {/* Congestion Tag badge */}
            <div className="absolute right-4 top-8 flex items-center gap-1 rounded bg-rose-500/20 border border-rose-500/50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              congestion
            </div>

            {/* Safe Exit Arrow */}
            <div className="absolute right-3 top-2 text-emerald-400 flex items-center text-[10px] font-bold">
              EXIT →
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/15 text-emerald-400">
                <Route className="h-4 w-4" />
              </span>
              <h3 className="font-semibold text-white tracking-tight text-base">Safe Exit Routing</h3>
            </div>
            <Link href="/incidents" className="text-slate-400 hover:text-emerald-300 transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-slate-400 mt-2">
            Dijkstra-based evacuation routing with dynamic crowd penalty scaling.
          </p>
        </div>
      </motion.div>

      {/* CARD 4: Spatial Clustering */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.24 }}
        whileHover={{ y: -5, borderColor: "rgba(56, 189, 248, 0.45)" }}
        className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-white/10 bg-[#070f22]/75 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300"
      >
        {/* Top 3D Spatial Clustering Spheres */}
        <div className="relative mb-5 h-44 w-full overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-[#0b1430] to-[#040816] flex items-center justify-center p-3">
          {/* 3D Clustered Spheres composition */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Ambient cluster node connects */}
            <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 160 120">
              <line x1="50" y1="65" x2="105" y2="45" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="105" y1="45" x2="115" y2="80" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50" y1="65" x2="60" y2="90" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            {/* Red dense cluster sphere (spiky/textured look) */}
            <motion.div
              animate={{ y: [0, -4, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-7 top-6 h-16 w-16 rounded-full bg-gradient-to-br from-rose-400 via-rose-600 to-rose-950 p-1 shadow-[0_0_25px_rgba(244,63,94,0.6)]"
              style={{
                backgroundImage: "radial-gradient(circle at 35% 35%, #fb7185 0%, #e11d48 50%, #4c0519 100%)",
              }}
            >
              {/* Textured cluster points overlay */}
              <div className="h-full w-full rounded-full border border-rose-300/40 opacity-70 flex items-center justify-center">
                <span className="text-[10px] font-mono text-white/90 font-bold">C1: 84</span>
              </div>
            </motion.div>

            {/* Green cluster sphere */}
            <motion.div
              animate={{ y: [0, 5, 0], rotate: [0, -6, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-10 top-7 h-10 w-10 rounded-full shadow-[0_0_18px_rgba(16,185,129,0.5)]"
              style={{
                backgroundImage: "radial-gradient(circle at 35% 35%, #34d399 0%, #059669 60%, #022c22 100%)",
              }}
            >
              <div className="h-full w-full rounded-full border border-emerald-300/40 flex items-center justify-center">
                <span className="text-[8px] font-mono text-white font-bold">C2</span>
              </div>
            </motion.div>

            {/* Amber cluster sphere */}
            <motion.div
              animate={{ y: [0, -3, 0], x: [0, 2, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-14 bottom-4 h-9 w-9 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              style={{
                backgroundImage: "radial-gradient(circle at 35% 35%, #fbbf24 0%, #d97706 60%, #451a03 100%)",
              }}
            >
              <div className="h-full w-full rounded-full border border-amber-300/40 flex items-center justify-center">
                <span className="text-[8px] font-mono text-white font-bold">C3</span>
              </div>
            </motion.div>

            {/* Small scattered satellite points */}
            <span className="absolute left-6 bottom-8 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
            <span className="absolute left-20 bottom-4 h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-500/15 text-indigo-400">
                <Network className="h-4 w-4" />
              </span>
              <h3 className="font-semibold text-white tracking-tight text-base">Spatial Clustering</h3>
            </div>
            <Link href="/analytics" className="text-slate-400 hover:text-indigo-300 transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-slate-400 mt-2">
            DBSCAN spatial clustering to classify active crowd grouping and densities.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
