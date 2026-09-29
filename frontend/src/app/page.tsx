"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Home,
  Tv,
  BarChart3,
  Clock,
  Settings2,
  ArrowRight,
  Play,
  Sparkles,
} from "lucide-react";
import CrowdStadiumCanvas from "@/components/CrowdStadiumCanvas";
import { FeatureCards } from "@/components/FeatureCards";
import { WatchDemoModal } from "@/components/WatchDemoModal";

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState("home");
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const navItems = [
    { id: "home", icon: Home, label: "Overview", href: "/" },
    { id: "cameras", icon: Tv, label: "Live Feeds", href: "/cameras" },
    { id: "analytics", icon: BarChart3, label: "Analytics", href: "/analytics" },
    { id: "history", icon: Clock, label: "Incidents", href: "/incidents" },
    { id: "settings", icon: Settings2, label: "Topology", href: "/settings" },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#040814] text-white selection:bg-sky-500/30 font-sans">
      {/* 3D Wireframe Amphitheater Stadium with Moving Crowd Particles */}
      <CrowdStadiumCanvas mode="landing" interactive={true} intensity={1.1} />

      {/* Atmospheric Vignette & Deep Blue Shimmer Glow */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_50%_15%,rgba(14,40,84,0.45)_0%,rgba(4,8,20,0.85)_75%)]" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-[#040814]/40 via-transparent to-[#040814]/90" />

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.25)] backdrop-blur-md transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5 text-sky-400" />
            <span className="absolute inset-0 rounded-xl bg-sky-400/10 blur-sm" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            CrowdVision AI
          </span>
        </Link>

        {/* Center Floating Glassmorphism Pill Navigation */}
        <nav className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-[#09152e]/70 px-2 py-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveNav(item.id)}
                className={`relative flex h-9 w-10 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
                {isActive && (
                  <motion.span
                    layoutId="activePill"
                    className="absolute inset-0 rounded-full border border-sky-400/40"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="relative inline-flex items-center justify-center rounded-full border border-sky-400/40 bg-gradient-to-r from-sky-500/20 to-blue-600/30 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.25)] backdrop-blur-md transition-all duration-300 hover:border-sky-300 hover:bg-sky-500/30 hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] hover:scale-[1.02]"
          >
            Launch Dashboard
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-12 pb-16 text-center lg:pt-16 lg:pb-24">
        {/* Status Pill Badge: "• System Online & Indexing" */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-sky-400/25 bg-[#0a1836]/80 px-4 py-1.5 text-xs font-medium text-sky-200 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
          </span>
          <span>System Online & Indexing</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.08]"
        >
          <span className="block text-white">AI-Powered</span>
          <span className="bg-gradient-to-r from-white via-sky-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(56,189,248,0.35)]">
            Crowd Intelligence
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300/90 font-normal"
        >
          Transform raw camera feeds into real-time crowd dynamics. Automatically estimate
          density, count dense gatherings, detect spatial groups, and optimize evacuation routing.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/dashboard"
            className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-7 text-sm font-semibold text-white shadow-[0_0_30px_rgba(56,189,248,0.35)] transition-all duration-300 hover:from-sky-400 hover:to-blue-500 hover:shadow-[0_0_40px_rgba(56,189,248,0.6)] hover:scale-[1.02]"
          >
            Access Command Center
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <button
            onClick={() => setIsDemoOpen(true)}
            className="group flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-medium text-slate-200 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-sky-400/40 hover:bg-white/[0.08] hover:text-white"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10">
              <Play className="h-3 w-3 text-sky-300 fill-sky-300/40" />
            </div>
            Watch Demo
          </button>
        </motion.div>
      </section>

      {/* BOTTOM 4 FEATURE CARDS */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <FeatureCards />
      </section>

      {/* WATCH DEMO MODAL */}
      <WatchDemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </main>
  );
}
