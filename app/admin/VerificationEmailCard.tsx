"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/supabase-auth";

export default function VerificationEmailCard() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const sendVerification = async () => {
    setMessage("");

    if (!email.trim() || !email.includes("@")) {
      setMessage("Enter a valid email address.");
      return;
    }

    setBusy(true);

    try {
      const response = await authFetch("/api/admin/verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message || "Verification email sent"}`);
        setEmail("");
      } else {
        setMessage(`✗ ${data.error || "Could not send verification email"}`);
      }
    } catch (error) {
      console.error("[verification-email] error:", error);
      setMessage("✗ Could not send verification email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Email</CardTitle>
        <CardDescription>Resend a Supabase account confirmation email to a player.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="player@example.com" />
        {message && <div className={`rounded-md p-3 text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>{message}</div>}
        <Button className="w-full" onClick={sendVerification} disabled={busy}>{busy ? "Sending..." : "Send Verification Email"}</Button>
      </CardContent>
    </Card>
  );
}
