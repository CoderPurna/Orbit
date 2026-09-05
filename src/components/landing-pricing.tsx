"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "free forever",
    description: "Perfect for individuals and small teams getting started.",
    cta: "Start for free",
    features: [
      "Up to 10 participants",
      "40-minute limit",
      "Standard quality video",
      "Community support"
    ],
  },
  {
    name: "Pro",
    price: "15",
    period: "/user/mo",
    description: "Ideal for growing teams that need more power and flexibility.",
    cta: "Upgrade to Pro",
    highlight: true,
    features: [
      "Up to 100 participants",
      "Unlimited meeting duration",
      "4K Video & Spatial Audio",
      "Cloud recording (10GB)"
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Advanced controls and dedicated support for large organizations.",
    cta: "Contact sales",
    features: [
      "Unlimited participants",
      "Single Sign-On (SSO)",
      "Dedicated account manager",
      "On-premise deployment options"
    ],
  },
];

export function LandingPricing({ onSignUp }: { onSignUp?: () => void }) {
  return (
    <section id="pricing" className="bg-secondary/40 border-y border-border py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold tracking-tight mb-3" style={{ fontFamily: "var(--font-instrument-serif)" }}>
            Simple pricing. No surprises.
          </h2>
          <p className="text-muted-foreground">
            Start free, upgrade when you need more.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[var(--radius-lg)] border p-6 flex flex-col gap-5 ${
                plan.highlight
                  ? "border-[var(--signal)] bg-card shadow-lg shadow-[var(--signal)]/10 relative"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {/* Changed 'variant="signal"' to style explicitly since standard Shadcn Badge doesn't typically have a 'signal' variant unless you added it */}
                  <Badge className="bg-signal text-signal-foreground hover:bg-signal/90 text-xs">
                    Most popular
                  </Badge>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</p>
                <div className="flex items-end gap-1.5">
                  {plan.price !== "Custom" && (
                    <span className="text-4xl font-semibold tracking-tight">${plan.price}</span>
                  )}
                  {plan.price === "Custom" && (
                    <span className="text-3xl font-semibold tracking-tight">Custom</span>
                  )}
                  {plan.period && (
                    <span className="text-xs text-muted-foreground mb-1.5">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>
              <Button
                variant={plan.highlight ? "default" : "outline"}
                className={plan.highlight ? "w-full bg-signal text-signal-foreground hover:bg-signal-muted" : "w-full"}
                onClick={onSignUp}
              >
                {plan.cta}
              </Button>
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <ChevronRight size={13} className="text-signal shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
