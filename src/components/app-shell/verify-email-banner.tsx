"use client";

import * as React from "react";
import Link from "next/link";
import { MailWarning, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * PRD §12: verification gates meeting *creation*, never joining. The banner
 * says so plainly and links to the OTP page. Dismissal lasts for the tab.
 */
export function VerifyEmailBanner() {
  const { data: session, isPending } = useSession();
  const [dismissed, setDismissed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("orbit:verify-banner") === "1";
    } catch {
      return false;
    }
  });

  if (isPending || !session?.user || session.user.emailVerified || dismissed) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("orbit:verify-banner", "1");
    } catch {
      // ignore
    }
  };

  return (
    <div className="border-caution/30 bg-caution-subtle text-foreground border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <MailWarning
          className="text-caution size-4 shrink-0"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1">
          <span className="font-medium">
            Verify your email to create meetings.
          </span>{" "}
          <span className="text-muted-foreground">
            You can still join any meeting you&apos;re invited to.
          </span>
        </p>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          render={
            <Link
              href={`/verify-email?email=${encodeURIComponent(session.user.email)}`}
            />
          }
        >
          Verify now
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
