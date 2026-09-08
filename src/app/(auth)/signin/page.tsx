"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { signIn, passkey } from "@/lib/auth-client";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthSocialButtons } from "@/components/auth-social-buttons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";

export default function SignInPage() {
  const router = useRouter();
  const { isLoading, setIsLoading } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInValues) => {
    setIsLoading(true);
    const { data, error } = await signIn.email({ 
      email: values.email, 
      password: values.password 
    });
    setIsLoading(false);
    
    if (error) {
      alert(error.message || "Something went wrong.");
    } else {
      router.push("/dashboard");
    }
  };

  const handlePasskeyAuth = async () => {
    setIsLoading(true);
    const { data, error } = await passkey.signIn();
    setIsLoading(false);
    
    if (error) {
      alert(error.message || "Passkey sign in failed.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-[-0.03em] text-foreground mb-2">
          Welcome back to Orbit
        </h1>
        <p className="text-sm text-muted-foreground">
          Sub-100ms video infrastructure is waiting for you.
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Work email</Label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="sarah@acme.com"
              {...register("email")}
              className={`w-full h-10 pl-9 pr-3 rounded-xl bg-card text-sm text-foreground focus-visible:ring-2 focus-visible:ring-[#3FB27A] transition-all placeholder:text-muted-foreground/60 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </div>
          {errors.email && <p className="text-[10px] text-destructive px-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium text-muted-foreground">Password</Label>
            <button
              type="button"
              className="text-[11px] text-[#3FB27A] hover:underline font-medium"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              {...register("password")}
              className={`w-full h-10 pl-9 pr-10 rounded-xl bg-card text-sm text-foreground focus-visible:ring-2 focus-visible:ring-[#3FB27A] transition-all placeholder:text-muted-foreground/60 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-[10px] text-destructive px-1">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-1 rounded-xl bg-[#3FB27A] hover:bg-[#349866] text-white font-medium text-xs tracking-wide shadow-lg shadow-[#3FB27A]/20 transition-transform active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
        >
          {isLoading ? "Signing in..." : "Sign in to Orbit"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[#3FB27A] font-semibold hover:underline"
        >
          Start free trial
        </Link>
      </div>
    </>
  );
}