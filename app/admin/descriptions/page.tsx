"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Lock } from "lucide-react";

const ADMIN_USER_IDS = [
  "user_3FdWvBXtWNeEtinKkLjZ9vHYyoR",
  "user_3FdWs0pdbEHCG85yExuAaW700hE",
  "user_3FdahY3hXmw7c589YMnDefAwOen",
];

type AdminGame = {
  id: string;
  title: string;
  url: string;
  category?: string | null;
  description?: string | null;
};

export default function DescriptionsPage() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);

  const [games, setGames] = useState<AdminGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedGame = games.find((game) => game.id === selectedGameId) || null;

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games;
    return games.filter((game) =>
      `${game.title} ${game.category || ""}`.toLowerCase().includes(query)
    );
  }, [games, search]);

  const gamesWithDescriptions = games.filter((game) => game.description?.trim()).length;

  const loadGames = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/games");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setGames(data);
      } else {
        setMessage(`✗ ${data.error || "Failed to load games"}`);
      }
    } catch (error) {
      setMessage("Failed to load games");
      console.error("[descriptions] load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadGames();
  }, [isAdmin]);

  const pickGame = (game: AdminGame) => {
    setSelectedGameId(game.id);
    setDescription(game.description || "");
    setMessage("");
  };

  const saveDescription = async () => {
    if (!selectedGame) {
      setMessage("Select a game first");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGame.id,
          title: selectedGame.title,
          url: selectedGame.url,
          category: selectedGame.category || "",
          description,
        }),
      });
      const data = await response.json();

      if (response.ok && data.game) {
        setMessage(`✓ Saved description for ${data.game.title}`);
        setGames((currentGames) =>
          currentGames.map((game) => game.id === data.game.id ? data.game : game)
        );
      } else {
        setMessage(`✗ ${data.error || "Failed to save description"}`);
      }
    } catch (error) {
      setMessage("Failed to save description");
      console.error("[descriptions] save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Descriptions Login</CardTitle>
            <CardDescription>Sign in with GitHub to edit hidden game descriptions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignInButton mode="modal"><Button className="w-full">Sign in</Button></SignInButton>
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
            <SignOutButton redirectUrl="/"><Button variant="outline" className="w-full">Sign out</Button></SignOutButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-7 w-7" />
              Hidden Descriptions
            </h1>
            <p className="text-muted-foreground mt-2">
              Add optional descriptions now. They are saved but not shown publicly yet.
            </p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>Back to Admin</Button>
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${message.startsWith("✓") ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}>
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Description Editor</CardTitle>
            <CardDescription>{gamesWithDescriptions} of {games.length} games have descriptions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />

            <select
              value={selectedGameId}
              onChange={(e) => {
                const game = games.find((item) => item.id === e.target.value);
                if (game) pickGame(game);
                else {
                  setSelectedGameId("");
                  setDescription("");
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">-- Choose a game --</option>
              {filteredGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.description ? "✓ " : ""}{game.title}
                </option>
              ))}
            </select>

            {selectedGame && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Editing: <span className="font-medium text-foreground">{selectedGame.title}</span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={5}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                <Button className="w-full" onClick={saveDescription} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Description"}
                </Button>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={loadGames} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
