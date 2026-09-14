"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, signIn } from "@/lib/auth-client";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthSocialButtons } from "@/components/auth-social-buttons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";
import { notify } from "@/lib/toast";
import { safeNext } from "@/lib/safe-redirect";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const isJoinFlow = next.startsWith("/m/");

  const { isLoading, setIsLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [passkeyPending, setPasskeyPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInValues) => {
    setIsLoading(true);
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    });
    setIsLoading(false);

    if (error) {
      notify.error("Sign in failed", error);
      return;
    }
    router.push(next);
    router.refresh();
  };

  const handlePasskeyAuth = async () => {
    setPasskeyPending(true);
    const { error } = await authClient.signIn.passkey();
    setPasskeyPending(false);

    if (error) {
      notify.error("Passkey sign in failed", error);
      return;
    }
    router.push(next);
    router.refresh();
  };

  const signUpHref =
    next !== "/dashboard"
      ? `/signup?next=${encodeURIComponent(next)}`
      : "/signup";

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-foreground mb-2 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
          {isJoinFlow ? "Sign in to join" : "Welcome back to Orbit"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isJoinFlow
            ? "One step and you're in the room. We'll take you straight back to the meeting."
            : "Sub-100ms video infrastructure is waiting for you."}
        </p>
      </div>

      <button
        type="button"
        onClick={handlePasskeyAuth}
        disabled={passkeyPending}
        className="border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground group mb-4 flex w-full items-center justify-between rounded-xl border px-4 py-2.5 transition-all duration-150 active:scale-[0.99] disabled:opacity-60"
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/15 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            {passkeyPending ? <Spinner /> : <KeyRound size={16} />}
          </div>
          <div className="text-left">
            <p className="text-xs leading-tight font-semibold">
              Continue with Passkey
            </p>
            <p className="text-muted-foreground text-[11px]">
              Face ID, Touch ID, or a hardware key
            </p>
          </div>
        </div>
        <ArrowRight
          size={14}
          className="text-primary transition-transform group-hover:translate-x-0.5"
        />
      </button>

      <AuthSocialButtons callbackURL={next} />

      <div className="relative my-6 text-center text-xs">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <span className="bg-background text-muted-foreground relative px-3 font-mono text-[10px] tracking-widest uppercase">
          or email
        </span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3.5"
        noValidate
      >
        <div className="space-y-1">
          <Label
            htmlFor="signin-email"
            className="text-muted-foreground text-xs font-medium"
          >
            Work email
          </Label>
          <div className="relative">
            <Mail
              size={15}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              id="signin-email"
              type="email"
              autoComplete="email webauthn"
              placeholder="sarah@acme.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
              className="bg-card placeholder:text-muted-foreground/60 h-10 w-full rounded-xl pr-3 pl-9 text-sm"
            />
          </div>
          {errors.email && (
            <p role="alert" className="text-destructive px-1 text-[11px]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="signin-password"
              className="text-muted-foreground text-xs font-medium"
            >
              Password
            </Label>
          </div>
          <div className="relative">
            <Lock
              size={15}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
              className="bg-card placeholder:text-muted-foreground/60 h-10 w-full rounded-xl pr-10 pl-9 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="text-destructive px-1 text-[11px]">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="shadow-primary/20 mt-1 h-10 w-full rounded-xl text-xs tracking-wide shadow-lg"
        >
          {isLoading ? <Spinner /> : null}
          {isLoading
            ? "Signing in..."
            : isJoinFlow
              ? "Sign in and join"
              : "Sign in to Orbit"}
        </Button>
      </form>

      <div className="text-muted-foreground mt-6 text-center text-xs">
        Don&apos;t have an account?{" "}
        <Link
          href={signUpHref}
          className="text-primary font-semibold hover:underline"
        >
          Create one
        </Link>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
