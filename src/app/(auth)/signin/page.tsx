"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Mic,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthSocialButtons } from "@/components/auth-social-buttons";
import { OrbitLogo } from "@/components/orbit-logo";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Connect to your auth provider (Supabase / Auth.js / Firebase)
    console.log({ mode, email, password, name });
  };

  const handlePasskeyAuth = () => {
    // Trigger navigator.credentials.get() or navigator.credentials.create()
    alert("Triggering WebAuthn Passkey prompt...");
  };

  return (
    <main className="min-h-screen w-full grid lg:grid-cols-[1fr_1.1fr] bg-background">
      {/* ============================================================
          LEFT COLUMN: Interactive Auth Form
      ============================================================ */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-xl mx-auto w-full">
        {/* Header / Top */}
        <div className="flex items-center justify-between">
          <OrbitLogo size={28} />
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck size={14} className="text-[#3FB27A]" />
            <span>256-bit Encrypted</span>
          </div>
        </div>

        {/* Center: Auth Form Container */}
        <div className="py-10">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-[-0.03em] text-foreground mb-2">
              {mode === "signin" ? "Welcome back to Orbit" : "Create your workspace"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sub-100ms video infrastructure is waiting for you."
                : "Spin up crystal-clear encrypted meetings in under 30 seconds."}
            </p>
          </div>

          {/* Biometric Passkey Fast-Track */}
          <button
            type="button"
            onClick={handlePasskeyAuth}
            className="w-full mb-4 py-2.5 px-4 rounded-xl border border-[#3FB27A]/30 bg-[#3FB27A]/5 hover:bg-[#3FB27A]/10 text-foreground transition-all duration-150 flex items-center justify-between group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#3FB27A]/15 text-[#3FB27A] flex items-center justify-center">
                <KeyRound size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold leading-tight">Continue with Passkey</p>
                <p className="text-[11px] text-muted-foreground">FaceID, Touch ID, or Hardware Key</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-[#3FB27A] group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Social OAuth Buttons */}
          <AuthSocialButtons />

          {/* Divider */}
          <div className="relative my-6 text-center text-xs">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-background px-3 text-muted-foreground uppercase text-[10px] tracking-widest font-mono">
              or email
            </span>
          </div>

          {/* Password credentials form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Full name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Chen"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#3FB27A] transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Work email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@acme.com"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#3FB27A] transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-[11px] text-[#3FB27A] hover:underline font-medium"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-9 pr-10 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#3FB27A] transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 mt-1 rounded-xl bg-[#3FB27A] hover:bg-[#349866] text-white font-medium text-xs tracking-wide shadow-lg shadow-[#3FB27A]/20 transition-transform active:scale-[0.99]"
            >
              {mode === "signin" ? "Sign in to Orbit" : "Create team account"}
            </Button>
          </form>

          {/* Toggle between Signin / Signup */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#3FB27A] font-semibold hover:underline"
                >
                  Start free trial
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-[#3FB27A] font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center sm:text-left text-[11px] text-muted-foreground/70">
          By continuing, you agree to Orbit&apos;s{" "}
          <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
        </div>
      </div>

      {/* ============================================================
          RIGHT COLUMN: Ambient Live Room Preview & Showcase
      ============================================================ */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0d0e10] border-l border-white/[0.08] relative overflow-hidden text-white">
        {/* Pine glow backdrop */}
        <div
          className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full blur-[110px] opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3FB27A 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 75%)" }}
        />

        {/* Top telemetry pills */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-white/80">
            <span className="w-2 h-2 rounded-full bg-[#3FB27A] animate-pulse" />
            Live Network: 104 Regions
          </div>
          <span className="text-xs font-mono text-white/40">v2.4.0-stable</span>
        </div>

        {/* Centerpiece: Active Call Spotlight Card */}
        <div className="relative z-10 my-auto max-w-md w-full mx-auto">
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-2xl p-5 shadow-2xl relative">
            {/* Live active speaker card */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 mb-4 bg-zinc-900">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&fit=crop"
                alt="Speaker"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Speaker indicators */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono flex items-center gap-1.5 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3FB27A]" />
                PRIYA NAIR · 4K 60FPS
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#3FB27A]/20 flex items-center justify-center">
                    <Mic size={11} className="text-[#3FB27A]" />
                  </div>
                  <div className="flex gap-[2px] items-end h-3">
                    {[4, 7, 5, 8, 3].map((h, i) => (
                      <span
                        key={i}
                        className="w-0.5 bg-[#3FB27A] rounded-full animate-[rec-pulse_0.6s_ease-in-out_infinite_alternate]"
                        style={{ height: h * 1.6, animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-white/70">Sub-30ms P2P</span>
              </div>
            </div>

            {/* Testimonial Quote */}
            <blockquote className="space-y-2">
              <p className="text-sm font-light text-zinc-200 leading-relaxed font-sans">
                “Orbit gave our design team the feeling of sitting around the same physical desk again. No audio fatigue, instant screen feeds, zero friction.”
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
                <Sparkles size={12} className="text-[#3FB27A]" />
                <span>Selected as standard tool across 1,200+ product teams</span>
              </div>
            </blockquote>
          </div>

          {/* Quick checklist pills underneath */}
          <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#3FB27A]" />
              Zero installation required
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#3FB27A]" />
              Default WebRTC E2EE
            </div>
          </div>
        </div>

        {/* Bottom edge info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>ORBIT REALTIME PROTOCOL</span>
          <span>LATENCY &lt; 40MS</span>
        </div>
      </div>
    </main>
  );
}