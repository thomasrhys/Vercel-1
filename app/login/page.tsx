"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gamepad2 } from "lucide-react";
import { supabaseAuthClient, useSupabaseAuth } from "@/lib/supabase-auth";

function safeRedirectUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function messageFrom(error: unknown) {
  if (error instanceof Error && error.message && error.message !== "{}") return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; error_description?: unknown; error?: unknown };
    if (typeof value.message === "string" && value.message && value.message !== "{}") return value.message;
    if (typeof value.error_description === "string" && value.error_description) return value.error_description;
    if (typeof value.error === "string" && value.error) return value.error;
  }
  return "Something went wrong. Please check your details and try again.";
}

type AuthMode = "login" | "signup";
type OAuthProvider = "google" | "github";

function LoginPageContent() {
  const { isSignedIn } = useSupabaseAuth();
  const searchParams = useSearchParams();
  const redirectUrl = useMemo(() => safeRedirectUrl(searchParams.get("redirect_url")), [searchParams]);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTo = () => `${window.location.origin}/login?redirect_url=${encodeURIComponent(redirectUrl)}`;

  const submit = async () => {
    setMessage("");
    if (!email.trim()) return setMessage("Enter your email address.");
    if (!password) return setMessage("Enter your password.");
    setBusy(true);
    try {
      const result = mode === "login"
        ? await supabaseAuthClient.auth.signInWithPassword({ email: email.trim(), password })
        : await supabaseAuthClient.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo() } });
      if (result.error) return setMessage(messageFrom(result.error));
      if (mode === "signup" && !result.data.session) return setMessage("Account created. Check your email to confirm your account, then log in.");
      window.location.href = redirectUrl;
    } catch (error) {
      setMessage(messageFrom(error));
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: OAuthProvider) => {
    setMessage("");
    setBusy(true);
    const { error } = await supabaseAuthClient.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
    if (error) {
      setMessage(messageFrom(error));
      setBusy(false);
    }
  };

  if (isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>You are signed in</CardTitle>
            <CardDescription>Your Game Portal account is ready to use.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => (window.location.href = redirectUrl)}>Continue</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to All Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Gamepad2 className="h-10 w-10 mx-auto text-primary" />
          <CardTitle>Login to Game Portal</CardTitle>
          <CardDescription>Sign in to save favourites and continue playing across domains.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Login</Button>
            <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>Sign Up</Button>
          </div>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          {message && <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</div>}
          <Button className="w-full" onClick={submit} disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => oauth("google")} disabled={busy}>Google</Button>
            <Button variant="outline" onClick={() => oauth("github")} disabled={busy}>GitHub</Button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => (window.location.href = redirectUrl)}>Back</Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background flex items-center justify-center p-4">Loading login...</main>}>
      <LoginPageContent />
    </Suspense>
  );
}
