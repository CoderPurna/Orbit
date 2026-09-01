"use client";

import { AnimatedNavbar } from "@/components/animated-navbar";
import { HeroSection } from "@/components/hero-section";
import { TopologyVisualizer } from "@/components/topology-visualizer";
import { ShieldCheck, Video, Zap, Cpu, Sparkles, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Animated Navbar */}
      <AnimatedNavbar />

      {/* Main Animated Hero Section */}
      <main>
        <HeroSection />

        {/* Feature Cards Grid & Architecture Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-16">
          <section id="product" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Sub-100ms Glass-to-Glass</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Global SFU cascade mesh ensures crisp, stutter-free 4K video feeds with dynamic bandwidth adaptation.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-shield-subtle text-shield flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">E2EE & Strict Retention</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hardware-accelerated WebRTC encryption keys held exclusively by meeting participants.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">AI Copilot & Transcripts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time multi-speaker transcription, automated key decisions, and action items delivery.
              </p>
            </div>
          </section>

          <section id="architecture" className="py-12 border-t border-border/60 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold">Global Distributed Topology</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                45+ SFU edge regions interconnected via private backbone mesh for deterministic zero-packet-loss media relay.
              </p>
            </div>
            <TopologyVisualizer />
          </section>
        </div>
      </main>
    </div>
  );
}
