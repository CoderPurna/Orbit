"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { IconMovie, IconSparkles, IconLock, IconVolumeOff, IconNetwork } from "@tabler/icons-react";

gsap.registerPlugin(ScrollTrigger);

export function LandingFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(".bento-card", 
      { y: 80, opacity: 0, scale: 0.95 },
      {
        y: 0, 
        opacity: 1, 
        scale: 1,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative py-32 px-4 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        <h2 className="font-serif text-[clamp(2.5rem,4vw,4rem)] text-foreground mb-20 text-center leading-[1.1] max-w-3xl">
          Everything you need for <br/> professional video calls.
        </h2>

        {/* Dense Bento Grid */}
        <div className="grid grid-cols-12 grid-flow-dense gap-6 w-full">
          
          {/* Card 1: AI Summary (col-span-8, row-span-2) */}
          <div className="bento-card col-span-12 md:col-span-8 row-span-2 p-2 rounded-[2.5rem] bg-card/50 ring-1 ring-border/50 dark:ring-border shadow-[0_8px_32px_rgba(0,0,0,0.02)] group overflow-hidden">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-card h-full p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-none border border-border/50 flex flex-col relative overflow-hidden transition-transform duration-700 ease-out group-hover:scale-[1.02]">
              <div className="w-14 h-14 rounded-2xl bg-[#3FB27A]/10 flex items-center justify-center mb-8 relative z-10">
                <IconSparkles className="text-[#3FB27A]" size={28} />
              </div>
              <h3 className="text-3xl font-medium mb-4 text-foreground relative z-10">AI Intelligence</h3>
              <p className="text-muted-foreground leading-relaxed text-lg max-w-md relative z-10">
                Automatic summaries and intelligent action items generated instantly from encrypted transcripts.
              </p>
              <div className="absolute -bottom-10 -right-10 w-96 h-80 bg-muted/50 rounded-tl-[3rem] ring-1 ring-border p-6 transform rotate-3 transition-transform duration-700 ease-out group-hover:-rotate-2 group-hover:-translate-y-4">
                <div className="w-full h-full bg-background rounded-2xl shadow-sm border border-border/50 p-6 flex flex-col gap-4">
                  <div className="w-3/4 h-4 bg-foreground/10 rounded-full" />
                  <div className="w-full h-4 bg-foreground/5 rounded-full" />
                  <div className="w-5/6 h-4 bg-foreground/5 rounded-full" />
                  <div className="w-1/2 h-4 bg-[#3FB27A]/20 rounded-full mt-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cinematic Quality (col-span-4, row-span-1) */}
          <div className="bento-card col-span-12 md:col-span-4 row-span-1 p-2 rounded-[2.5rem] bg-card/50 ring-1 ring-border/50 dark:ring-border shadow-[0_8px_32px_rgba(0,0,0,0.02)] group overflow-hidden">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-card h-full p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-none border border-border/50 flex flex-col transition-transform duration-700 ease-out group-hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-[#3FB27A]/10 flex items-center justify-center mb-6">
                <IconMovie className="text-[#3FB27A]" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-foreground">Cinematic Quality</h3>
              <p className="text-muted-foreground text-base">
                Adaptive bitrate and simulcast keeps video crisp even on bad networks.
              </p>
            </div>
          </div>

          {/* Card 3: E2EE (col-span-4, row-span-1) */}
          <div className="bento-card col-span-12 md:col-span-4 row-span-1 p-2 rounded-[2.5rem] bg-card/50 ring-1 ring-border/50 dark:ring-border shadow-[0_8px_32px_rgba(0,0,0,0.02)] group overflow-hidden">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#0a1f16] dark:bg-card dark:border-border/50 h-full p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:shadow-none border border-white/10 flex flex-col transition-transform duration-700 ease-out group-hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <IconLock className="text-white" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-white">E2EE Privacy</h3>
              <p className="text-white/60 text-base">
                Strict retention. E2EE mode where not even the SFU can decrypt media.
              </p>
            </div>
          </div>

          {/* Card 4: Audio-Only (col-span-6, row-span-1) */}
          <div className="bento-card col-span-12 md:col-span-6 row-span-1 p-2 rounded-[2.5rem] bg-card/50 ring-1 ring-border/50 dark:ring-border shadow-[0_8px_32px_rgba(0,0,0,0.02)] group overflow-hidden">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-card h-full p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-none border border-border/50 flex items-center gap-8 transition-transform duration-700 ease-out group-hover:scale-[1.02]">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                  <IconVolumeOff className="text-amber-600" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Audio-Only Lite</h3>
                <p className="text-muted-foreground text-base">
                  Uses 35x less data. Perfect for cellular.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Network Topology (col-span-6, row-span-1) */}
          <div className="bento-card col-span-12 md:col-span-6 row-span-1 p-2 rounded-[2.5rem] bg-card/50 ring-1 ring-border/50 dark:ring-border shadow-[0_8px_32px_rgba(0,0,0,0.02)] group overflow-hidden">
            <div className="rounded-[calc(2.5rem-0.5rem)] bg-card h-full p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-none border border-border/50 flex items-center gap-8 transition-transform duration-700 ease-out group-hover:scale-[1.02]">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <IconNetwork className="text-blue-600" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Global Mesh Edge</h3>
                <p className="text-muted-foreground text-base">
                  45+ SFU edge regions for zero-packet-loss media relay.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
