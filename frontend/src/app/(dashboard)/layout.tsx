'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Search, Film, Video, ShieldAlert, 
  LineChart, Settings, Shield, Bell, Menu, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Upload', href: '/upload', icon: Film },
  { name: 'Cameras', href: '/cameras', icon: Video },
  { name: 'Incidents', href: '/incidents', icon: ShieldAlert },
  { name: 'Analytics', href: '/analytics', icon: LineChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <motion.aside 
        animate={{ width: collapsed ? 80 : 280 }}
        className="hidden md:flex flex-col border-r border-border glass bg-black/40 z-20 transition-all duration-300"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
          <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center w-full")}>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] group">
              <Shield className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            {!collapsed && <span className="font-bold text-lg whitespace-nowrap text-glow">CrowdVision AI</span>}

          </div>
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground">
              <Menu className="w-4 h-4" />
            </Button>
          )}
          {collapsed && (
            <button className="absolute inset-0 w-full h-full" onClick={() => setCollapsed(false)}>
              <span className="sr-only">Expand</span>
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive ? "text-primary bg-primary/10 font-medium" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "group-hover:text-foreground")} />
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className={cn("p-4 border-t border-border/50", collapsed && "flex justify-center")}>
          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
            <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <User className="w-5 h-5 text-secondary" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">Operator 07</p>
                <p className="text-xs text-muted-foreground truncate">Level 4 Clearance</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]" />
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border glass bg-black/20 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize tracking-tight hidden sm:block">
              {pathname.split('/').pop() || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-muted-foreground gap-10 hover:bg-white/10 transition-colors cursor-pointer group">
              <span className="flex items-center gap-2"><Search className="w-4 h-4 text-primary group-hover:animate-pulse" /> Global Search...</span>
              <kbd className="hidden sm:inline-flex bg-white/10 px-1.5 py-0.5 rounded text-xs">⌘K</kbd>
            </div>
            
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
