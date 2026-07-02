"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseAuthClient, useSupabaseAuth } from "@/lib/supabase-auth";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown };
    if (typeof value.message === "string") return value.message;
  }
  return "Something went wrong.";
}

export default function AccountPage() {
  const { user, isLoaded, isSignedIn, signOut } = useSupabaseAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const email = user?.email || "";

  const changePassword = async () => {
    setMessage("");

    if (!user || !email) {
      setMessage("This account does not have an email password login to change.");
      return;
    }

    if (!oldPassword || !newPassword) {
      setMessage("Enter your current password and your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters long.");
      return;
    }

    setBusy(true);

    try {
      const check = await supabaseAuthClient.auth.signInWithPassword({ email, password: oldPassword });
      if (check.error) {
        setMessage("Current password is incorrect.");
        return;
      }

      if (check.data.user?.id !== user.id) {
        setMessage("Password check did not match this account.");
        return;
      }

      const update = await supabaseAuthClient.auth.updateUser({ password: newPassword });
      if (update.error) {
        setMessage(getErrorMessage(update.error));
        return;
      }

      setOldPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const linkProvider = async (provider: "google" | "github") => {
    setMessage("");
    setBusy(true);

    const { error } = await supabaseAuthClient.auth.linkIdentity({
      provider,
      options: { redirectTo: `${window.location.origin}/account` },
    });

    if (error) {
      setMessage(getErrorMessage(error));
      setBusy(false);
    }
  };

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading account...</main>;

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Sign in to manage your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/account")}>Login</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage account</CardTitle>
            <CardDescription>Update your password or link another sign-in method.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input value={email || "No email on this account"} readOnly />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Current password</label>
              <Input type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New password</label>
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>

            {message && <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{message}</div>}

            <Button className="w-full" onClick={changePassword} disabled={busy}>Update password</Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => linkProvider("google")} disabled={busy}>Link Google</Button>
              <Button variant="outline" onClick={() => linkProvider("github")} disabled={busy}>Link GitHub</Button>
            </div>

            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
            <Button variant="outline" className="w-full" onClick={signOut}>Log out</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
