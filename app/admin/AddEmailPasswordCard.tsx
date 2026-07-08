"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/supabase-auth";

export default function AddEmailPasswordCard() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const addEmailPassword = async () => {
    setMessage("");
    setLink("");

    if (!userId.trim()) return setMessage("Enter the auth user ID.");
    if (email.trim() && !email.includes("@")) return setMessage("Enter a valid email address.");
    if (!password || password.length < 6) return setMessage("Password must be at least 6 characters.");

    setBusy(true);

    try {
      const response = await authFetch("/api/admin/add-email-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(`✓ ${data.message || "Email/password added"}`);
        setLink(data.link || "");
        setEmail("");
        setPassword("");
      } else {
        setMessage(`✗ ${data.error || "Could not add email/password"}`);
      }
    } catch (error) {
      console.error("[add-email-password] error:", error);
      setMessage("✗ Could not add email/password");
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
        <CardTitle>Add Email & Password</CardTitle>
        <CardDescription>Manually add email/password login to an existing auth user and generate a verification link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Auth user ID" />
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="player@example.com" />
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Temporary password" />
        {message && <div className={`rounded-md p-3 text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>{message}</div>}
        {link && <textarea readOnly value={link} className="min-h-24 w-full rounded-md border border-border bg-background p-2 text-xs" />}
        {link && <Button variant="outline" className="w-full" onClick={copyLink}>Copy Verification Link</Button>}
        <Button className="w-full" onClick={addEmailPassword} disabled={busy}>{busy ? "Adding..." : "Add Email & Password"}</Button>
      </CardContent>
    </Card>
  );
}
