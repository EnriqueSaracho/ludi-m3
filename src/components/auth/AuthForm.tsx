"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextParam } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup" | "forgot";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextParam(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo: `${window.location.origin}/auth/reset-password` },
        );
        if (err) throw err;
        setError("Check your email for a reset link.");
        return;
      }

      if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (password !== confirm) throw new Error("Passwords do not match.");
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (err) throw err;
        router.push(next === "/" ? "/profile" : next);
        return;
      }

      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(mode === "signup" ? "/profile" : next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="text-center">
        <Link href="/" className="text-2xl font-semibold">
          Ludi
        </Link>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode !== "forgot" && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        )}

        {mode === "login" && (
          <p className="text-right text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Loading…"
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </Button>
      </form>

      {mode !== "forgot" && (
        <>
          <div className="relative text-center text-sm text-muted-foreground">
            <span className="bg-background px-2">or</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>
        </>
      )}

      {mode === "signup" && (
        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </>
        ) : mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        )}
      </p>
    </div>
  );
}
