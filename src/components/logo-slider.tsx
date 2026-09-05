"use client";

import Image from "next/image";

const LOGOS = [
  {
    name: "The New York Times",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/nt.jpg",
  },
  {
    name: "Walmart",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/wm.jpg",
  },
  {
    name: "Werner",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/wn.jpg",
  },
  {
    name: "Moffitt",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/mf.jpg",
  },
  {
    name: "ExxonMobil",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/exm.jpg",
  },
  {
    name: "Capital One",
    src: "https://st1.zoom.us/homepage/20260825-1235/primary/dist/assets/zoommedia/co.jpg",
  },
];

export function LogoSlider() {
  return (
    <div className="flex flex-row py-5 font-sans text-base leading-none text-foreground overflow-hidden cursor-crosshair whitespace-nowrap bg-background w-full">
      {/* 
        We use the existing 'animate-marquee' from globals.css. 
        It expects the content to be duplicated so it can translate -50% seamlessly.
      */}
      <div className="flex flex-row items-center animate-marquee w-max">
        {/* First Group */}
        <div className="flex flex-row items-center">
          {LOGOS.map((logo, i) => (
            <div key={`group1-${i}`} className="px-4 flex-shrink-0">
              {/* Note: I added dark:invert to make the JPG logos look correct in dark mode */}
              <img
                title={logo.name}
                alt={logo.name}
                loading="lazy"
                src={logo.src}
                className="w-auto h-[40px] sm:h-[60px] md:h-[76px] dark:invert dark:opacity-80 transition-all object-contain"
                // The provided spec had height 152 and width 320 which was likely 2x resolution (retina). 
                // Displaying it at roughly half (76px) looks natural on standard screens.
              />
            </div>
          ))}
        </div>
        
        {/* Second Group (Duplicate for seamless loop) */}
        <div className="flex flex-row items-center" aria-hidden="true">
          {LOGOS.map((logo, i) => (
            <div key={`group2-${i}`} className="px-4 flex-shrink-0">
              <img
                title={logo.name}
                alt={logo.name}
                loading="lazy"
                src={logo.src}
                className="w-auto h-[40px] sm:h-[60px] md:h-[76px] dark:invert dark:opacity-80 transition-all object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
