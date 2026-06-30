"use client";

import { useMemo } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

function safeRedirectUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function LoginPage() {
  const { isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const redirectUrl = useMemo(() => safeRedirectUrl(searchParams.get("redirect_url")), [searchParams]);

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
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Gamepad2 className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Login to Game Portal</h1>
          <p className="text-sm text-muted-foreground">Sign in to save favourites and manage your account.</p>
        </div>
        <SignIn routing="hash" fallbackRedirectUrl={redirectUrl} signUpFallbackRedirectUrl={redirectUrl} />
        <Button variant="outline" className="w-full" onClick={() => (window.location.href = redirectUrl)}>Back</Button>
      </div>
    </main>
  );
}
