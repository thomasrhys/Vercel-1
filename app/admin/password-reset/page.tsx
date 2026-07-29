"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authFetch, UserButton, useSupabaseAuth } from "@/lib/supabase-auth";

export default function PasswordResetAdminPage() {
  const { isLoaded, isSignedIn, isAdmin } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const sendReset = async () => {
    setMessage("");
    if (!email.trim() || !email.includes("@")) {
      setMessage("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const response = await authFetch("/api/admin/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "Password reset email sent.");
        setEmail("");
      } else {
        setMessage(data.error || "Could not send reset email.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading...</main>;

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Sign in to send reset emails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/admin/password-reset")}>Sign in</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>This account does not have admin access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <UserButton />
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Password Reset</h1>
            <p className="text-muted-foreground mt-2">Send a Supabase reset email to a player.</p>
          </div>
          <UserButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send reset email</CardTitle>
            <CardDescription>The player will receive a link to reset their password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="player@example.com" />
            {message && <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</div>}
            <Button className="w-full" onClick={sendReset} disabled={busy}>{busy ? "Sending..." : "Send reset email"}</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
