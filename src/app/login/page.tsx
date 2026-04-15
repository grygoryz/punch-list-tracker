"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Mode = "magic" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = () =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  async function handleMagic(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  async function handlePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const client = supabase();
    const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
    if (signInErr) {
      const { error: signUpErr } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signUpErr) {
        setPending(false);
        toast.error(signUpErr.message);
        return;
      }
      const { error: retryErr } = await client.auth.signInWithPassword({ email, password });
      if (retryErr) {
        setPending(false);
        toast.error(retryErr.message);
        return;
      }
    }
    setPending(false);
    router.push("/projects");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Punch List Tracker</CardTitle>
          <CardDescription>
            {mode === "password"
              ? "Sign in or create an account with email + password."
              : "Sign in with a magic link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              Check your email for a sign-in link.
            </div>
          ) : mode === "password" ? (
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Signing in…" : "Sign in / Sign up"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("magic")}
                className="block w-full text-center text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                Use magic link instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagic} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Sending…" : "Send magic link"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("password")}
                className="block w-full text-center text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                Use password instead
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
