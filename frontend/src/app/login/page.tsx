"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Cpu,
} from "lucide-react";
import CrowdStadiumCanvas from "@/components/CrowdStadiumCanvas";
import { apiUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Cinematic opening sequence states
  const [openingPhase, setOpeningPhase] = useState<"scanning" | "ready">("scanning");

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpeningPhase("ready");
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const handleFillDemo = () => {
    setUsername("admin");
    setPassword("admin123");
    setError("");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const body = new URLSearchParams({ username, password });
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail ?? "Invalid credentials. Please verify your clearance code.");
      }

      localStorage.setItem("access_token", data.access_token);
      setLoginSuccess(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to establish handshake with security backend");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#040814] text-white selection:bg-sky-500/30 flex items-center justify-center p-4 sm:p-6">
      {/* 3D Wireframe Stadium Arena with Dynamic Crowd Particles */}
      <CrowdStadiumCanvas mode="login" interactive={true} intensity={1.15} />

      {/* Atmospheric Vignette & Deep Blue Shimmer Glow */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_40%,rgba(14,40,84,0.35)_0%,rgba(4,8,20,0.85)_80%)]" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-[#040814]/60 via-transparent to-[#040814]/90" />

      {/* Top Bar with Back Navigation */}
      <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#09152e]/70 px-4 py-2 text-xs font-medium text-slate-300 shadow-lg backdrop-blur-xl transition-all hover:border-sky-400/40 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Arena Overview
        </Link>

        {/* Live Security Node Telemetry */}
        <div className="hidden sm:flex items-center gap-3 rounded-full border border-sky-400/20 bg-[#071329]/80 px-4 py-1.5 text-[11px] font-mono text-sky-300 backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            GATEWAY: ONLINE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">LATENCY: 14ms</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">AGENTS: 3,420 TRACKED</span>
        </div>
      </div>

      {/* OPENING ANIMATION SEQUENCE & LOGIN CONSOLE */}
      <div className="relative z-20 w-full max-w-[480px]">
        {/* Holographic Scanner Aperture during opening */}
        <AnimatePresence>
          {openingPhase === "scanning" && (
            <motion.div
              initial={{ opacity: 1, scale: 0.8 }}
              exit={{ opacity: 0, scale: 1.15 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30"
            >
              <div className="relative flex h-32 w-32 items-center justify-center">
                <span className="absolute h-full w-full rounded-full border-2 border-sky-400/60 animate-ping" />
                <span className="absolute h-24 w-24 rounded-full border border-cyan-300/80 animate-spin" />
                <Shield className="h-10 w-10 text-sky-400 animate-pulse" />
              </div>
              <p className="mt-4 font-mono text-xs tracking-widest text-sky-300 uppercase">
                Synchronizing Crowd Neural Feed...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN CYBER CONSOLE CONTAINER */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{
            opacity: openingPhase === "ready" ? 1 : 0.15,
            y: openingPhase === "ready" ? 0 : 20,
            scale: openingPhase === "ready" ? 1 : 0.95,
          }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.2 }}
          className="relative overflow-hidden rounded-[30px] border border-sky-400/25 bg-[#071126]/85 p-7 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
        >
          {/* Futuristic Corner Brackets */}
          <div className="absolute top-3 left-3 h-3 w-3 border-t-2 border-l-2 border-sky-400/70" />
          <div className="absolute top-3 right-3 h-3 w-3 border-t-2 border-r-2 border-sky-400/70" />
          <div className="absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-sky-400/70" />
          <div className="absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-sky-400/70" />

          {/* Top glowing ambient accent */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-36 w-3/4 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />

          {/* Brand & Title */}
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-500/15 shadow-[0_0_25px_rgba(56,189,248,0.35)]">
              <Shield className="h-7 w-7 text-sky-400" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[#040814]">
                <Cpu className="h-2.5 w-2.5" />
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Operator Access Portal
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Authenticate clearance to inspect real-time crowd dynamics
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator ID Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="text-[11px] font-semibold tracking-wider text-sky-200/80 uppercase"
              >
                Operator Identity
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#091734]/80 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition-all focus:border-sky-400/60 focus:bg-[#0c1f44] focus:outline-none focus:ring-1 focus:ring-sky-400/40"
                />
              </div>
            </div>

            {/* Clearance Code (Password) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[11px] font-semibold tracking-wider text-sky-200/80 uppercase"
                >
                  Clearance Code
                </label>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                >
                  <Zap className="h-3 w-3" /> Auto-fill Demo
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#091734]/80 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 transition-all focus:border-sky-400/60 focus:bg-[#0c1f44] focus:outline-none focus:ring-1 focus:ring-sky-400/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200"
              >
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Animation banner */}
            {loginSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/20 p-3 text-xs font-semibold text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Clearance Verified. Decrypting Command Interface...</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loginSuccess}
              className="relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-semibold text-white shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all duration-300 hover:from-sky-400 hover:to-blue-500 hover:shadow-[0_0_35px_rgba(56,189,248,0.6)] disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : loginSuccess ? (
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Authorized</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  <span>Authorize & Enter Console</span>
                </div>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Footer Pill */}
          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Demo Credentials:{" "}
              <code className="rounded bg-sky-500/10 px-1.5 py-0.5 font-mono text-sky-300">
                admin
              </code>{" "}
              /{" "}
              <code className="rounded bg-sky-500/10 px-1.5 py-0.5 font-mono text-sky-300">
                admin123
              </code>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
