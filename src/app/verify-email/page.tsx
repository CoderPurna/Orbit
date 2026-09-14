"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, ShieldCheck } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { OrbitLogo } from "@/components/orbit-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notify } from "@/lib/toast";
import { safeNext } from "@/lib/safe-redirect";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const next = safeNext(searchParams.get("next"));

  const [emailInput, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Fall back to the signed-in user's email without syncing state in an effect.
  const email = emailInput || session?.user?.email || "";

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const alreadyVerified = Boolean(session?.user?.emailVerified);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setErrorMessage("Enter the email address you signed up with.");
      return;
    }
    if (otp.length < 6) {
      setErrorMessage("Enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    const res = await authClient.emailOtp.verifyEmail({ email, otp });
    setLoading(false);

    if (res.error) {
      setErrorMessage(
        res.error.message || "That code didn't work. Check it and try again.",
      );
      setOtp("");
      return;
    }
    notify.success("Email verified", "You can now create meetings.");
    router.push(next);
    router.refresh();
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMessage("Enter your email address to resend the code.");
      return;
    }
    setResending(true);
    setErrorMessage("");
    const res = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setResending(false);
    if (res.error) {
      setErrorMessage(res.error.message || "Could not resend the code.");
      return;
    }
    setCooldown(45);
    notify.info("Code sent", `A new 6-digit code is on its way to ${email}.`);
  };

  if (isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (alreadyVerified) {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl tracking-tight">
            You&apos;re verified
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {session?.user?.email} is confirmed. Nothing else to do here.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => router.push(next)}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6" noValidate>
      <div className="space-y-2">
        <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
          <MailCheck size={20} />
        </div>
        <h1 className="font-display text-3xl tracking-[-0.03em]">
          Check your inbox
        </h1>
        <p className="text-muted-foreground text-sm">
          We sent a 6-digit code{email ? ` to ${email}` : ""}. Verifying unlocks
          meeting creation — you can still join meetings without it.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Verification failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!searchParams.get("email") && (
        <div className="space-y-1.5">
          <Label
            htmlFor="verify-email"
            className="text-muted-foreground text-xs"
          >
            Email address
          </Label>
          <Input
            id="verify-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-card h-10 rounded-xl"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">
          Verification code
        </Label>
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => {
            setOtp(value);
            setErrorMessage("");
          }}
          onComplete={() => void handleVerify()}
          autoFocus
          containerClassName="justify-start"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="size-11 font-mono text-lg" />
            <InputOTPSlot index={1} className="size-11 font-mono text-lg" />
            <InputOTPSlot index={2} className="size-11 font-mono text-lg" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} className="size-11 font-mono text-lg" />
            <InputOTPSlot index={4} className="size-11 font-mono text-lg" />
            <InputOTPSlot index={5} className="size-11 font-mono text-lg" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={loading || otp.length < 6}
          className="h-10 rounded-xl"
        >
          {loading ? <Spinner /> : null}
          {loading ? "Verifying..." : "Verify email"}
        </Button>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0 || !email}
            className="text-primary font-medium hover:underline disabled:no-underline disabled:opacity-50"
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </button>
          <Link href={next} className="hover:text-foreground">
            Skip for now
          </Link>
        </div>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-6 py-8 sm:px-8">
        <OrbitLogo size={26} />
        <div className="py-10">
          <Suspense
            fallback={
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <VerifyEmailForm />
          </Suspense>
        </div>
        <p className="text-muted-foreground/70 text-[11px]">
          Codes expire after a few minutes. Didn&apos;t sign up? You can safely
          ignore the email.
        </p>
      </div>
    </main>
  );
}
