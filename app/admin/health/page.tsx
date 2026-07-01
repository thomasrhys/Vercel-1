"use client";

import { useEffect, useMemo, useState } from "react";
import { UserButton, useSupabaseAuth } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, ImageOff, Layers, Link2, Lock, Monitor, Star, Tag, Text } from "lucide-react";

type AdminGame = {
  id: string;
  title: string;
  url: string;
  image?: string | null;
  category?: string | null;
  description?: string | null;
  featured?: boolean;
  hidden?: boolean;
  desktop_only?: boolean;
};

type HealthIssue = {
  title: string;
  description: string;
  count: number;
  games: AdminGame[];
  icon: React.ReactNode;
};

export default function AdminHealthPage() {
  const { isLoaded, isSignedIn, isAdmin, signOut } = useSupabaseAuth();

  const [games, setGames] = useState<AdminGame[]>([]);
  const [blobImages, setBlobImages] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadHealthData = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [gamesResponse, imagesResponse] = await Promise.all([
        fetch("/api/admin/games"),
        fetch("/api/game-images"),
      ]);

      const gamesData = await gamesResponse.json();
      const imagesData = await imagesResponse.json();

      if (gamesResponse.ok && Array.isArray(gamesData)) {
        setGames(gamesData);
      } else {
        setMessage(`✗ ${gamesData.error || "Failed to load games"}`);
      }

      if (imagesResponse.ok && imagesData && typeof imagesData === "object") {
        setBlobImages(imagesData);
      }
    } catch (error) {
      setMessage("Failed to load health data");
      console.error("[health] load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadHealthData();
  }, [isAdmin]);

  const health = useMemo(() => {
    const missingCovers = games.filter((game) => !game.image && !blobImages[game.id]);
    const missingCategories = games.filter((game) => !game.category?.trim());
    const missingDescriptions = games.filter((game) => !game.description?.trim());
    const featuredWithoutCovers = games.filter((game) => game.featured && !game.image && !blobImages[game.id]);
    const desktopOnlyGames = games.filter((game) => game.desktop_only);
    const hiddenGames = games.filter((game) => game.hidden);

    const urlCounts = new Map<string, AdminGame[]>();
    for (const game of games) {
      const normalisedUrl = game.url.trim().toLowerCase();
      if (!normalisedUrl) continue;
      urlCounts.set(normalisedUrl, [...(urlCounts.get(normalisedUrl) || []), game]);
    }

    const duplicateUrlGames = Array.from(urlCounts.values()).filter((group) => group.length > 1).flat();

    const issues: HealthIssue[] = [
      { title: "Missing Covers", description: "Games without uploaded cover art.", count: missingCovers.length, games: missingCovers, icon: <ImageOff className="h-5 w-5" /> },
      { title: "Uncategorised", description: "Games that are not assigned to a category.", count: missingCategories.length, games: missingCategories, icon: <Tag className="h-5 w-5" /> },
      { title: "Missing Descriptions", description: "Optional hidden descriptions still not filled in.", count: missingDescriptions.length, games: missingDescriptions, icon: <Text className="h-5 w-5" /> },
      { title: "Featured Without Covers", description: "Featured games should ideally have cover art.", count: featuredWithoutCovers.length, games: featuredWithoutCovers, icon: <Star className="h-5 w-5" /> },
      { title: "Duplicate URLs", description: "Multiple games using the same URL.", count: duplicateUrlGames.length, games: duplicateUrlGames, icon: <Link2 className="h-5 w-5" /> },
      { title: "Desktop Only", description: "Games currently blocked on mobile devices.", count: desktopOnlyGames.length, games: desktopOnlyGames, icon: <Monitor className="h-5 w-5" /> },
      { title: "Hidden Games", description: "Games currently hidden from the public homepage.", count: hiddenGames.length, games: hiddenGames, icon: <Layers className="h-5 w-5" /> },
    ];

    const seriousIssues = missingCovers.length + missingCategories.length + featuredWithoutCovers.length + duplicateUrlGames.length;
    const readyCount = games.length - new Set([...missingCovers, ...missingCategories, ...duplicateUrlGames]).size;

    return { issues, missingDescriptions, seriousIssues, readyCount };
  }, [games, blobImages]);

  if (!isLoaded) return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading health...</main>;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Game Health Login</CardTitle>
            <CardDescription>Sign in to view game health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/admin/health")}>Sign in</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>This account does not have admin access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UserButton />
            <Button variant="outline" className="w-full" onClick={signOut}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-7 w-7" />
              Game Health
            </h1>
            <p className="text-muted-foreground mt-2">Quality checks for your game library.</p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button>
        </div>

        {message && <div className={`p-3 rounded-md text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>{message}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Games</p><p className="text-2xl font-bold">{games.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ready</p><p className="text-2xl font-bold">{Math.max(health.readyCount, 0)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Needs Attention</p><p className="text-2xl font-bold">{health.seriousIssues}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Descriptions Done</p><p className="text-2xl font-bold">{games.length - health.missingDescriptions.length}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Health Report</CardTitle>
            <CardDescription>These checks help keep the public game portal tidy as it grows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" onClick={loadHealthData} disabled={isLoading}>{isLoading ? "Refreshing..." : "Refresh"}</Button>
            {health.issues.map((issue) => (
              <details key={issue.title} className="rounded-md border border-border p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-muted-foreground">{issue.icon}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${issue.count === 0 ? "bg-green-500/20 text-green-700" : "bg-yellow-500/20 text-yellow-700"}`}>{issue.count}</span>
                  </div>
                </summary>
                {issue.games.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {issue.games.slice(0, 25).map((game) => (
                      <div key={`${issue.title}-${game.id}`} className="rounded bg-muted/40 p-2 text-sm">
                        <p className="font-medium text-foreground">{game.title}</p>
                        <p className="text-xs text-muted-foreground break-all">{game.url}</p>
                      </div>
                    ))}
                    {issue.games.length > 25 && <p className="text-xs text-muted-foreground">Showing first 25 of {issue.games.length}.</p>}
                  </div>
                )}
              </details>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
