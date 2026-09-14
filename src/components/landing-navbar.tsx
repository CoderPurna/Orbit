"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X, LogOut, LayoutDashboard, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { OrbitLogo } from "@/components/orbit-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingNavbar({
  onSignIn,
  onSignUp,
}: {
  onSignIn?: () => void;
  onSignUp?: () => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

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
            <ThemeToggle />
          </div>
          
          {isPending ? (
            <div className="flex items-center gap-2">
              <Skeleton className="hidden sm:block h-9 w-16 rounded-full" />
              <Skeleton className="h-9 w-24 sm:w-28 rounded-full" />
            </div>
          ) : session?.user ? (
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2" />}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                    <AvatarFallback>{session.user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/signin")}
                className="hidden sm:flex text-xs h-9 rounded-full px-4 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/signup")}
                className="text-xs h-9 rounded-full px-4 sm:px-5 bg-foreground text-background hover:bg-foreground/90 transition-transform active:scale-95 shadow-sm"
              >
                <span className="hidden sm:inline">Launch call</span>
                <span className="sm:hidden">Start</span>
                <Phone size={13} className="ml-1 sm:ml-1.5 text-[var(--signal)]" />
              </Button>
            </>
          )}
          
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
             <ThemeToggle variant="secondary" className="h-10 w-10" iconSize={18} />
          </div>
          
          {isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-12 rounded-full" />
              <Skeleton className="w-full h-12 rounded-full" />
            </div>
          ) : session?.user ? (
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full h-12 rounded-full text-sm font-medium justify-start px-4" onClick={() => {
                router.push('/dashboard');
                setIsMobileMenuOpen(false);
              }}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-full text-sm font-medium justify-start px-4" onClick={() => {
                router.push('/profile');
                setIsMobileMenuOpen(false);
              }}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-full text-sm font-medium justify-start px-4 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full h-12 rounded-full text-sm font-medium" onClick={() => {
                router.push('/signin');
                setIsMobileMenuOpen(false);
              }}>
                Sign in to your account
              </Button>
              <Button className="w-full h-12 rounded-full text-sm font-medium bg-foreground text-background" onClick={() => {
                router.push('/signup');
                setIsMobileMenuOpen(false);
              }}>
                Create your workspace
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}