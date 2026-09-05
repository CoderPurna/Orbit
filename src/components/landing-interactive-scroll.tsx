"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { IconMicrophone, IconMessageReport, IconListCheck } from "@tabler/icons-react";

gsap.registerPlugin(ScrollTrigger);

export function LandingInteractiveScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPinRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Pin the left section while the right section scrolls
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 10%",
      end: "bottom 90%",
      pin: leftPinRef.current,
      scrub: true,
    });

    // Text reveal scrub for paragraphs on the right side
    const texts = gsap.utils.toArray(".scrub-text");
    texts.forEach((text: any) => {
      gsap.fromTo(text, 
        { opacity: 0.1 },
        {
          opacity: 1,
          scrollTrigger: {
            trigger: text,
            start: "top 60%",
            end: "top 30%",
            scrub: true,
          }
        }
      );
    });

    // Image/UI swaps on the left side based on scroll progress
    const panels = gsap.utils.toArray(".right-panel");
    panels.forEach((panel: any, i) => {
      ScrollTrigger.create({
        trigger: panel,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => setActiveUI(i),
        onEnterBack: () => setActiveUI(i),
      });
    });

    function setActiveUI(index: number) {
      gsap.to(".ui-layer", { opacity: 0, duration: 0.4, ease: "power2.inOut" });
      gsap.to(`.ui-layer-${index}`, { opacity: 1, duration: 0.4, ease: "power2.inOut" });
    }

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative py-32 bg-[#101014] text-white">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-16 relative">
        
        {/* Left Side (Pinned UI) */}
        <div className="w-full md:w-1/2" ref={leftPinRef}>
          <div className="p-3 rounded-[2.5rem] bg-white/5 ring-1 ring-white/10 aspect-square flex items-center justify-center relative overflow-hidden">
            
            {/* UI State 0: Transcription */}
            <div className="ui-layer ui-layer-0 absolute inset-0 p-8 flex flex-col justify-center opacity-100">
               <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-8 mx-auto">
                 <IconMicrophone size={32} className="text-blue-400" />
               </div>
               <div className="space-y-4 max-w-sm mx-auto w-full">
                 <div className="flex gap-4 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2">
                       <div className="w-3/4 h-3 bg-white/10 rounded-full" />
                       <div className="w-1/2 h-3 bg-white/10 rounded-full" />
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 shrink-0" />
                    <div className="flex-1 space-y-2">
                       <div className="w-full h-3 bg-blue-400/80 rounded-full" />
                       <div className="w-5/6 h-3 bg-blue-400/80 rounded-full" />
                       <div className="w-2/3 h-3 bg-blue-400/80 rounded-full" />
                    </div>
                 </div>
               </div>
            </div>

            {/* UI State 1: Summary */}
            <div className="ui-layer ui-layer-1 absolute inset-0 p-8 flex flex-col justify-center opacity-0">
               <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-8 mx-auto">
                 <IconMessageReport size={32} className="text-purple-400" />
               </div>
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-sm mx-auto w-full">
                  <div className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">Executive Summary</div>
                  <div className="space-y-3">
                     <div className="w-full h-3 bg-white/20 rounded-full" />
                     <div className="w-5/6 h-3 bg-white/20 rounded-full" />
                     <div className="w-4/5 h-3 bg-white/20 rounded-full" />
                  </div>
               </div>
            </div>

            {/* UI State 2: Action Items */}
            <div className="ui-layer ui-layer-2 absolute inset-0 p-8 flex flex-col justify-center opacity-0">
               <div className="w-16 h-16 rounded-full bg-[#3FB27A]/20 flex items-center justify-center mb-8 mx-auto">
                 <IconListCheck size={32} className="text-[#3FB27A]" />
               </div>
               <div className="space-y-3 max-w-sm mx-auto w-full">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="w-5 h-5 rounded-md border border-white/20 shrink-0" />
                      <div className="w-3/4 h-3 bg-white/40 rounded-full" />
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>

        {/* Right Side (Scrolling Text) */}
        <div className="w-full md:w-1/2 py-[30vh] space-y-[40vh]" ref={rightScrollRef}>
          
          <div className="right-panel">
            <h3 className="text-4xl md:text-5xl font-serif mb-6 text-white leading-tight">
              Speaker-aware <br/> transcription.
            </h3>
            <p className="scrub-text text-xl md:text-2xl text-white/70 leading-relaxed font-sans">
              Our Whisper-class pipeline handles diarisation natively. You'll never have to wonder who said what. Everything is searchable, directly jumping to the timestamp in the recording.
            </p>
          </div>

          <div className="right-panel">
            <h3 className="text-4xl md:text-5xl font-serif mb-6 text-white leading-tight">
              Summaries that <br/> actually make sense.
            </h3>
            <p className="scrub-text text-xl md:text-2xl text-white/70 leading-relaxed font-sans">
              Available within 10 minutes of a 60-minute meeting ending. Structured outputs give you a tight TL;DR, key decisions, and topic breakdowns linked directly to timestamps.
            </p>
          </div>

          <div className="right-panel">
            <h3 className="text-4xl md:text-5xl font-serif mb-6 text-white leading-tight">
              Action items <br/> extracted instantly.
            </h3>
            <p className="scrub-text text-xl md:text-2xl text-white/70 leading-relaxed font-sans">
              Every action item carries a confidence score and is automatically mapped to the actual participant roster. Stop writing manual follow-ups forever.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
