"use client";

import { useState } from "react";
import {
  useSession,
  signIn,
  signUp,
  signOut,
  passkey,
} from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (isSignUp) {
        const res = await signUp.email({
          name,
          email,
          password,
          callbackURL: "/",
        });

        if (res.error) {
          setErrorMessage(res.error.message || "Sign up failed");
        } else {
          setSuccessMessage("Account created successfully!");
        }
      } else {
        const res = await signIn.email({
          email,
          password,
          callbackURL: "/",
        });

        if (res.error) {
          setErrorMessage(res.error.message || "Sign in failed");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Google sign in failed");
    }
  };

  const handlePasskeySignIn = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await signIn.passkey();
      if (res?.error) {
        setErrorMessage(res.error.message || "Passkey sign in failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Passkey sign in failed");
    }
  };

  const handleAddPasskey = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await passkey.addPasskey();
      if (res?.error) {
        setErrorMessage(res.error.message || "Failed to add passkey");
      } else {
        setSuccessMessage("Passkey registered successfully!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add passkey");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Orbit Auth Tester
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Testing Email & Password, Google OAuth, Passkeys, and Account Linking
        </p>

        {isPending ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"></div>
          </div>
        ) : session?.user ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="flex items-center gap-4">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    className="h-14 w-14 rounded-full border border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-xl font-bold text-zinc-200">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="truncate text-lg font-semibold text-white">
                    {session.user.name}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {session.user.email}
                  </p>
                  <span className="mt-1 inline-block rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    Authenticated
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1 border-t border-zinc-800/80 pt-3 text-xs text-zinc-400">
                <p>
                  <span className="text-zinc-500">User ID:</span>{" "}
                  {session.user.id}
                </p>
                <p>
                  <span className="text-zinc-500">Email Verified:</span>{" "}
                  {session.user.emailVerified ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs font-medium text-red-400">{errorMessage}</p>
            )}

            {successMessage && (
              <p className="text-xs font-medium text-emerald-400">
                {successMessage}
              </p>
            )}

            <button
              onClick={handleAddPasskey}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              🔑 Add New Passkey
            </button>

            <button
              onClick={() => signOut()}
              className="w-full rounded-xl border border-red-500/20 bg-red-600/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-600/20"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            {/* Passkey Sign In */}
            <button
              onClick={handlePasskeySignIn}
              type="button"
              className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl border border-blue-500/30 bg-blue-600/10 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-600/20"
            >
              🔑 Sign in with Passkey
            </button>

            {/* Social Login */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800"></div>
              <span className="text-xs font-medium text-zinc-500">
                OR EMAIL
              </span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-medium text-red-400">
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p className="text-xs font-medium text-emerald-400">
                  {successMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In with Email"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-400">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="font-semibold text-white underline underline-offset-2 hover:text-zinc-300"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
