"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authFetch, UserButton, useSupabaseAuth } from "@/lib/supabase-auth";
import { getGameImage, type Game } from "@/lib/games";
import { ArrowLeft, Gamepad2, Heart, Search, Trash2 } from "lucide-react";

type PortalGame = Game & { image?: string | null; category?: string | null; hidden?: boolean };
type SortMode = "recent" | "az" | "category";

export default function FavouritesPage() {
  const { isLoaded, isSignedIn } = useSupabaseAuth();
  const [games, setGames] = useState<PortalGame[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    Promise.all([fetch("/api/games"), authFetch("/api/favourites"), fetch("/api/game-images")])
      .then(async ([gameRes, favRes, imageRes]) => {
        const gameData = await gameRes.json();
        const favData = await favRes.json();
        const imageData = await imageRes.json();
        if (Array.isArray(gameData)) setGames(gameData);
        if (Array.isArray(favData.favourites)) setFavouriteIds(favData.favourites);
        else if (!favRes.ok) setMessage(favData.error || "Could not load favourites.");
        if (imageData && typeof imageData === "object") setImages(imageData);
      })
      .catch(() => setMessage("Could not load favourites."))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  const favouriteGames = useMemo(() => {
    const listed = favouriteIds
      .map((id) => games.find((game) => game.id === id && !game.hidden))
      .filter((game): game is PortalGame => Boolean(game))
      .filter((game) => `${game.title} ${game.category || ""}`.toLowerCase().includes(query.toLowerCase()));

    if (sortMode === "az") return [...listed].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === "category") return [...listed].sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.title.localeCompare(b.title));
    return listed;
  }, [favouriteIds, games, query, sortMode]);

  const removeFavourite = async (gameId: string) => {
    const response = await authFetch("/api/favourites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });

    if (response.ok) setFavouriteIds((current) => current.filter((id) => id !== gameId));
    else setMessage("Could not remove favourite.");
  };

  if (!isLoaded || loading) {
    return <main className="min-h-screen bg-background flex items-center justify-center p-4">Loading favourites...</main>;
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle>Sign in to view favourites</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => (window.location.href = "/login?redirect_url=/favourites")}>Login</Button>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>Back to Games</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}><ArrowLeft className="h-4 w-4 mr-2" />Back to All Games</Button>
          <UserButton />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Heart className="h-7 w-7 fill-current" />My Favourites</h1>
          <p className="text-muted-foreground mt-2">{favouriteIds.length} saved {favouriteIds.length === 1 ? "game" : "games"}.</p>
        </div>

        {message && <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm mb-4">✗ {message}</div>}

        {favouriteIds.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search favourites..." className="pl-9" /></div>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="px-3 py-2 border border-border rounded-md bg-background text-foreground"><option value="recent">Recently added</option><option value="az">A-Z</option><option value="category">Category</option></select>
          </div>
        )}

        {favouriteIds.length === 0 ? (
          <Card><CardContent className="p-8 text-center space-y-4"><Heart className="h-12 w-12 mx-auto text-primary" /><h2 className="text-xl font-semibold text-foreground">No favourites yet</h2><p className="text-sm text-muted-foreground">Tap the heart on a game card or game page to save it here.</p><Button onClick={() => (window.location.href = "/")}>Browse Games</Button></CardContent></Card>
        ) : favouriteGames.length === 0 ? (
          <Card><CardContent className="p-8 text-center space-y-3"><Search className="h-10 w-10 mx-auto text-muted-foreground" /><h2 className="text-xl font-semibold text-foreground">No matching favourites</h2><Button variant="outline" onClick={() => setQuery("")}>Clear Search</Button></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {favouriteGames.map((game) => {
              const coverImage = images[game.id] || game.image || getGameImage(game.id);
              return (
                <div key={game.id} className="rounded-lg border border-border bg-card overflow-hidden hover:bg-muted/50 transition">
                  <a href={`/game/${game.id}`}><div className="aspect-video bg-muted">{coverImage ? <img src={coverImage} alt={game.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="h-10 w-10 text-muted-foreground" /></div>}</div></a>
                  <div className="p-3 space-y-3"><div><p className="font-semibold text-foreground truncate">{game.title}</p>{game.category && <p className="text-xs text-muted-foreground mt-1 truncate">{game.category}</p>}</div><div className="flex gap-2"><Button size="sm" className="flex-1" onClick={() => (window.location.href = `/game/${game.id}`)}>Open</Button><Button size="sm" variant="outline" onClick={() => removeFavourite(game.id)}><Trash2 className="h-4 w-4" /></Button></div></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
