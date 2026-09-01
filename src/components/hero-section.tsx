"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Video,
  Sparkles,
  ShieldCheck,
  Phone,
  FileText,
  Bot,
  Mic,
  Share2,
  PhoneOff,
  CheckCircle2,
  Zap,
  Lock,
  Layers,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const triggerEmoji = (emoji: string) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 2000);
  };

  return (
    <section className="relative pt-28 sm:pt-36 pb-20 overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Background Ambient Glows Theme Adaptive */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 dark:bg-primary/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-400/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

      {/* Main Hero Header */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        {/* Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium shadow-2xs hover:bg-primary/15 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Orbit AI Work Platform v2.4</span>
          <span className="w-1 h-1 rounded-full bg-primary/60" />
          <span className="text-muted-foreground">Sub-100ms WebRTC</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]"
        >
          Find out what&apos;s possible <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-500 dark:from-primary dark:via-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            when work connects
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Bridge the gap between talking and doing with the AI-first work platform built for modern teams.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <Link
            href="/join"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore products</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-full bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Find your plan</span>
          </Link>
        </motion.div>
      </div>

      {/* Feature Cards Carousel / Bento Gallery */}
      <div className="relative z-10 mt-14 sm:mt-18 px-4 sm:px-8 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-5 overflow-x-auto pb-8 pt-4 no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {/* Card 1: Meetings (Vibrant Theme Card with Video Surface) */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="snap-center shrink-0 w-[320px] sm:w-[360px] h-[460px] rounded-3xl bg-card border border-border/80 p-5 flex flex-col justify-between shadow-lg hover:shadow-xl hover:border-primary/50 transition-all relative overflow-hidden group"
          >
            {/* Card Title */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="p-2 rounded-xl bg-primary/15 text-primary">
                <Video className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-foreground">Meetings</span>
            </div>

            {/* Simulated Live Video Panel (Dark Room Surface in both light/dark themes) */}
            <div className="relative flex-1 my-4 bg-[#0A0B0D] text-[#ECEDF0] rounded-2xl border border-[#2E333D] p-3 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Main Speaker Frame */}
              <div className="relative flex-1 bg-gradient-to-br from-[#12141A] to-[#1F232B] rounded-xl overflow-hidden flex items-center justify-center border-2 border-primary/80 shadow-md">
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sydney Ren (Host)
                </div>

                {/* Reaction Action Buttons */}
                <div className="flex items-center gap-3 z-10">
                  <button
                    type="button"
                    onClick={() => triggerEmoji("😊")}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-lg hover:scale-110 transition-transform"
                    aria-label="Send smile reaction"
                  >
                    😊
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerEmoji("👏")}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-lg hover:scale-110 transition-transform"
                    aria-label="Send clap reaction"
                  >
                    👏
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerEmoji("🔥")}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-lg hover:scale-110 transition-transform"
                    aria-label="Send fire reaction"
                  >
                    🔥
                  </button>
                </div>

                {/* Flying Emoji Reaction */}
                {activeReaction && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.5 }}
                    animate={{ opacity: 1, y: -50, scale: 1.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="absolute z-30 text-3xl pointer-events-none"
                  >
                    {activeReaction}
                  </motion.div>
                )}
              </div>

              {/* Grid view tiles */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="h-18 rounded-lg bg-[#12141A] border border-[#2E333D] flex items-center justify-center">
                  <span className="text-[11px] font-mono text-[#9AA0AC]">Brian Ayers</span>
                </div>
                <div className="h-18 rounded-lg bg-[#12141A] border border-[#2E333D] flex items-center justify-center">
                  <span className="text-[11px] font-mono text-[#9AA0AC]">Jane Harper</span>
                </div>
              </div>

              {/* In-Call Controls */}
              <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-[#2E333D] text-[#ECEDF0]">
                <div className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <div className="p-2 rounded-lg bg-destructive text-destructive-foreground">
                  <PhoneOff className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: My Notes & AI Transcripts */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="snap-center shrink-0 w-[320px] sm:w-[360px] h-[460px] rounded-3xl bg-card border border-border/80 p-5 flex flex-col justify-between shadow-lg hover:shadow-xl hover:border-primary/50 transition-all relative overflow-hidden group"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="p-2 rounded-xl bg-primary/15 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-foreground">My Notes</span>
            </div>

            {/* Transcript UI */}
            <div className="my-4 flex-1 bg-secondary/60 rounded-2xl border border-border p-4 font-sans text-xs space-y-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-border text-muted-foreground font-mono text-[10px]">
                <span>Patrick&apos;s Note — 03.21.2026</span>
                <span className="text-primary font-semibold">Live Sync</span>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-foreground block">Transcript</span>

                <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">Speaker 1</span>
                    <span className="text-[10px] font-mono text-muted-foreground">02:00:31</span>
                  </div>
                  <p className="text-muted-foreground leading-snug">
                    Shawn & Owen met with company executives Rob and Max regarding Q3 budget allocation.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Speaker 2</span>
                    <span className="text-[10px] font-mono text-muted-foreground">06:26:20</span>
                  </div>
                  <p className="text-muted-foreground leading-snug">
                    Share budget expectations with Rob before Friday EOD.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Auto-saved to Orbit Cloud Workspace</span>
            </div>
          </motion.div>

          {/* Card 3: OrbitMate AI Copilot */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="snap-center shrink-0 w-[320px] sm:w-[360px] h-[460px] rounded-3xl bg-card border border-border/80 p-5 flex flex-col justify-between shadow-lg hover:shadow-xl hover:border-primary/50 transition-all relative overflow-hidden group"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="p-2 rounded-xl bg-primary/15 text-primary">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-foreground">OrbitMate AI</span>
            </div>

            {/* Prompt & Analysis UI */}
            <div className="my-4 flex-1 space-y-3">
              <div className="bg-secondary/80 border border-border rounded-2xl p-3 flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-sm">+</span>
                <input
                  type="text"
                  readOnly
                  value="Anything to complete?"
                  className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full cursor-default"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-[11px] font-medium text-primary border border-primary/20 flex items-center gap-1.5 cursor-pointer hover:bg-primary/15 transition-colors">
                  <Video className="w-3 h-3" /> Drive meeting
                </span>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-[11px] font-medium text-primary border border-primary/20 flex items-center gap-1.5 cursor-pointer hover:bg-primary/15 transition-colors">
                  <FileText className="w-3 h-3" /> Build slides
                </span>
              </div>

              <div className="bg-secondary/60 border border-border rounded-2xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Meeting Analysis</span>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Analyzed 45 minutes of discussion. Extracted 3 main key decisions & 4 follow-up tasks.
                </p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              Start from 20+ smart meeting templates →
            </div>
          </motion.div>

          {/* Card 4: E2EE Security & Retention */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="snap-center shrink-0 w-[320px] sm:w-[360px] h-[460px] rounded-3xl bg-card border border-border/80 p-5 flex flex-col justify-between shadow-lg hover:shadow-xl hover:border-shield/50 transition-all relative overflow-hidden group"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="p-2 rounded-xl bg-shield-subtle text-shield border border-shield/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-foreground">E2EE & Retention</span>
            </div>

            {/* Security Vault UI */}
            <div className="my-4 flex-1 bg-secondary/60 rounded-2xl border border-border p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-shield">
                  <span>Zero-Knowledge Media Vault</span>
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Hardware encryption keys generated locally. Neither Orbit nor cloud operators hold decryption rights.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Retention Default</span>
                  <span className="text-shield font-semibold">30 Days (Auto-Purge)</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div className="w-3/4 bg-shield h-full rounded-full" />
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              Verifiable retention tables published →
            </div>
          </motion.div>

          {/* Card 5: Phone & HD Voice Bridge */}
          <motion.div
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="snap-center shrink-0 w-[320px] sm:w-[360px] h-[460px] rounded-3xl bg-card border border-border/80 p-5 flex flex-col justify-between shadow-lg hover:shadow-xl hover:border-primary/50 transition-all relative overflow-hidden group"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="p-2 rounded-xl bg-primary/15 text-primary">
                <Phone className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-foreground">Phone & SIP</span>
            </div>

            {/* Audio Waveform UI */}
            <div className="my-4 flex-1 bg-secondary/60 rounded-2xl border border-border p-4 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs font-mono">
                  HD
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground">PSTN & SIP Bridge</div>
                  <div className="text-[10px] font-mono text-primary">Connected • 00:14:22</div>
                </div>
              </div>

              {/* Animated Waveform Equalizer */}
              <div className="flex items-center justify-center gap-1.5 h-16 py-2">
                {[40, 70, 35, 90, 60, 100, 45, 80, 50, 75, 30].map((h, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ height: [`${h}%`, `${Math.max(20, (h + 30) % 100)}%`, `${h}%`] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.1 }}
                    className="w-1.5 bg-primary rounded-full"
                  />
                ))}
              </div>

              <div className="text-[10px] text-muted-foreground text-center font-mono">
                Sub-50ms Global Audio Routing
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              PSTN, SIP & WebRTC gateway support →
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
