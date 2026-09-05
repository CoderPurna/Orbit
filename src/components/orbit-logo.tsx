import Link from "next/link";

export function OrbitLogo({ size = 24 }: { size?: number }) {
  return (
    <Link href="/" className="group flex items-center gap-2 select-none">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ height: size, width: size }} role="img" aria-label="Orbit">
        <mask id="orbit-gap">
          <rect width="48" height="48" fill="#fff"></rect>
          <g className="animate-orbit">
            <circle cx="24" cy="7" r="6.9" fill="#000"></circle>
          </g>
        </mask>
        <circle cx="24" cy="24" r="17" fill="none" stroke="#3FB27A" strokeWidth="5.33" mask="url(#orbit-gap)"></circle>
        <g className="animate-orbit">
          <circle cx="24" cy="7" r="5.33" fill="currentColor"></circle>
        </g>
      </svg>
      <div 
        style={{ fontSize: size }} 
        className="font-display italic font-semibold tracking-tight leading-none text-foreground mt-1"
      >
        Orbit
      </div>
    </Link>
  );
}
