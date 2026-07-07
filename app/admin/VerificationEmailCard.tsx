"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/supabase-auth";

export default function VerificationEmailCard() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const sendVerification = async () => {
    setMessage("");
    setLink("");

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
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const generatedLink = data.link || data.verificationLink || "";
        setMessage(`✓ ${data.message || "Verification link generated"}`);
        setLink(generatedLink);
        setEmail("");
      } else {
        setMessage(`✗ ${data.error || "Could not generate verification link"}`);
      }
    } catch (error) {
      console.error("[verification-email] error:", error);
      setMessage("✗ Could not generate verification link");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setMessage("✓ Verification link copied");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Link</CardTitle>
        <CardDescription>Generate a Supabase account confirmation link for a player.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="player@example.com" />
        {message && <div className={`rounded-md p-3 text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>{message}</div>}
        {link && <textarea readOnly value={link} className="min-h-24 w-full rounded-md border border-border bg-background p-2 text-xs" />}
        {link && <Button variant="outline" className="w-full" onClick={copyLink}>Copy Verification Link</Button>}
        <Button className="w-full" onClick={sendVerification} disabled={busy}>{busy ? "Generating..." : "Generate Verification Link"}</Button>
      </CardContent>
    </Card>
  );
}
