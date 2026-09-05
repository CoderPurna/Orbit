"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const PRODUCTS = [
  {
    name: "Webinars",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/web.jpg",
    alt: "Live video chat screenshot from a webinar",
  },
  {
    name: "Bonsai",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/bonsai_hp_card-new.webp",
    alt: "Bonsai",
  },
  {
    name: "Rooms",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/zoom-rooms.jpg",
    alt: "Attendees in a Zoom conference room",
  },
  {
    name: "BrightHire",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/brighthire_hp_card.webp",
    alt: "BrightHire",
  },
  {
    name: "Virtual Agent",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/virtual.jpg",
    alt: "Chatbot screen",
  },
  {
    name: "Contact Center",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/contact-center.jpg",
    alt: "Contact Center software",
  },
  {
    name: "Workvivo",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/workvivo_hp_card.webp",
    alt: "workvivo",
  },
  {
    name: "Meetings",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/meetings.jpg",
    alt: "Meetings app interface",
  },
  {
    name: "My Notes",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/my-notes-hp-card.webp",
    alt: "My Notes",
  },
  {
    name: "ZoomMate",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/ZoomMate.webp",
    alt: "ZoomMate",
  },
  {
    name: "AI Productivity Suite",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/AI-suite.webp",
    alt: "AI Productivity Suite",
  },
  {
    name: "Phone",
    url: "#",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/phone.jpg",
    alt: "Phone",
  },
];

export function ProductSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [centerIndex, setCenterIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const animationRef = useRef<number | null>(null);
  const manualScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = () => {
    if (!scrollRef.current || isDragging || isHovering || isManualScrolling) return;
    scrollRef.current.scrollLeft += 1; // Smooth continuous pixel scroll

    // Infinite loop trick
    if (
      scrollRef.current.scrollLeft >= 
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 1
    ) {
      scrollRef.current.scrollLeft = 0;
    }

    animationRef.current = requestAnimationFrame(startAutoScroll);
  };

  const stopAutoScroll = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Manage auto-scroll lifecycle
  React.useEffect(() => {
    if (!isDragging && !isHovering && !isManualScrolling) {
      animationRef.current = requestAnimationFrame(startAutoScroll);
    } else {
      stopAutoScroll();
    }
    return stopAutoScroll;
  }, [isDragging, isHovering, isManualScrolling]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollPosition = scrollRef.current.scrollLeft;
    // item width (240) + gap (16) = 256
    const index = Math.round(scrollPosition / 256) % PRODUCTS.length;
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const triggerManualScroll = (offset: number) => {
    if (!scrollRef.current) return;
    
    // Pause auto-scroll
    setIsManualScrolling(true);
    if (manualScrollTimer.current) clearTimeout(manualScrollTimer.current);
    
    // Perform the smooth scroll
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    
    // Resume auto-scroll after the animation finishes
    manualScrollTimer.current = setTimeout(() => {
      setIsManualScrolling(false);
    }, 600);
  };

  const scrollPrev = () => triggerManualScroll(-256);
  const scrollNext = () => triggerManualScroll(256);

  return (
    <section className="w-full pt-16 pb-12 overflow-hidden bg-background">
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar select-none cursor-grab active:cursor-grabbing pt-12 pb-12"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onScroll={handleScroll}
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {[...PRODUCTS, ...PRODUCTS].map((product, idx) => (
          <div 
            key={idx}
            className="relative flex-shrink-0 group perspective-1000"
            style={{ width: "240px", height: "320px" }}
          >
            <a 
              href={product.url}
              className="block w-full h-full rounded-2xl overflow-hidden shadow-lg shadow-black/10 dark:shadow-black/30 transition-all duration-300 ease-out group-hover:-translate-y-4 group-hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] group-hover:shadow-signal/40 dark:group-hover:shadow-[0_0_40px_-10px_var(--color-signal,var(--signal))] border border-white/10 group-hover:border-signal/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring opacity-90 group-hover:opacity-100"
              draggable={false}
            >
              <img
                src={product.src}
                alt={product.alt}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
                draggable={false}
              />
              <span className="sr-only">{product.name}</span>
            </a>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-6 mt-4 px-4 max-w-6xl mx-auto">
        <button 
          onClick={scrollPrev}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors shadow-sm"
          aria-label="Previous slide"
        >
          <ArrowLeft size={18} />
        </button>
        
        <div className="flex items-center gap-2">
          {PRODUCTS.map((_, i) => (
            <div 
              key={`dot-${i}`} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex 
                  ? "w-6 bg-foreground" 
                  : "w-2 bg-foreground/20"
              }`} 
            />
          ))}
        </div>

        <button 
          onClick={scrollNext}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors shadow-sm"
          aria-label="Next slide"
        >
          <ArrowRight size={18} />
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
