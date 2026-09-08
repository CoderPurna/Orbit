import { ShieldCheck, Mic, Sparkles, CheckCircle2 } from "lucide-react";
import { OrbitLogo } from "@/components/orbit-logo";
import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* ============================================================
          LEFT COLUMN: Interactive Auth Form
      ============================================================ */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-xl mx-auto w-full">
        {/* Header / Top */}
        <div className="flex items-center justify-between">
          <OrbitLogo size={28} />
        </div>

        {/* Center: Auth Form Container */}
        <div className="py-10">
          {children}
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
