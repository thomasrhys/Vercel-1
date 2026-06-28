"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Lock, Smartphone, Star, Trash2, EyeOff, X } from "lucide-react";

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
  featured?: boolean;
  hidden?: boolean;
  desktop_only?: boolean;
};

export default function BulkActionsPage() {
  const { isSignedIn, user } = useUser();
  const isAdmin = !!user?.id && ADMIN_USER_IDS.includes(user.id);

  const [games, setGames] = useState<AdminGame[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games;
    return games.filter((game) =>
      `${game.title} ${game.category || ""}`.toLowerCase().includes(query)
    );
  }, [games, search]);

  const selectedVisibleCount = filteredGames.filter((game) => selectedIds.includes(game.id)).length;

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
      console.error("[bulk] load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadGames();
  }, [isAdmin]);

  const toggleGame = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const selectVisible = () => {
    const visibleIds = filteredGames.map((game) => game.id);
    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
  };

  const clearSelection = () => setSelectedIds([]);

  const updateSelected = async (updates: { featured?: boolean; hidden?: boolean; desktop_only?: boolean }) => {
    if (selectedIds.length === 0) {
      setMessage("Select at least one game first");
      return;
    }

    setIsWorking(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, ...updates }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        clearSelection();
        loadGames();
      } else {
        setMessage(`✗ ${data.error || "Failed to update selected games"}`);
      }
    } catch (error) {
      setMessage("Failed to update selected games");
      console.error("[bulk] update error:", error);
    } finally {
      setIsWorking(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      setMessage("Select at least one game first");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected games? This cannot be undone.`
    );

    if (!confirmed) return;

    setIsWorking(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ ${data.message}`);
        clearSelection();
        loadGames();
      } else {
        setMessage(`✗ ${data.error || "Failed to delete selected games"}`);
      }
    } catch (error) {
      setMessage("Failed to delete selected games");
      console.error("[bulk] delete error:", error);
    } finally {
      setIsWorking(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Bulk Actions Login</CardTitle>
            <CardDescription>Sign in with GitHub to manage games.</CardDescription>
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
              <CheckSquare className="h-7 w-7" />
              Bulk Actions
            </h1>
            <p className="text-muted-foreground mt-2">Select multiple games and update them at once.</p>
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
            <CardTitle>Selected Games</CardTitle>
            <CardDescription>{selectedIds.length} selected · {filteredGames.length} visible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={selectVisible} disabled={filteredGames.length === 0}>Select Visible</Button>
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedIds.length === 0}><X className="h-4 w-4 mr-1" />Clear</Button>
              <Button variant="outline" size="sm" onClick={loadGames} disabled={isLoading}>{isLoading ? "Refreshing..." : "Refresh"}</Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => updateSelected({ featured: true })} disabled={isWorking || selectedIds.length === 0}><Star className="h-4 w-4 mr-1" />Feature Selected</Button>
              <Button onClick={() => updateSelected({ hidden: true })} disabled={isWorking || selectedIds.length === 0}><EyeOff className="h-4 w-4 mr-1" />Hide Selected</Button>
              <Button onClick={() => updateSelected({ desktop_only: true })} disabled={isWorking || selectedIds.length === 0}><Smartphone className="h-4 w-4 mr-1" />Desktop Only</Button>
              <Button variant="destructive" onClick={deleteSelected} disabled={isWorking || selectedIds.length === 0}><Trash2 className="h-4 w-4 mr-1" />Delete Selected</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Games</CardTitle>
            <CardDescription>Tick the games you want to update.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredGames.map((game) => (
              <label key={game.id} className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(game.id)}
                  onChange={() => toggleGame(game.id)}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{game.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {game.category || "Uncategorized"}
                    {game.featured ? " · Featured" : ""}
                    {game.hidden ? " · Hidden" : ""}
                    {game.desktop_only ? " · Desktop Only" : ""}
                  </p>
                </div>
              </label>
            ))}

            {filteredGames.length === 0 && (
              <div className="rounded-md border border-border p-4 text-sm text-muted-foreground text-center">
                No games found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
