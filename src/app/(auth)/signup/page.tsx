"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AuthSocialButtons } from "@/components/auth-social-buttons";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";
import { notify } from "@/lib/toast";
import { safeNext } from "@/lib/safe-redirect";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const isJoinFlow = next.startsWith("/m/");

  const { isLoading, setIsLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: SignUpValues) => {
    setIsLoading(true);
    const { error } = await signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
    });
    setIsLoading(false);

    if (error) {
      notify.error("Could not create your account", error);
      return;
    }

    // PRD F2: a sign-up from a join link goes straight into the room. Email
    // verification happens asynchronously — it only gates *creating* meetings.
    if (isJoinFlow) {
      notify.success(
        "Welcome to Orbit",
        "We emailed you a verification code for later.",
      );
      router.push(next);
    } else {
      router.push(
        `/verify-email?email=${encodeURIComponent(values.email)}&next=${encodeURIComponent(next)}`,
      );
    }
    router.refresh();
  };

  const signInHref =
    next !== "/dashboard"
      ? `/signin?next=${encodeURIComponent(next)}`
      : "/signin";

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-foreground mb-2 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
          {isJoinFlow ? "Create an account to join" : "Create your workspace"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isJoinFlow
            ? "Takes a few seconds. You'll land in the meeting right after."
            : "Spin up crystal-clear encrypted meetings in under 30 seconds."}
        </p>
      </div>

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
            htmlFor="signup-name"
            className="text-muted-foreground text-xs font-medium"
          >
            Full name
          </Label>
          <div className="relative">
            <User
              size={15}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Sarah Chen"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
              className="bg-card placeholder:text-muted-foreground/60 h-10 w-full rounded-xl pr-3 pl-9 text-sm"
            />
          </div>
          {errors.name && (
            <p role="alert" className="text-destructive px-1 text-[11px]">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="signup-email"
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
              id="signup-email"
              type="email"
              autoComplete="email"
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
          <Label
            htmlFor="signup-password"
            className="text-muted-foreground text-xs font-medium"
          >
            Password
          </Label>
          <div className="relative">
            <Lock
              size={15}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
            ? "Creating account..."
            : isJoinFlow
              ? "Create account and join"
              : "Create account"}
        </Button>
      </form>

      <div className="text-muted-foreground mt-6 text-center text-xs">
        Already registered?{" "}
        <Link
          href={signInHref}
          className="text-primary font-semibold hover:underline"
        >
          Sign in here
        </Link>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
