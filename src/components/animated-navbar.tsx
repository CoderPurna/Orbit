"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Video, 
  Cpu, 
  Lock, 
  Zap, 
  ChevronDown, 
  Menu, 
  X, 
  ArrowRight,
  Sparkles,
  Layers,
  Radio
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  hasDropdown?: boolean;
  dropdownContent?: {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    tag?: string;
  }[];
}

const navItems: NavItem[] = [
  {
    label: "Product",
    href: "#product",
    hasDropdown: true,
    dropdownContent: [
      {
        title: "Ultra-low Latency Video",
        description: "Sub-100ms global glass-to-glass WebRTC media routing.",
        icon: Video,
        href: "#video",
        tag: "Core",
      },
      {
        title: "AI Meeting Copilot",
        description: "Real-time automated summaries & action item extraction.",
        icon: Sparkles,
        href: "#ai-copilot",
        tag: "AI",
      },
      {
        title: "E2EE Media Engine",
        description: "Zero-knowledge media encryption with verifiable retention.",
        icon: Lock,
        href: "#e2ee",
        tag: "Security",
      },
      {
        title: "LiveKit Orchestrator",
        description: "Edge room allocation with automatic cascade scaling.",
        icon: Radio,
        href: "#livekit",
      },
    ],
  },
  {
    label: "Architecture",
    href: "#architecture",
    hasDropdown: true,
    dropdownContent: [
      {
        title: "System Topology",
        description: "Explore the 45+ region distributed SFU relay network.",
        icon: Layers,
        href: "#topology",
      },
      {
        title: "Performance & SLA",
        description: "99.99% availability backed by deterministic state sync.",
        icon: Zap,
        href: "#sla",
      },
      {
        title: "Hardware SFU Scaling",
        description: "Benchmark reports on CPU & memory overhead under load.",
        icon: Cpu,
        href: "#benchmarks",
      },
    ],
  },
  {
    label: "Security & Retention",
    href: "#security",
    badge: "E2EE",
  },
  {
    label: "Docs",
    href: "#docs",
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
];

export function AnimatedNavbar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Monitor scroll for subtle container compression
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4 transition-all duration-300 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "relative flex items-center justify-between transition-all duration-300 rounded-2xl border px-4 sm:px-5",
            isScrolled
              ? "py-2.5 bg-background/90 dark:bg-card/90 backdrop-blur-xl border-border/80 shadow-md shadow-black/5 dark:shadow-black/20"
              : "py-3 bg-background/70 dark:bg-card/70 backdrop-blur-md border-border/60 shadow-sm"
          )}
          onMouseLeave={() => {
            setHoveredIndex(null);
            setActiveDropdown(null);
          }}
        >
          {/* Brand Logo & Status */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-8 h-8 text-foreground animate-[spin_8s_linear_infinite] origin-center group-hover:scale-110 transition-transform duration-300"
                  role="img"
                  aria-label="Orbit Logo"
                >
                  <mask id="orbit-navbar-logo-gap">
                    <rect width="48" height="48" fill="#fff" />
                    <circle cx="24" cy="7" r="6.9" fill="#000" />
                  </mask>
                  <circle
                    cx="24"
                    cy="24"
                    r="17"
                    fill="none"
                    stroke="#3FB27A"
                    strokeWidth="5.33"
                    mask="url(#orbit-navbar-logo-gap)"
                  />
                  <circle
                    cx="24"
                    cy="7"
                    r="5.33"
                    fill="currentColor"
                    className="fill-foreground transition-colors duration-200"
                  />
                </svg>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Orbit
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 relative">
            {navItems.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const isDropdownOpen = activeDropdown === index;

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                    if (item.hasDropdown) {
                      setActiveDropdown(index);
                    } else {
                      setActiveDropdown(null);
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative z-10 flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isHovered || isDropdownOpen
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/15 text-primary">
                        {item.badge}
                      </span>
                    )}
                    {item.hasDropdown && (
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200 opacity-70",
                          isDropdownOpen && "rotate-180 opacity-100 text-primary"
                        )}
                      />
                    )}
                  </Link>

                  {/* Animated Gliding Hover Background Pill */}
                  {isHovered && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      className="absolute inset-0 z-0 bg-secondary/80 dark:bg-secondary/60 rounded-xl border border-border/50"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Animated Dropdown Menu */}
                  <AnimatePresence>
                    {item.hasDropdown && isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 top-full pt-2 w-80 z-50"
                      >
                        <div className="p-2 rounded-2xl bg-card/95 dark:bg-card/95 backdrop-blur-2xl border border-border/80 shadow-xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5">
                          <div className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                            {item.label} Capabilities
                          </div>
                          <div className="space-y-1 mt-1">
                            {item.dropdownContent?.map((sub) => {
                              const Icon = sub.icon;
                              return (
                                <Link
                                  key={sub.title}
                                  href={sub.href}
                                  className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/70 transition-colors"
                                >
                                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 mt-0.5">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {sub.title}
                                      </span>
                                      {sub.tag && (
                                        <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-secondary text-muted-foreground">
                                          {sub.tag}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                                      {sub.description}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Desktop Join Meeting CTA Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="hidden sm:block"
            >
              <Link
                href="/join"
                className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <span>Instant Meeting</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Mobile Menu Trigger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </motion.nav>

        {/* Mobile Navigation Drawer / Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden mt-2 rounded-2xl border border-border/80 bg-background/95 dark:bg-card/95 backdrop-blur-2xl shadow-2xl p-4"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-shield-subtle/80 text-shield text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>E2EE Shield Verified</span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Orbit Engine v2.4
                </span>
              </div>

              <div className="space-y-1">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 + 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/15 text-primary">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-60" />
                    </Link>

                    {item.hasDropdown && (
                      <div className="ml-4 pl-3 border-l border-border/60 my-1 space-y-1">
                        {item.dropdownContent?.map((sub) => (
                          <Link
                            key={sub.title}
                            href={sub.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 py-2 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <sub.icon className="w-3.5 h-3.5 text-primary" />
                            <span>{sub.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="pt-4 mt-3 border-t border-border/60">
                <Link
                  href="/join"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Instant Meeting</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
