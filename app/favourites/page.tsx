"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getGameImage, type Game } from "@/lib/games";
import { ArrowLeft, Gamepad2, Heart, Search, Trash2 } from "lucide-react";

type PortalGame = Game & {
  image?: string | null;
  category?: string | null;
  featured?: boolean;
  hidden?: boolean;
  desktop_only?: boolean;
};

type SortMode = "recent" | "az" | "category";

export default function FavouritesPage() {
  const { isSignedIn } = useUser();
  const [games, setGames] = useState<PortalGame[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [blobImages, setBlobImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [removingGameId, setRemovingGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const loadFavourites = async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [gamesResponse, favouritesResponse, imagesResponse] = await Promise.all([
          fetch("/api/games"),
          fetch("/api/favourites"),
          fetch("/api/game-images"),
        ]);

        const gamesData = await gamesResponse.json();
        const favouritesData = await favouritesResponse.json();
        const imagesData = await imagesResponse.json();

        if (gamesResponse.ok && Array.isArray(gamesData)) {
          setGames(gamesData);
        }

        if (favouritesResponse.ok && Array.isArray(favouritesData.favourites)) {
          setFavouriteIds(favouritesData.favourites);
        } else if (!favouritesResponse.ok) {
          setMessage(favouritesData.error || "Could not load favourites.");
        }

        if (imagesResponse.ok && imagesData && typeof imagesData === "object") {
          setBlobImages(imagesData);
        }
      } catch (error) {
        console.error("[favourites] Load error:", error);
        setMessage("Could not load favourites.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFavourites();
  }, [isSignedIn]);

  const favouriteGames = useMemo(() => {
    const orderedGames = favouriteIds
      .map((id) => games.find((game) => game.id === id && !game.hidden))
      .filter((game): game is PortalGame => Boolean(game));

    const filteredGames = orderedGames.filter((game) => {
      const searchText = `${game.title} ${game.category || ""}`.toLowerCase();
      return searchText.includes(query.trim().toLowerCase());
    });

    if (sortMode === "az") {
      return [...filteredGames].sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortMode === "category") {
      return [...filteredGames].sort(
        (a, b) => (a.category || "Uncategorized").localeCompare(b.category || "Uncategorized") || a.title.localeCompare(b.title)
      );
    }

    return filteredGames;
  }, [favouriteIds, games, query, sortMode]);

  const removeFavourite = async (gameId: string) => {
    setRemovingGameId(gameId);
    setMessage("");

    try {
      const response = await fetch("/api/favourites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await response.json();

      if (response.ok) {
        setFavouriteIds((currentIds) => currentIds.filter((id) => id !== gameId));
      } else {
        setMessage(data.error || "Could not remove favourite.");
      }
    } catch (error) {
      console.error("[favourites] Remove error:", error);
      setMessage("Could not remove favourite.");
    } finally {
      setRemovingGameId(null);
    }
  };

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="h-5 w-5" />
              Sign in to view favourites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SignInButton mode="modal">
              <Button className="w-full">Login</Button>
            </SignInButton>
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
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Games
          </Button>
          <UserButton />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="h-7 w-7 fill-current" />
            My Favourites
          </h1>
          <p className="text-muted-foreground mt-2">{favouriteIds.length} saved {favouriteIds.length === 1 ? "game" : "games"}.</p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && message && (
          <div className="rounded-md bg-red-500/20 text-red-700 p-3 text-sm mb-4">✗ {message}</div>
        )}

        {!isLoading && favouriteIds.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search favourites..." className="pl-9" />
            </div>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="px-3 py-2 border border-border rounded-md bg-background text-foreground">
              <option value="recent">Recently added</option>
              <option value="az">A-Z</option>
              <option value="category">Category</option>
            </select>
          </div>
        )}

        {!isLoading && !message && favouriteIds.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">No favourites yet</h2>
                <p className="text-sm text-muted-foreground mt-1">Tap the heart on a game card or game page to save it here.</p>
              </div>
              <Button onClick={() => (window.location.href = "/")}>Browse Games</Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && favouriteIds.length > 0 && favouriteGames.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Search className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">No matching favourites</h2>
              <p className="text-sm text-muted-foreground">Try a different search term.</p>
              <Button variant="outline" onClick={() => setQuery("")}>Clear Search</Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && favouriteGames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {favouriteGames.map((game) => {
              const coverImage = blobImages[game.id] || game.image || getGameImage(game.id);

              return (
                <div key={game.id} className="rounded-lg border border-border bg-card overflow-hidden hover:bg-muted/50 transition group">
                  <a href={`/game/${game.id}`}>
                    <div className="aspect-video bg-muted relative">
                      {coverImage ? (
                        <img src={coverImage} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </a>
                  <div className="p-3 space-y-3">
                    <div>
                      <p className="font-semibold text-foreground truncate">{game.title}</p>
                      {game.category && <p className="text-xs text-muted-foreground mt-1 truncate">{game.category}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => (window.location.href = `/game/${game.id}`)}>Open</Button>
                      <Button size="sm" variant="outline" onClick={() => removeFavourite(game.id)} disabled={removingGameId === game.id}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
