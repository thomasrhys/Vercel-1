"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gamepad2 } from "lucide-react";
import { supabaseAuthClient, useSupabaseAuth } from "@/lib/supabase-auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18A10.9 10.9 0 0 1 12 6.01c.97 0 1.94.13 2.85.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function TwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#9146FF" d="M4 3h17v12l-5 5h-4l-3 3H6v-3H2V7l2-4z" />
      <path fill="#FFFFFF" d="M6 5v12h4v3l3-3h4l2-2V5H6z" />
      <path fill="#9146FF" d="M9 8h2v6H9V8zm5 0h2v6h-2V8z" />
    </svg>
  );
}

function safeRedirectUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function messageFrom(error: unknown) {
  if (error instanceof Error && error.message && error.message !== "{}") return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; error_description?: unknown; error?: unknown; code?: unknown; status?: unknown; name?: unknown };
    if (typeof value.message === "string" && value.message && value.message !== "{}") return value.message;
    if (typeof value.error_description === "string" && value.error_description) return value.error_description;
    if (typeof value.error === "string" && value.error) return value.error;
    if (typeof value.code === "string" && value.code) return `Sign-up error: ${value.code}`;
    if (typeof value.name === "string" && value.name) return `Sign-up error: ${value.name}`;
    if (value.status) return `Sign-up failed with status ${String(value.status)}. Please check the details and try again.`;
    try {
      const json = JSON.stringify(error);
      if (json && json !== "{}") return `Sign-up error: ${json}`;
    } catch {}
  }
  if (typeof error === "string" && error && error !== "{}") return error;
  return "Sign-up failed. Please check that email sign-ups are enabled and that the password meets the minimum requirements.";
}

type AuthMode = "login" | "signup";
type OAuthProvider = "google" | "github" | "azure" | "twitch";

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
    if (mode === "signup" && password.length < 6) return setMessage("Password must be at least 6 characters long.");
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
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" onClick={() => oauth("google")} disabled={busy} className="justify-center gap-2"><GoogleIcon />Continue with Google</Button>
            <Button variant="outline" onClick={() => oauth("github")} disabled={busy} className="justify-center gap-2"><GitHubIcon />Continue with GitHub</Button>
            <Button variant="outline" onClick={() => oauth("azure")} disabled={busy} className="justify-center gap-2"><MicrosoftIcon />Continue with Microsoft</Button>
            <Button variant="outline" onClick={() => oauth("twitch")} disabled={busy} className="justify-center gap-2"><TwitchIcon />Continue with Twitch</Button>
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
