"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { OrbitLogo } from "@/components/orbit-logo";

export function LandingNavbar({
  onSignIn,
  onSignUp,
}: {
  onSignIn?: () => void;
  onSignUp?: () => void;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center px-4 pt-4">
      <div className="w-full max-w-6xl h-14 rounded-full border border-border/70 bg-background/75 backdrop-blur-xl shadow-lg shadow-black/[0.03] dark:shadow-black/20 flex items-center justify-between px-4 sm:px-5 transition-all">
        <OrbitLogo size={24} />

        <nav className="hidden md:flex items-center gap-7 text-xs tracking-wide uppercase font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors duration-150">
            Engine
          </a>
          <a href="#security" className="hover:text-foreground transition-colors duration-150">
            Security
          </a>
          <a href="#customers" className="hover:text-foreground transition-colors duration-150">
            Customers
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors duration-150">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden md:block">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="hidden sm:flex text-xs h-9 rounded-full px-4 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            onClick={onSignUp}
            className="text-xs h-9 rounded-full px-4 sm:px-5 bg-foreground text-background hover:bg-foreground/90 transition-transform active:scale-95 shadow-sm"
          >
            <span className="hidden sm:inline">Launch call</span>
            <span className="sm:hidden">Start</span>
            <Sparkles size={13} className="ml-1 sm:ml-1.5 text-[var(--signal)]" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-1 h-9 w-9 rounded-full text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden w-full max-w-md mt-2 rounded-3xl border border-border/70 bg-background/95 backdrop-blur-xl shadow-2xl p-5 flex flex-col gap-5 animate-in slide-in-from-top-4 fade-in-0 duration-200">
          <nav className="flex flex-col gap-4 text-base font-medium">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-signal transition-colors">Engine</a>
            <a href="#security" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-signal transition-colors">Security</a>
            <a href="#customers" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-signal transition-colors">Customers</a>
            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-foreground hover:text-signal transition-colors">Pricing</a>
          </nav>
          
          <div className="h-[1px] w-full bg-border/50" />
          
          <div className="flex items-center justify-between">
             <span className="text-sm font-medium text-muted-foreground">Theme</span>
             {mounted && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="h-10 w-10 rounded-full transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
            )}
          </div>
          
          <Button variant="outline" className="w-full h-12 rounded-full text-sm font-medium" onClick={() => {
            onSignIn?.();
            setIsMobileMenuOpen(false);
          }}>
            Sign in to your account
          </Button>
        </div>
      )}
    </header>
  );
}