"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/supabase-auth";

function readableError(value: unknown, fallback: string) {
  if (typeof value === "string" && value && value !== "{}") return value;
  if (value instanceof Error && value.message && value.message !== "{}") return value.message;
  if (typeof value === "object" && value !== null) {
    const error = value as { error?: unknown; message?: unknown; error_description?: unknown; code?: unknown; status?: unknown };
    if (typeof error.error === "string" && error.error && error.error !== "{}") return error.error;
    if (typeof error.message === "string" && error.message && error.message !== "{}") return error.message;
    if (typeof error.error_description === "string" && error.error_description) return error.error_description;
    if (typeof error.code === "string" && error.code) return error.code;
    if (error.status) return `Request failed with status ${String(error.status)}`;
    try {
      const json = JSON.stringify(value);
      if (json && json !== "{}") return json;
    } catch {}
  }
  return fallback;
}

export default function PasswordResetCard() {
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
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(`✓ ${data.message || "Password reset email sent"}`);
        setEmail("");
      } else {
        setMessage(`✗ ${readableError(data, "Could not send reset email")}`);
      }
    } catch (error) {
      console.error("[password-reset] error:", error);
      setMessage(`✗ ${readableError(error, "Could not send reset email")}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Reset Email</CardTitle>
        <CardDescription>Send a Supabase password reset email to a player.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="player@example.com" />
        {message && <div className={`rounded-md p-3 text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>{message}</div>}
        <Button className="w-full" onClick={sendReset} disabled={busy}>{busy ? "Sending..." : "Send Reset Email"}</Button>
      </CardContent>
    </Card>
  );
}
