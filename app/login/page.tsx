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

function readableError(error: unknown) {
  if (error instanceof Error && error.message && error.message !== "{}") return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; error_description?: unknown; error?: unknown };
    if (typeof value.message === "string" && value.message && value.message !== "{}") return value.message;
    if (typeof value.error_description === "string" && value.error_description) return value.error_description;
    if (typeof value.error === "string" && value.error) return value.error;
  }
  if (typeof error === "string" && error && error !== "{}") return error;
  return "Something went wrong. Please check your details and try again.";
}

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";
type OAuthProvider = "google" | "github";

const oauthProviders: { id: OAuthProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
];

function LoginPageContent() {
  const { isSignedIn } = useSupabaseAuth();
  const searchParams = useSearchParams();
  const redirectUrl = useMemo(() => safeRedirectUrl(searchParams.get("redirect_url")), [searchParams]);
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const getRedirectTo = () => `${window.location.origin}/login?redirect_url=${encodeURIComponent(redirectUrl)}`;

  const submit = async () => {
    setMessage("");

    if (!password) {
      setMessage("Enter your password.");
      return;
    }

    if (method === "email" && !email.trim()) {
      setMessage("Enter your email address.");
      return;
    }

    if (method === "phone" && !phone.trim()) {
      setMessage("Enter your phone number, including the country code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        mode === "login"
          ? method === "email"
            ? await supabaseAuthClient.auth.signInWithPassword({ email: email.trim(), password })
            : await supabaseAuthClient.auth.signInWithPassword({ phone: phone.trim(), password })
          : method === "email"
            ? await supabaseAuthClient.auth.signUp({
                email: email.trim(),
                password,
                options: { emailRedirectTo: getRedirectTo() },
              })
            : await supabaseAuthClient.auth.signUp({ phone: phone.trim(), password });

      if (result.error) {
        setMessage(readableError(result.error));
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage(method === "email" ? "Account created. Check your email to confirm your account, then log in." : "Account created. Check your phone for a verification code if SMS confirmation is enabled.");
        return;
      }

      window.location.href = redirectUrl;
    } catch (error) {
      setMessage(readableError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    setMessage("");
    setOauthLoading(provider);

    try {
      const { error } = await supabaseAuthClient.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getRedirectTo() },
      });

      if (error) {
        setMessage(readableError(error));
        setOauthLoading(null);
      }
    } catch (error) {
      setMessage(readableError(error));
      setOauthLoading(null);
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

          <div className="grid grid-cols-2 gap-2">
            <Button variant={method === "email" ? "secondary" : "outline"} onClick={() => setMethod("email")}>Email</Button>
            <Button variant={method === "phone" ? "secondary" : "outline"} onClick={() => setMethod("phone")}>Phone</Button>
          </div>

          {method === "email" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+447700900123" />
              <p className="text-xs text-muted-foreground">Use the full number with country code.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          </div>

          {message && <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</div>}

          <Button className="w-full" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {oauthProviders.map((provider) => (
              <Button key={provider.id} variant="outline" onClick={() => signInWithOAuth(provider.id)} disabled={!!oauthLoading}>
                {oauthLoading === provider.id ? "Opening..." : provider.label}
              </Button>
            ))}
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
