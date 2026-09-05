"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamingHero } from "@/components/streaming-hero";

export function LandingHero({ onSignUp }: { onSignUp?: () => void }) {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Background ambient lighting */}
      <div 
        className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] blur-[120px] rounded-full bg-green-500/15 dark:bg-signal/30"
      />

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center relative z-10">
        {/* Left Column: Value proposition */}
        <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start relative z-10">
          <Badge 
            variant="outline" 
            className="px-3 py-1 rounded-full border-signal/20 bg-signal/5 text-foreground backdrop-blur-sm gap-2 shadow-sm dark:shadow-lg dark:shadow-signal/10"
          >
            <span className="flex h-2 w-2 rounded-full bg-signal animate-pulse shadow-sm dark:shadow-[0_0_8px_var(--color-signal)]" />
            <span className="text-xs font-medium tracking-tight">Orbit Engine 2.0 · Sub-40ms P2P</span>
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-normal leading-[1.02] tracking-[-0.04em] text-foreground">
            Meetings that{" "}
            <span className="italic relative inline-block text-signal">
              feel
              <svg 
                className="absolute -bottom-1.5 left-0 w-full" 
                viewBox="0 0 100 8" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1 5.5C25 2 75 2 99 5.5" stroke="var(--color-signal)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </span>{" "}
            in the room.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
            Crystal-clear 4K video, zero-latency spatial audio, and end-to-end encryption. Built intentionally for remote teams that demand high agency and zero clutter.
          </p>

          {/* Primary CTA Cluster */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto">
            <Button
              size="lg"
              onClick={onSignUp}
              className="relative overflow-hidden group bg-signal hover:bg-signal-muted text-white font-medium text-sm px-8 h-12 rounded-full shadow-lg shadow-signal/20 dark:shadow-signal/20 hover:shadow-xl hover:shadow-signal/30 dark:hover:shadow-signal/40 transition-all duration-300 active:scale-95 gap-2"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-in-out skew-x-12" />
              <span className="relative z-10 flex items-center gap-2">
                Start free meeting
                <ArrowRight size={16} />
              </span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 rounded-full text-sm font-medium border-border/80 hover:bg-secondary/60 backdrop-blur-sm transition-all hover:border-signal/30 hover:text-foreground"
            >
              Watch 2-min demo
            </Button>
          </div>

          {/* Social Proof & Guarantee */}
          <div className="pt-6 mt-2 flex items-center gap-4 text-left border-t border-border/50 w-full max-w-md">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                alt="User"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                alt="User"
              />
              <img
                className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="User"
              />
            </div>
            <div className="text-xs text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">Loved by 14,000+ engineers</span>
              <br />
              No card required · WebRTC Native
            </div>
          </div>
        </div>

        {/* Right Column: Hero interactive video room preview with Orbital branding */}
        <div className="relative flex justify-center items-center lg:h-[600px] w-full mt-10 lg:mt-0">
          
          {/* Orbital Rings Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {/* Inner Orbit */}
             <div className="absolute w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] border border-foreground/5 dark:border-foreground/10 rounded-full animate-[spin_120s_linear_infinite]" />
             
             {/* Middle Orbit with planet */}
             <div className="absolute w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] border border-foreground/[0.03] dark:border-foreground/5 rounded-full animate-[spin_80s_linear_infinite] reverse">
                 <div className="absolute top-[15%] left-[10%] w-1.5 h-1.5 rounded-full bg-foreground/20" />
             </div>
             
             {/* Outer Orbit with shining planet */}
             <div className="absolute w-[600px] h-[600px] sm:w-[850px] sm:h-[850px] border border-foreground/5 dark:border-foreground/10 rounded-full border-dashed animate-[spin_40s_linear_infinite]">
                 {/* Glowing Signal Planet */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-signal shadow-[0_0_15px_var(--color-signal)]" />
                 <div className="absolute bottom-1/4 right-0 w-2 h-2 rounded-full bg-foreground/20" />
             </div>
             
             {/* Central Glow */}
             <div className="absolute w-[200px] h-[200px] bg-green-500/15 dark:bg-signal/15 blur-[80px] rounded-full" />
          </div>

          {/* Decorative floating stats chips */}
          <div className="hidden sm:flex absolute top-4 -right-4 z-20 items-center gap-2 px-3 py-1.5 rounded-xl bg-background/90 border border-border shadow-xl backdrop-blur-md animate-[panel-in_1s_ease-out_both] [animation-delay:0.5s]">
            <span className="w-2 h-2 rounded-full bg-signal shadow-sm dark:shadow-[0_0_8px_var(--color-signal)]" />
            <span className="text-xs font-mono font-medium text-foreground">34ms latency</span>
          </div>

          <div className="hidden sm:flex absolute bottom-8 -left-6 z-20 items-center gap-2 px-3 py-2 rounded-xl bg-background/90 border border-border shadow-xl backdrop-blur-md animate-[panel-in_1s_ease-out_both] [animation-delay:0.7s]">
            <Sparkles size={14} className="text-signal" />
            <div className="text-[11px] leading-tight font-medium text-foreground">
              AI Noise Suppression
              <span className="block text-[10px] text-muted-foreground font-mono">Crisp acoustics</span>
            </div>
          </div>

          {/* Video Mockup */}
          <div className="relative z-10 w-full max-w-[560px] mx-auto group">
            {/* Glowing Backdrop */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-green-500/15 via-green-500/5 to-transparent dark:from-signal/20 dark:via-signal/5 rounded-[2rem] blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative shadow-2xl shadow-foreground/5 rounded-[1.5rem] ring-1 ring-border/50 bg-background overflow-hidden">
              <StreamingHero />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}