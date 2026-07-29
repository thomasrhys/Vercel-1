"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/lib/supabase-auth";
import ProfileExtrasCard from "../ProfileExtrasCard";

export default function AccountProfileExtrasPage() {
  const { user, isLoaded, isSignedIn } = useSupabaseAuth();

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading profile extras...</main>;

  if (!isSignedIn || !user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile extras</CardTitle>
            <CardDescription>Sign in to edit your public profile extras.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/account/profile-extras")}>Login</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-6">
        <ProfileExtrasCard userId={user.id} />
        <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/account")}>Back to Account</Button>
      </div>
    </main>
  );
}
